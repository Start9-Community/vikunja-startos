# Testing the Repair action

The Repair action wraps `vikunja repair`, which fixes four data-integrity faults. On a healthy
install all four report "healthy" and there is nothing to see — so this directory exists to put real
faults in front of it.

Nothing here ships. `start-cli s9pk list-ingredients` packs `javascript/index.js`, `icon.svg`,
`LICENSE`, `instructions.md` and `assets/`; this directory is not among them, and `tsconfig.json`
includes `startos/**` only, so the `.ts` file here is neither type-checked nor bundled unless you
deliberately wire it in.

## The four faults

| Repair operation   | Broken state                                                  | Symptom                                                       |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `task-positions`   | Two tasks share a `position` in the same project view         | Tasks show in the wrong order, or jump when the page reloads   |
| `projects`         | `projects.parent_project_id` points at a project that is gone  | The project can't be edited, un-archived, or deleted in the UI |
| `file-mime-types`  | `files.mime` is empty                                         | Attachments download with no type                             |
| `orphan-positions` | `task_positions` rows for a deleted task or view              | None directly — dead rows that skew ordering repairs          |

They come from history: older versions, interrupted writes, and importers (upstream names Trello
imports for the orphaned-project case). **Current Vikunja will not produce them for you**, which is
the whole reason this directory exists. Tested against 2.4.0 and 2.5.0:

- Deleting a parent project cascades — the child, its tasks and every position row go with it, and
  archiving the child first changes nothing.
- Deleting a project view removes that view's position rows.
- The Vikunja file importer re-parents a dangling parent to the top level, drops positions whose
  task is not in the file, and re-detects MIME types from file content. (It does honour the
  `positions` array verbatim, so a doctored export can produce the duplicate-position fault — but
  only that one, which is why this directory uses SQL for all four instead.)

So the faults get written directly into SQLite. Two ways to do that, below: locally against a
throwaway Vikunja, or through the service itself on a StartOS box.

## 1. Locally, in Docker — about five minutes, no StartOS needed

This proves the repairs; it does not exercise the action.

```bash
LAB=/tmp/vikunja-lab
IMG=vikunja/vikunja:2.4.0
rm -rf "$LAB" && mkdir -p "$LAB/db" "$LAB/files" && chmod -R 777 "$LAB"

ENVS="-e VIKUNJA_DATABASE_TYPE=sqlite -e VIKUNJA_DATABASE_PATH=/data/db/vikunja.db \
 -e VIKUNJA_FILES_BASEPATH=/data/files -e VIKUNJA_SERVICE_SECRET=labsecret12345678901234 \
 -e VIKUNJA_CORS_ENABLE=false -e VIKUNJA_SERVICE_INTERFACE=:3456"

docker run --rm --user 1000:1000 -v "$LAB:/data" $ENVS --entrypoint /app/vikunja/vikunja $IMG \
  user create -u tester -p 'labpassword123' -e tester@example.com
docker run -d --name vk-lab -p 3456:3456 --user 1000:1000 -v "$LAB:/data" $ENVS \
  --entrypoint /app/vikunja/vikunja $IMG web
```

Log in at `localhost:3456`, **create a project with a few tasks and upload one attachment** — the
injection needs something to damage — then write the faults in. There is no `sqlite3` in the image;
`python3` ships SQLite, which is what this uses:

```bash
python3 - <<'PY'
import sqlite3
c = sqlite3.connect("/tmp/vikunja-lab/db/vikunja.db")

# task-positions: every task in one view onto a single position
c.execute("""UPDATE task_positions SET position = (
               SELECT MIN(p.position) FROM task_positions p
                WHERE p.project_view_id = task_positions.project_view_id)
             WHERE project_view_id = (
               SELECT project_view_id FROM task_positions
                GROUP BY project_view_id HAVING COUNT(*) > 1 LIMIT 1)""")

# projects: newest project parented to an id that does not exist
c.execute("UPDATE projects SET parent_project_id = 999999 WHERE id = (SELECT MAX(id) FROM projects)")

# file-mime-types: newest attachment loses its type
c.execute("UPDATE files SET mime = '' WHERE id = (SELECT MAX(id) FROM files)")

# orphan-positions: a position for a task that is gone, and one for a view that is gone
c.execute("""INSERT INTO task_positions (task_id, project_view_id, position)
               SELECT 999999, MIN(project_view_id), 4096.0 FROM task_positions""")
c.execute("""INSERT INTO task_positions (task_id, project_view_id, position)
               SELECT MIN(task_id), 999999, 2048.0 FROM task_positions""")
c.commit()
PY
```

That is the same SQL the injector action runs — it is kept here in plain form so it can be read
without building anything.

Then run the repairs the way the action runs them, dry first:

```bash
repair() { docker run --rm --user 1000:1000 -v "$LAB:/data" $ENVS \
  --entrypoint /app/vikunja/vikunja $IMG repair "$@"; }

for op in task-positions projects file-mime-types orphan-positions; do repair $op --dry-run; done
for op in task-positions projects file-mime-types orphan-positions; do repair $op; done
```

Every finding arrives as a `time=… level=INFO msg="…"` log line, which is why the action unwraps
`msg` instead of filtering log lines out the way Run Diagnostics does. A dry run should say:

```
[dry-run] Would repair 1 position conflicts in view 13
[dry-run] Would re-parent project 5 (Lab Child) from non-existent parent 999999 to top level
  Files scanned: 1 / Files updated: 1
Would delete 2 orphaned task positions.
```

and afterwards the tables should show distinct positions, `parent_project_id` back to 0, a detected
MIME type, and the two orphan rows gone. Tear down with `docker rm -f vk-lab && rm -rf "$LAB"`.

Two quirks worth knowing when reading the output:

- **`file-mime-types` counts the file as "updated" in a dry run** even though it writes nothing.
- **`projects` reports "Projects repaired: 0" in a dry run** but names what it would do.

Check the database, not the counters.

## 2. On a StartOS box — three commands and a sideload

This exercises the action itself, end to end, against real findings. The injection has to come from
inside the package: the app image is `FROM scratch` (the `vikunja` binary, no shell, no `sqlite3`),
and `start-cli package attach` only reaches subcontainers that are **already running** — it filters
the live set by guid, name or image id, so there is no way in from outside.

`testing/injector.py` does the wiring, so this is not a hand-edit:

```bash
python3 testing/injector.py enable    # copies in the action, registers it, adds a sqlite3 image
make x86
start-cli --host $H package install -s vikunja_x86_64.s9pk
```

Install a service and **create a project with a few tasks and upload one attachment** — the injector
needs something to damage. StartOS picks a fresh port for the web interface on every install, so ask
the package where it is rather than reusing an address from last time:

```bash
start-cli --host $H package action get-input vikunja set-primary-url | jq -r '.spec.url.values | keys[]'
```

Then run the two actions against each other. Both take input, and `package action run` needs an
event id from a preceding `get-input` call:

```bash
H=https://<your-host>
run() { EID=$(start-cli --host $H package action get-input vikunja $1 | jq -r .eventId); \
        echo "$2" | start-cli --host $H package action run vikunja $1 --event-id "$EID"; }

run inject-test-faults '{"fault":"all"}'
run repair '{"operation":"all","dryRun":true}'
run inject-test-faults '{"fault":"task-positions"}'   # its BEFORE block re-reads the counters
run repair '{"operation":"all","dryRun":false}'
```

Or drive both from **Actions → Other** in the web UI, where the injector sits beside Repair.

The injector prints the four fault counters before and after it writes, which is what each step is
checked against:

| After | duplicate positions | orphaned projects | files with no mime | orphan positions |
| ------------------------ | --- | --- | --- | --- |
| a clean install          | 0   | 0   | 0   | 0   |
| `inject-test-faults` all | 1   | 1   | 1   | 2   |
| Repair with dry run on   | 1   | 1   | 1   | 2   |
| Repair with dry run off  | 0   | 0   | 0   | 0   |

The middle row is the point of the dry run: it reported all four and changed nothing.

Then put the box back:

```bash
python3 testing/injector.py disable
make x86 && start-cli --host $H package install -s vikunja_x86_64.s9pk
start-cli --host $H package action get-input vikunja inject-test-faults   # → Not Found
```

`disable` reverses exactly the three edits `enable` made, so `git status` should be clean afterwards,
and a clean build's git hash carries no `-modified` suffix. Verify the injector action is gone before
you leave the box.

**Run this against a throwaway instance.** It damages data on purpose, and `vikunja repair` is the
only thing that puts it back.

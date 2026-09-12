/**
 * NOT PART OF THE PACKAGE. This file is deliberately outside `startos/`, so it
 * is neither type-checked (`tsconfig.json` includes `startos/**` only) nor
 * bundled (ncc follows imports from `startos/index.ts`). It exists so a
 * reviewer can produce all four faults on a real StartOS install:
 * `python3 testing/injector.py enable` wires it in, `disable` takes it back
 * out. See testing/README.md, and do not commit a build that has it
 * registered.
 *
 * It writes the four data-integrity faults `vikunja repair` fixes straight into
 * the live database. That has to happen from inside the package: the app image
 * is `FROM scratch` — the `vikunja` binary and nothing else, no shell and no
 * sqlite3 — and `package attach` can only reach subcontainers that are already
 * running, so there is no way in from the outside. Hence the throwaway `sqlite`
 * image this action pairs with.
 */
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { dataMount } from '../../utils'

const { InputSpec, Value } = sdk

const DB = '/data/db/vikunja.db'

const faults = {
  'task-positions': `UPDATE task_positions SET position = (
       SELECT MIN(tp.position) FROM task_positions tp
        WHERE tp.project_view_id = task_positions.project_view_id
     )
     WHERE project_view_id = (
       SELECT project_view_id FROM task_positions
        GROUP BY project_view_id HAVING COUNT(*) > 1 LIMIT 1
     );`,
  projects: `UPDATE projects SET parent_project_id = 999999
     WHERE id = (SELECT MAX(id) FROM projects);`,
  'file-mime-types': `UPDATE files SET mime = ''
     WHERE id = (SELECT MAX(id) FROM files);`,
  'orphan-positions': `INSERT INTO task_positions (task_id, project_view_id, position)
       SELECT 999999, MIN(project_view_id), 4096.0 FROM task_positions;
     INSERT INTO task_positions (task_id, project_view_id, position)
       SELECT MIN(task_id), 999999, 2048.0 FROM task_positions;`,
} as const

type Fault = keyof typeof faults

const REPORT = `
SELECT 'duplicate positions: ' || COUNT(*) FROM (
  SELECT project_view_id, position FROM task_positions
   GROUP BY project_view_id, position HAVING COUNT(*) > 1);
SELECT 'orphaned projects:   ' || COUNT(*) FROM projects p
  WHERE p.parent_project_id != 0
    AND NOT EXISTS (SELECT 1 FROM projects q WHERE q.id = p.parent_project_id);
SELECT 'files with no mime:  ' || COUNT(*) FROM files WHERE mime IS NULL OR mime = '';
SELECT 'orphan positions:    ' || COUNT(*) FROM task_positions tp
  WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = tp.task_id)
     OR NOT EXISTS (SELECT 1 FROM project_views v WHERE v.id = tp.project_view_id);
SELECT 'tasks / projects / files: ' || (SELECT COUNT(*) FROM tasks) || ' / '
    || (SELECT COUNT(*) FROM projects) || ' / ' || (SELECT COUNT(*) FROM files);
`

const inputSpec = InputSpec.of({
  fault: Value.select({
    name: 'Fault',
    description: null,
    default: 'all',
    values: {
      all: 'All four',
      'task-positions': 'Duplicate task positions',
      projects: 'Orphaned project',
      'file-mime-types': 'File with no MIME type',
      'orphan-positions': 'Orphaned task positions',
    },
  }),
})

export const injectTestFaults = sdk.Action.withInput(
  'inject-test-faults',

  {
    name: 'Inject Test Faults (DEV)',
    description:
      'DEV ONLY. Corrupts the Vikunja database on purpose so the Repair action has something to find. Never run this on data you care about.',
    warning:
      'This deliberately damages your Vikunja data. Only run it on a throwaway instance.',
    allowedStatuses: 'any',
    group: i18n('Other'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    const selected: Fault[] =
      input.fault === 'all'
        ? (Object.keys(faults) as Fault[])
        : [input.fault as Fault]

    const sql = selected.map((f) => faults[f]).join('\n')

    const out = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'sqlite' },
      dataMount,
      'vikunja-inject-faults',
      async (sub) => {
        const before = await sub.execFail(['/usr/bin/sqlite3', DB, REPORT], {
          user: 'root',
        })
        const write = await sub.exec(['/usr/bin/sqlite3', DB, sql], {
          user: 'root',
        })
        if (write.exitCode !== 0) {
          throw new Error(
            `sqlite3 failed: ${write.stderr.toString()}${write.stdout.toString()}`,
          )
        }
        const after = await sub.execFail(['/usr/bin/sqlite3', DB, REPORT], {
          user: 'root',
        })
        // The daemon owns these; a root-created sidecar would lock it out.
        await sub.exec(['/bin/sh', '-c', `chown -R 1000:1000 /data/db`], {
          user: 'root',
        })
        return [
          'BEFORE',
          before.stdout.toString().trim(),
          '',
          'AFTER',
          after.stdout.toString().trim(),
        ].join('\n')
      },
    )

    return {
      version: '1' as const,
      title: 'Faults Injected',
      message: out,
      result: null,
    }
  },
)

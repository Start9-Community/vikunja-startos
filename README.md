<p align="center">
  <img src="icon.svg" alt="Vikunja Logo" width="21%">
</p>

# Vikunja on StartOS

> Everything not listed in this document should behave the same as upstream
> Vikunja. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Vikunja](https://github.com/go-vikunja/vikunja) is a to-do and project-management application: lists, kanban boards, gantt views, reminders, and CalDAV. This package runs it against SQLite, manages accounts from StartOS actions rather than public sign-up, and keeps its accepted origins in step with wherever you have exposed it.

- **Upstream repo:** <https://github.com/go-vikunja/vikunja>
- **Wrapper repo:** <https://github.com/Start9-Community/vikunja-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Two images: the application, and a shell for the jobs it cannot do itself.

| Property      | Value                           |
| ------------- | ------------------------------- |
| Images        | `vikunja/vikunja` and `busybox` |
| Architectures | x86_64, aarch64                 |
| Command       | The image's own entrypoint      |

| Subcontainer  | Purpose                                  |
| ------------- | ---------------------------------------- |
| `vikunja-sub` | The only daemon — the one to `attach` to |

**The upstream image is built `FROM scratch`, and that has a concrete consequence.** It declares a numeric user but ships no `/etc/passwd` or `/etc/group`, so resolving that user fails. The package plants minimal entries into every subcontainer's filesystem before anything runs — the daemon and each command-line action alike.

**BusyBox is there because the application image has no shell.** The directory layout and ownership work at init needs one, so a second image supplies it.

## Volume and Data Layout

Two volumes, split by who owns the contents.

| Volume    | Mount Point   | Purpose                          |
| --------- | ------------- | -------------------------------- |
| `main`    | `/data`       | The database and the attachments |
| `startos` | — not mounted | The package's own store          |

| Path         | Written by       | Holds                                |
| ------------ | ---------------- | ------------------------------------ |
| `db/`        | Vikunja          | The SQLite database                  |
| `files/`     | Vikunja          | Task attachments                     |
| `store.json` | Init and actions | The session secret and every setting |

**The volume root is mounted, not the two subdirectories, and that is deliberate.** Mounting a subpath makes StartOS create that directory owned by root, which cannot then be changed from inside a user-namespaced container. Mounting the root and steering the application's paths into subdirectories with environment leaves the ownership fixable.

## File Models

One model, and its keys are literally the environment variable names.

| File         | Format | Modelled                | Written by       |
| ------------ | ------ | ----------------------- | ---------------- |
| `store.json` | JSON   | Yes — `FileHelper.json` | Init and actions |

Storing settings under their environment-variable names means they pass straight through to the daemon with no mapping layer. The store also carries the SMTP configuration and one bookkeeping flag.

**The session secret is generated once and preserved forever.** Vikunja's own default is a _random value generated at every startup_, which would log every user out on every restart. The package generates a persistent one instead — and generates it on **any** init that finds none, not only at install. That distinction is load-bearing: gating it on install alone left an upgrade or a restore from an older store with no secret and no way to ever get one, and the daemon refuses to start without it. It never regenerates when one exists.

**The accepted origins are computed from the interface's current addresses.** The frontend may be loaded from any address you have exposed, and every one of them has to be an accepted origin — so the list is rebuilt at start and is reactive, meaning adding a Tor address later re-runs with it already allowed.

**The primary URL is only used for outbound links**, but Vikunja refuses to start when it is empty while cross-origin checking is on. So it falls back to any reachable address, and with no address at all cross-origin checking is switched off rather than letting the daemon abort.

## Dependencies

None. Vikunja uses SQLite, so there is no database service to depend on.

Outbound traffic is only what you configure: SMTP, if you set it up.

## Network Access and Interfaces

One interface.

| Interface | Id      | Type | Port | Description           |
| --------- | ------- | ---- | ---- | --------------------- |
| Web UI    | `webui` | ui   | 3456 | The Vikunja interface |

**Vikunja's own login gates it**, and StartOS adds no gate of its own. CalDAV and two-factor authentication are both enabled by the package.

**Public registration is off by default**, which is what makes account creation an administrative action rather than something anyone reaching the address can do.

## Installation and First-Run Flow

Install prepares the data directory, generates the session secret, seeds a primary URL from the addresses available, and then raises a `critical` task: create the first user.

**That task is the only way to bootstrap an account**, because registration is disabled — and the ownership work happens at init rather than in the daemon chain precisely so the task is reachable before the daemon has ever started.

**The task is answered from reality, not from a flag.** The package records whether it created the first account, but treats that record as a cache: when it is not set it asks Vikunja's own command line whether any user exists. That is what stops the task nagging forever on a service whose first account was made some other way — by briefly enabling registration, or by restoring a store that predates the flag — and the task is explicitly cleared once a user is known to exist, since a filed `critical` task keeps blocking startup until something retracts it.

## Actions

Fourteen actions, in three groups, and they work in two ways.

**The account and maintenance actions run Vikunja's own command-line tool** in a short-lived container against the live database. Each one boots Vikunja's runtime, so expect a few seconds per run. Running alongside the server is safe: SQLite is in WAL mode and waits on a busy lock rather than failing. Vikunja reports a failure on stdout rather than stderr; the package reads both, so an error arrives with Vikunja's reason attached.

**The settings actions write `store.json`**, which the server reads at start. Saving one restarts Vikunja, which costs a few seconds of downtime and no data. Every one of them is safe to repeat.

### Accounts

#### Create User

The way to make the first account, and any later one while public registration is off.

- **Changes:** adds the account, and records that a first account exists, which retires the install task.
- **Outputs:** the username and a generated password, shown once. StartOS keeps no copy; a lost password is what Reset User Password is for.
- **Repeat safety:** a second run with a username or email that is already taken fails without changing anything.

#### List Users

Read-only. If Vikunja ever changes its table format, the action shows the raw output rather than an empty list.

#### Reset User Password

For a locked-out user, or to prove an account survived a restore.

- **Input:** the account, picked from a list read from the database when the form opens.
- **Outputs:** a new generated password, shown once. No email is sent.
- **Repeat safety:** every run replaces the password again.

#### Delete User

Removes the account and everything it owns — projects, tasks, attachments — immediately, with no confirmation email.

- **Input:** the same account list.
- **Irreversible.** Only a backup brings the account back.
- **Repeat safety:** the account leaves the list; a form opened before the deletion fails with "no user matches".

#### Enable Registration / Disable Registration

Off by default. While it is on, anyone who can reach any exposed address can create an account.

#### Enable / Disable Self-Service User Deletion

Whether users can delete their own accounts from Vikunja's settings. On by default.

### Email

#### Configure SMTP

Disabled, the server's system SMTP, or custom credentials, with certificate verification and the authentication type under Advanced.

#### Send Test Email

Sends one message with the saved settings, without a restart. Run it after Configure SMTP; a failure carries the mailer's own error.

#### Enable Email Reminders

Has no effect until SMTP is configured.

### Other

#### Set Primary URL

The address used in links in outgoing email, chosen from the addresses StartOS reports for the interface. It does not control access — every reachable address is accepted regardless.

#### Enable Link Sharing

Off by default. A shared link exposes every task and attachment in its project.

#### Set Max Attachment Size

The upload limit, as a size string such as `20MB` or `2GB`.

#### Run Diagnostics

Runs `vikunja doctor`. Read-only and safe at any time; Vikunja's startup log lines are stripped so the report is what remains.

#### Repair

Runs one of `vikunja repair`'s four subcommands, or all four in order.

- **When:** tasks that appear out of order or move on reload, a project that cannot be edited, archived or deleted because its parent is gone, attachments stored without a file type (usually after an upgrade), or leftover ordering records.
- **Changes:** nothing with Dry Run on, the default. With it off, the rows each check reports.
- **Cost:** seconds for most checks. File Types inspects every attachment, so it grows with attachment storage.
- **Repeat safety:** idempotent. A second run against a healthy database reports nothing to fix.
- **What happens next:** no restart. Refresh the web interface to see the result.
- **On failure:** the run stops at the first check that fails, and the error carries the output of the checks before it.

## Tasks

Two, at different severities.

| Task            | Severity    | Raised when                           | Cleared when           |
| --------------- | ----------- | ------------------------------------- | ---------------------- |
| Create User     | `critical`  | An init that finds no account exists  | An account exists      |
| Set Primary URL | `important` | The stored URL is no longer reachable | A reachable URL is set |

`critical` blocks the service from starting; the first account has to exist.

**The URL task is deliberately only `important`.** A stale primary URL costs correct links in outgoing email, not access — because every reachable address is accepted as an origin regardless, and the daemon falls back to one of them.

## Health Checks

One check, on the only daemon.

| Check     | Displayed as    | Method                                       | Grace |
| --------- | --------------- | -------------------------------------------- | ----- |
| `vikunja` | "Web Interface" | HTTP fetch of the web interface on port 3456 | 30s   |

It loads the page, so it goes green only when Vikunja is answering requests, not merely holding the port. Any HTTP response counts; a fetch that errors or takes longer than five seconds fails. **It says nothing about email**: a wrong SMTP setting shows a green check and a reminder that never arrives, which is what the test-email action is for.

**A daemon that restarts in a loop with no failing check is almost always the session secret** — the start-up path refuses to run without one and logs which of the two causes it was, because StartOS otherwise surfaces a thrown start as a silent retry every few seconds.

## Backups and Restore

Both volumes are copied wholesale — `sdk.Backups.ofVolumes('main', 'startos')` — with only SQLite's shared-memory index (`*-shm`) excluded. StartOS stops the service before a backup, so the files are copied at rest.

**The write-ahead log is part of the database and is always included.** Vikunja runs SQLite in WAL mode and does not checkpoint on shutdown, so recent writes — on a lightly used server, nearly all of them — live only in `vikunja.db-wal`. Earlier versions of this package excluded that file, and their backups restore without those writes; take a new backup after updating. The `-shm` file is an index SQLite rebuilds on open.

What the backup holds is everything: the tasks, the attachments, the accounts, the session secret, and the SMTP credentials.

**The session secret is in the backup, and that is what you want** — a restore that changed it would invalidate every session.

## Limitations and Differences

1. **SQLite only.** There is no option to point Vikunja at PostgreSQL or MySQL.
2. **Public registration is off by default**, so the first account comes from an action.
3. **Accounts are managed by action.** Reset User Password and Delete User pick from the accounts that exist when the form opens.
4. **A newly added address is accepted immediately as an origin**, but the primary URL used in emails is a separate choice.
5. **The timezone is fixed to UTC.**
6. **Link sharing is off by default.**
7. **Email needs SMTP configured**; reminders silently do nothing without it.
8. **The upstream image ships no shell**, which is why a second image exists and why command-line actions run in temporary containers.

---

## Quick Reference for AI Consumers

```yaml
package_id: vikunja
image: vikunja/vikunja # plus busybox, for shell work the scratch image can't do
architectures:
  - x86_64
  - aarch64
subcontainers:
  - vikunja-sub # /etc/passwd + /etc/group are planted before anything executes
volumes:
  main: /data # db/ and files/ subdirs; the ROOT is mounted, not the subpaths
  startos: null # store.json only, not mounted
file_models:
  - store.json # keys are the env var names; secret, primary URL, toggles, SMTP
startos_managed_env_vars:
  - VIKUNJA_SERVICE_INTERFACE
  - VIKUNJA_SERVICE_ROOTPATH
  - VIKUNJA_SERVICE_TIMEZONE
  - VIKUNJA_SERVICE_ENABLECALDAV
  - VIKUNJA_SERVICE_ENABLETOTP
  - VIKUNJA_SERVICE_SECRET # persistent; upstream would randomize it per start
  - VIKUNJA_SERVICE_PUBLICURL
  - VIKUNJA_SERVICE_ENABLEREGISTRATION
  - VIKUNJA_SERVICE_ENABLEUSERDELETION
  - VIKUNJA_SERVICE_ENABLELINKSHARING
  - VIKUNJA_SERVICE_ENABLEEMAILREMINDERS
  - VIKUNJA_DATABASE_TYPE
  - VIKUNJA_DATABASE_PATH
  - VIKUNJA_FILES_BASEPATH
  - VIKUNJA_FILES_MAXSIZE
  - VIKUNJA_CORS_ENABLE
  - VIKUNJA_CORS_ORIGINS # whitespace-separated; every reachable address
  - VIKUNJA_MAILER_* # only when SMTP is configured
dependencies: []
interfaces:
  webui: { type: ui, port: 3456 } # Vikunja's own login; registration off by default
actions:
  - user-create
  - user-list
  - user-reset-password # only-running
  - user-delete # only-running
  - toggle-registration
  - toggle-user-deletion
  - manage-smtp
  - testmail
  - toggle-email-reminders
  - set-primary-url
  - toggle-link-sharing
  - max-attachment-size
  - doctor
  - repair
tasks:
  - { action: user-create, severity: critical } # cleared once any account exists
  - { action: set-primary-url, severity: important } # when the stored URL is unreachable
health_checks:
  - vikunja # displayed "Web Interface"; says nothing about email
```

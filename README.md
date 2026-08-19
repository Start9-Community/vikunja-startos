<p align="center">
  <img src="icon.png" alt="Vikunja Logo" width="21%">
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

Fourteen actions, in three groups. Most run the application's command line in a temporary container rather than touching the database directly.

### Accounts

#### Create User

Creates an account with a username, password, and optional email.

- **The way to make the first account**, and the action the install task points at.
- **Runnable at any status.**

#### List Users, Reset User Password, Delete User

Read the account list, set a new password for one, or remove one.

- **Reset and delete require the service to be running.**
- **Deleting a user is subject to Vikunja's own deletion setting** — see the toggle below.

#### Enable Public Registration

Turns anonymous sign-up on or off.

- **Off by default.** Turning it on means anyone who can reach the address can create an account.

#### Enable User Deletion

Controls whether users may delete their own accounts.

### Email

#### Configure SMTP

Points Vikunja at a mail server — the one StartOS provides, or one you supply, with the transport security, authentication type and certificate-verification behavior alongside it.

#### Send Test Email

Sends a message with the current settings, so a misconfiguration surfaces here rather than as a reminder that never arrives.

#### Enable Email Reminders

Turns reminder emails on or off. They need SMTP configured to do anything.

### Other

#### Set Primary URL

Chooses which of the service's addresses is used in outgoing links.

- **Pre-populated from the addresses StartOS has assigned**, rather than typed in freehand.
- **It does not control access.** Every reachable address is accepted regardless; this is the one that appears in emails and redirects.

#### Enable Link Sharing

Controls whether tasks and projects can be shared by public link. **Off by default.**

#### Maximum Attachment Size

The upload limit.

#### Doctor

Runs Vikunja's own diagnostic command and reports what it says.

**Command output is filtered before it is shown.** Vikunja boots its whole runtime for every command-line invocation, so its real output arrives buried under startup log lines; those are stripped so an action reports its answer rather than the noise around it.

#### Repair

Runs one of Vikunja's four `repair` subcommands — duplicate task positions, projects orphaned by a deleted parent, attachments with no MIME type, position records for deleted tasks or views — or all four in order, and reports what each one found.

**Dry run is the default**, and the description says to use it first: the repairs write to the database, and a dry run answers whether there is anything wrong before anything changes. The mode is a separate toggle rather than a fifth entry in the operation list, so *what to check* and *whether to change it* stay independent.

**`repair` on its own is a help screen, not a repair** — every actual repair is a subcommand, which is why this action takes input at all rather than mirroring Doctor.

**Its output cannot be filtered the way Doctor's is.** Doctor prints plain text with startup logs around it; repair reports its findings *as* log lines, so the filter that cleans Doctor up would delete the entire result. `unwrapVikunjaLogs` unwraps the `msg` field and drops bootstrap lines by message instead — including the license warning, which arrives at WARN rather than INFO.

**Runnable at any status**, like Doctor. The database is in WAL mode, so a repair run alongside the daemon is a second writer rather than a conflicting one.

**A failing subcommand stops the run** rather than continuing through the rest, and the error carries the output collected so far.

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

| Check     | Displayed as    | Method                 | Grace |
| --------- | --------------- | ---------------------- | ----- |
| `vikunja` | "Web Interface" | Port 3456 is listening | 30s   |

It reports that the interface is serving. **It says nothing about email**: a wrong SMTP setting shows a green check and a reminder that never arrives, which is what the test-email action is for.

**A daemon that restarts in a loop with no failing check is almost always the session secret** — the start-up path refuses to run without one and logs which of the two causes it was, because StartOS otherwise surfaces a thrown start as a silent retry every few seconds.

## Backups and Restore

Both volumes are copied, with SQLite's sidecar files excluded — `sdk.Backups.ofVolumes('main', 'startos').setOptions({ exclude })`.

**The write-ahead log, journal and shared-memory files are left out on purpose.** Capturing them mid-write can restore a database that disagrees with itself; excluding them restores the database as of its last consistent state.

What the backup holds is everything: the tasks, the attachments, the accounts, the session secret, and the SMTP credentials.

**The session secret is in the backup, and that is what you want** — a restore that changed it would invalidate every session.

## Limitations and Differences

1. **SQLite only.** There is no option to point Vikunja at PostgreSQL or MySQL.
2. **Public registration is off by default**, so the first account comes from an action.
3. **Accounts are managed by action**, and most of those actions require the service running.
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

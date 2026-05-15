<p align="center">
  <img src="icon.svg" alt="Vikunja Logo" width="21%">
</p>

# Vikunja on StartOS

> **Upstream docs:** <https://vikunja.io/docs/>
> **Upstream repo:** <https://github.com/go-vikunja/vikunja>
>
> Everything not listed in this document should behave the same as upstream
> Vikunja. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

[Vikunja](https://vikunja.io) is an open-source, self-hostable to-do and project manager — kanban boards, gantt charts, table views, attachments, labels, filters, and CalDAV in one app.

This package wraps Vikunja for StartOS. The first user is created via a gated StartOS Action (public registration is disabled by default), SMTP can be sourced from either StartOS's system SMTP or a custom server, and the public URL / CORS are managed automatically from the chosen primary URL.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions](#actions)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences from Upstream](#limitations-and-differences-from-upstream)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                          |
| ------------- | ---------------------------------------------- |
| Image source  | Upstream `vikunja/vikunja`, unmodified         |
| Helper image  | `busybox` (init-time only)                     |
| Architectures | `x86_64`, `aarch64`                            |
| Base          | `FROM scratch`, `USER 1000`                    |
| Entrypoint    | Default upstream entrypoint (web server)       |
| HTTP port     | 3456                                           |

The busybox helper image is invoked once during init to create `/data/db` and `/data/files` and chown `/data` to UID 1000. It is not part of the runtime daemon chain.

---

## Volume and Data Layout

| Volume | Mount Point | Purpose                                       |
| ------ | ----------- | --------------------------------------------- |
| `main` | `/data`     | SQLite database, attachments, package state   |

Layout inside the volume:

```
/data/
├── db/
│   └── vikunja.db        # SQLite database (VIKUNJA_DATABASE_PATH)
├── files/                # Task attachments (VIKUNJA_FILES_BASEPATH)
└── store.json            # StartOS package state (JWT secret, primary URL, toggles, SMTP)
```

The volume root is mounted at `/data` so Vikunja can chown the entire subtree. Mounting `subpath: 'db'` directly does not work for scratch images — those host directories would be owned by UID 0 and could not be chown'd from inside the user-namespace subcontainer.

---

## Installation and First-Run Flow

After install, two tasks appear on the Vikunja service page:

1. **Critical — Create Your First Vikunja User.** Public registration is disabled by default, so this action is the only way to create the initial account. It accepts username, email, and password (Vikunja's own validation rules), runs `vikunja user create` inside a temporary subcontainer, and returns the credentials. The action hides itself after success.
2. **Important — Set Primary URL.** StartOS auto-seeds a `.local` URL so the service can come up immediately, but this task asks you to confirm it (or pick `.onion` / a custom domain) before sharing the URL with users.

A persistent JWT secret is generated once at install time and stored in `store.json`, so container restarts and updates do not log everyone out.

Once the first user exists, log in at `https://<primary-url>/`.

---

## Configuration Management

| StartOS-Managed                                  | Upstream-Managed                                  |
| ------------------------------------------------ | ------------------------------------------------- |
| Primary URL → `VIKUNJA_SERVICE_PUBLICURL`        | All in-app preferences (theme, language, views)   |
| Persistent JWT secret → `VIKUNJA_SERVICE_SECRET` | Per-user account, profile, notifications          |
| Public registration on/off                       | Project / list / task management                  |
| Self-service user deletion on/off                | Sharing, teams, kanban, filters                   |
| Public link sharing on/off                       | Webhooks, API tokens                              |
| Email reminders on/off                           | TOTP enrollment                                   |
| Maximum attachment size                          | Migration imports (Todoist, Trello, Asana, etc.)  |
| SMTP (disabled / system / custom)                |                                                   |
| CORS origins (derived from primary URL)          |                                                   |
| Time zone (fixed to UTC)                         |                                                   |
| CalDAV and TOTP toggles (both forced on)         |                                                   |

All Vikunja configuration is plumbed via environment variables (`VIKUNJA_<SECTION>_<KEY>`) — there is no on-disk `config.yml`. The single source of truth for the env block is `getVikunjaEnv()` in `startos/utils.ts`. The same env is passed to the long-lived daemon AND every temp CLI subcontainer.

Mutable settings persist in `store.json` on the `main` volume:

| Field                  | Default                                          | Mutated by                          |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| `jwtSecret`            | generated on install                             | (internal — never overwritten)      |
| `primaryUrl`           | auto-seeded `.local` URL                         | Set Primary URL                     |
| `initialUserCreated`   | `false`                                          | Create Your First Vikunja User      |
| `smtp`                 | `{ selection: 'disabled' }`                      | Configure SMTP                      |
| `smtpAdvanced`         | `{ skipTlsVerify: false, authType: 'plain' }`    | Configure SMTP (Advanced group)     |
| `enableRegistration`   | `false`                                          | Enable / Disable Registration       |
| `enableUserDeletion`   | `true`                                           | Enable / Disable Self-Service User Deletion |
| `enableLinkSharing`    | `false`                                          | Enable / Disable Link Sharing       |
| `enableEmailReminders` | `false`                                          | Enable / Disable Email Reminders    |
| `maxAttachmentSize`    | `'20MB'`                                         | Set Max Attachment Size             |

A change to any of these triggers a daemon restart so the new env takes effect.

---

## Network Access and Interfaces

| Interface ID | Type | Port | Protocol | Path | Purpose         |
| ------------ | ---- | ---- | -------- | ---- | --------------- |
| `webui`      | UI   | 3456 | HTTP     | `/`  | Vikunja web app |

Single MultiHost (`'main'`) with one bound port. StartOS publishes the interface over LAN (`.local`), Tor (`.onion`), and any custom domains the operator adds; TLS is terminated at the StartOS edge.

CalDAV is reachable through the same web interface at `/dav/...` (`VIKUNJA_SERVICE_ENABLECALDAV=true`). It is not exposed as a separate StartOS interface card — point your CalDAV client at the same primary URL.

---

## Actions

Three groups appear in the StartOS UI (sorted alphabetically): **Accounts**, **Email**, **Other**. Names below match the literal `i18n('...')` strings in the action source.

### Accounts

| Display name                                                              | Action ID               | Availability   | Notes                                                                                            |
| ------------------------------------------------------------------------- | ----------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| Create Your First Vikunja User                                            | `create-initial-user`   | any            | Critical install task. Auto-hides after the first user exists (`initialUserCreated` flag).       |
| Create User                                                               | `user-create`           | any            | Create additional users while public registration is disabled.                                   |
| List Users                                                                | `user-list`             | any            | Parses Vikunja's `user list` table into per-user accordions; raw table available for copy.       |
| Reset User Password                                                       | `user-reset-password`   | only running   | `vikunja user reset-password --direct`. Auto-generates a strong password if the field is blank.  |
| Delete User                                                               | `user-delete`           | only running   | `vikunja user delete --now`. Immediate, irreversible. Requires explicit confirm checkbox.        |
| Enable Registration / Disable Registration                                | `toggle-registration`   | any            | Dynamic label. Default disabled.                                                                 |
| Enable Self-Service User Deletion / Disable Self-Service User Deletion    | `toggle-user-deletion`  | any            | Dynamic label. Default enabled.                                                                  |

### Email

| Display name                                       | Action ID                | Availability | Notes                                                                                            |
| -------------------------------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| Configure SMTP                                     | `manage-smtp`            | any          | Disabled / system / custom selector — visually mirrors `/system/email`. Advanced fields nested.  |
| Send Test Email                                    | `testmail`               | any          | `vikunja testmail`. Takes a recipient address and confirms delivery via the configured SMTP.     |
| Enable Email Reminders / Disable Email Reminders   | `toggle-email-reminders` | any          | Dynamic label. Default disabled. Warns if SMTP is not configured when enabling.                  |

### Other

| Display name                                | Action ID              | Availability | Notes                                                                              |
| ------------------------------------------- | ---------------------- | ------------ | ---------------------------------------------------------------------------------- |
| Set Primary URL                             | `set-primary-url`      | any          | Important install task. Reactive — the daemon restarts when the primary URL changes. |
| Enable Link Sharing / Disable Link Sharing  | `toggle-link-sharing`  | any          | Dynamic label. Default disabled. Warns about exposure when enabling.               |
| Set Max Attachment Size                     | `max-attachment-size`  | any          | Change `VIKUNJA_FILES_MAXSIZE` (string format like `20MB`, `200MB`, `2GB`).        |
| Run Diagnostics                             | `doctor`               | any          | `vikunja doctor` output for troubleshooting install or startup issues.             |

Every action that shells into Vikunja runs in a temporary subcontainer with `/etc/passwd` and `/etc/group` planted (the upstream `FROM scratch` image has neither) and the full env block plumbed in.

---

## Backups and Restore

`sdk.Backups.ofVolumes('main')` snapshots the entire `main` volume — that covers the SQLite database, every uploaded attachment, and `store.json` (JWT secret, primary URL, toggles, SMTP).

Restore re-runs the standard init chain: `seedFiles → initVolumeLayout → ensureSecret` (no-op when a secret is already in the restored store) `→ watchInitialUser → setupPrimaryUrl`. No restore-specific migrations.

---

## Health Checks

| Check         | Type           | Verifies                                | Grace period |
| ------------- | -------------- | --------------------------------------- | ------------ |
| Web Interface | daemon `ready` | `checkPortListening` on port 3456       | 30 s         |

Vikunja runs SQLite migrations on startup; the grace period accounts for migration time on slow disks. The success and failure messages shown in the StartOS UI are "The web interface is ready" and "The web interface is not ready".

---

## Dependencies

**None.** Vikunja runs against an embedded SQLite database — no Postgres, MySQL, or Redis sidecar is required.

---

## Limitations and Differences from Upstream

1. **No riscv64.** The upstream Docker image is published for `amd64` and `arm64` only.
2. **SQLite only.** PostgreSQL and MySQL/MariaDB backends are not exposed. SQLite fits the home-server / small-team use case StartOS targets.
3. **Public registration is disabled by default.** Upstream defaults to `enableregistration: true`; we override to `false`. Re-enable via the **Enable Registration** action if needed.
4. **Public link sharing is disabled by default.** Upstream defaults to `enablelinksharing: true`; we override to `false` because attachments on a shared project would otherwise be readable by anyone with the link.
5. **Email reminders are disabled by default.** Upstream defaults to `true`; without SMTP they would silently no-op, so we default off and warn if reminders are enabled before SMTP is configured.
6. **CalDAV is enabled but not surfaced as its own interface card.** Reachable at `https://<primary-url>/dav/...` — point your CalDAV client at that path.
7. **Time zone is fixed to UTC** (`VIKUNJA_SERVICE_TIMEZONE=UTC`). Per-user time zones in the Vikunja UI work as upstream.
8. **No on-disk `config.yml`.** Everything is wired through `VIKUNJA_*` environment variables. Anything documented as configurable only via `config.yml` and not exposed through env vars is not reachable on this package.

---

## What Is Unchanged from Upstream

The following work as documented upstream:

- Task management (kanban, gantt, table, list views; labels, filters, priorities, due dates, reminders, attachments)
- Project sharing, teams, and per-project permissions
- Migration imports from Todoist, Trello, Asana, Microsoft To Do, etc.
- API and personal API tokens (`/api/v1/...`)
- Webhooks
- TOTP / 2FA enrollment per user
- CalDAV access at `/dav/`
- Background jobs and recurring task scheduling
- All in-app user preferences (language, theme, default views, notification settings)
- Database migrations on startup
- The `vikunja` CLI's full behavior when invoked through actions (`user create`, `user list`, `user delete`, `user reset-password`, `testmail`, `doctor`)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and contribution guidelines.

---

## Quick Reference for AI Consumers

```yaml
package_id: vikunja
architectures: [x86_64, aarch64]
volumes:
  main: /data
ports:
  webui: 3456
dependencies: none
startos_managed_env_vars:
  - VIKUNJA_SERVICE_INTERFACE
  - VIKUNJA_SERVICE_ROOTPATH
  - VIKUNJA_SERVICE_PUBLICURL
  - VIKUNJA_SERVICE_SECRET
  - VIKUNJA_SERVICE_TIMEZONE
  - VIKUNJA_SERVICE_ENABLECALDAV
  - VIKUNJA_SERVICE_ENABLETOTP
  - VIKUNJA_SERVICE_ENABLEREGISTRATION
  - VIKUNJA_SERVICE_ENABLELINKSHARING
  - VIKUNJA_SERVICE_ENABLEUSERDELETION
  - VIKUNJA_SERVICE_ENABLEEMAILREMINDERS
  - VIKUNJA_DATABASE_TYPE
  - VIKUNJA_DATABASE_PATH
  - VIKUNJA_FILES_BASEPATH
  - VIKUNJA_FILES_MAXSIZE
  - VIKUNJA_MAILER_ENABLED
  - VIKUNJA_MAILER_HOST
  - VIKUNJA_MAILER_PORT
  - VIKUNJA_MAILER_FROMEMAIL
  - VIKUNJA_MAILER_USERNAME
  - VIKUNJA_MAILER_PASSWORD
  - VIKUNJA_MAILER_FORCESSL
  - VIKUNJA_MAILER_SKIPTLSVERIFY
  - VIKUNJA_MAILER_AUTHTYPE
actions:
  - create-initial-user
  - user-create
  - user-list
  - user-delete
  - user-reset-password
  - toggle-registration
  - toggle-user-deletion
  - manage-smtp
  - toggle-email-reminders
  - testmail
  - set-primary-url
  - toggle-link-sharing
  - max-attachment-size
  - doctor
```

Maintainer pointers:
- All env vars live in `getVikunjaEnv()` (`startos/utils.ts`).
- All actions register through `startos/actions/index.ts`.
- All init steps register through `startos/init/index.ts`.
- All locale strings live in `startos/i18n/dictionaries/default.ts` and `translations.ts`.
- Pitfalls (scratch image, USER 1000, volume layout, JWT secret) are documented in `CLAUDE.md`.

<p align="center">
  <img src="icon.svg" alt="Vikunja Logo" width="21%">
</p>

# Vikunja on StartOS

> **Upstream repo:** <https://github.com/go-vikunja/vikunja>
> **Upstream image:** [`vikunja/vikunja:2.3.0`](https://hub.docker.com/r/vikunja/vikunja)
> **Upstream license:** AGPL-3.0

[Vikunja](https://vikunja.io) is an open-source, self-hostable to-do and project manager — a drop-in replacement for Todoist, Asana, and Trello, with kanban boards, gantt charts, table views, attachments, labels, filters, and CalDAV.

This package wraps Vikunja for StartOS. The first user is created via a gated StartOS Action (public registration is disabled by default), SMTP can be configured to use either StartOS's system SMTP or a custom server, and the package follows the conventions used elsewhere in the Start9Labs catalog.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration](#configuration)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions](#actions)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences from Upstream](#limitations-and-differences-from-upstream)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                  |
| ------------- | -------------------------------------- |
| Image         | `vikunja/vikunja:2.3.0`               |
| Helper image  | `docker.io/busybox:1.36.1-musl`        |
| Architectures | x86_64, aarch64                        |
| Base          | `FROM scratch`, `USER 1000`            |
| Entrypoint    | `/app/vikunja/vikunja` (web server)    |
| HTTP port     | 3456                                   |

The busybox helper image is used at install time only — to create `/data/db` and `/data/files` and chown them to UID 1000. It is not part of the runtime daemon chain.

---

## Volume and Data Layout

| Volume | Mount Point | Purpose                                      |
| ------ | ----------- | -------------------------------------------- |
| `main` | `/data`     | SQLite database, attachments, internal state |

Layout inside the volume:

```
/data/
├── db/
│   └── vikunja.db        # SQLite database (VIKUNJA_DATABASE_PATH)
├── files/                # Task attachments (VIKUNJA_FILES_BASEPATH)
└── startos-store.json    # StartOS package state (JWT secret, primary URL, etc.)
```

The volume root is mounted at `/data` so that Vikunja can chown the whole subtree. Mounting `subpath: 'db'` directly does not work for scratch images (the host directory would be owned by UID 0 and cannot be chown'd from inside the user-namespace subcontainer).

---

## Installation and First-Run Flow

After install you will see two tasks in the Vikunja service page:

1. **Critical — Create Your First Vikunja User.** Public registration is disabled by default, so this action is the only way to create the initial account. The action accepts username, email, and password (with the same validation Vikunja itself applies), runs `vikunja user create` inside a temporary subcontainer, and returns the credentials in a copyable group. After it runs, the action hides itself.
2. **Important — Set Primary URL.** StartOS auto-seeds a `.local` URL so the service can come up immediately, but this task prompts you to confirm or change it before you start sharing the URL with users.

Once the first user exists, log in over `https://<primary-url>:<port>/`.

---

## Configuration

All Vikunja configuration is plumbed through environment variables (`VIKUNJA_<SECTION>_<KEY>` — Vikunja reads these natively). The single source of truth for the env block is `getVikunjaEnv()` in `startos/utils.ts`. The same env is passed to the long-lived daemon AND to every temp CLI subcontainer.

Mutable settings are persisted in `startos-store.json` (a `FileHelper.json` keyed against `sdk.volumes.main`). Fields:

| Field | Default | Mutable via |
| --- | --- | --- |
| `jwtSecret` | generated on install | (internal — do not edit) |
| `primaryUrl` | auto-seeded `.local` URL | Set Primary URL action |
| `initialUserCreated` | `false` | flipped by Create Initial User action |
| `smtp` | `{ selection: 'disabled' }` | Configure SMTP action |
| `smtpAdvanced` | `{ skipTlsVerify: false, authType: 'plain' }` | Configure SMTP action (Advanced group) |
| `enableRegistration` | `false` | Toggle Registration action |
| `enableUserDeletion` | `true` | Toggle Self-Service User Deletion action |
| `enableLinkSharing` | `false` | Toggle Link Sharing action |
| `enableEmailReminders` | `false` | Toggle Email Reminders action |
| `maxAttachmentSize` | `'20MB'` | Set Max Attachment Size action |

A change to any of these triggers a daemon restart so the new env takes effect.

---

## Network Access and Interfaces

| Interface ID | Type | Path | Description |
| ------------ | ---- | ---- | ----------- |
| `webui` | `ui` | `/` | The Vikunja web app |

Single MultiHost (`'main'`), single port (3456 internal, mapped to 80/443 externally with TLS termination at the StartOS edge).

---

## Actions

Grouped in the StartOS UI:

### Users

- **Create Your First Vikunja User** *(critical install task; hides itself after success)*
- **Create User** *(create additional users while registration is disabled)*
- **List Users**
- **Delete User** *(`vikunja user delete --now`; immediate, irreversible)*
- **Reset User Password** *(`vikunja user reset-password --direct`; admin-initiated, no email needed)*
- **Toggle Registration** *(dynamic label; default disabled)*
- **Toggle Self-Service User Deletion** *(dynamic label; default enabled)*

### Email

- **Configure SMTP** *(disabled / system / custom — visually mirrors `/system/email`; advanced fields below)*
- **Toggle Email Reminders** *(dynamic label; default disabled; warns if SMTP not configured)*
- **Send Test Email** *(`vikunja testmail`)*

### Other

- **Set Primary URL** *(important install task; reactive — daemon restarts on change)*
- **Set Max Attachment Size**
- **Toggle Link Sharing** *(dynamic label; default disabled with a security warning when enabling)*
- **Run Diagnostics** *(`vikunja doctor`)*

Every action that shells into Vikunja runs in a temp subcontainer with `/etc/passwd` and `/etc/group` planted and the full env block plumbed in.

---

## Backups and Restore

`sdk.Backups.ofVolumes('main')` snapshots the entire `main` volume. That covers the SQLite database, every uploaded attachment, and the StartOS internal state file. No special restore handling is needed — `restoreInit` re-runs the same init chain (`seedFiles` → `initVolumeLayout` → `ensureSecret` (no-op, secret already in restored store) → `tasksOnInstall` (skipped on restore) → `setupPrimaryUrl` → `watchSystemSmtp`).

---

## Health Checks

| Check | Type | What it verifies |
| ----- | ---- | ---------------- |
| Web Interface | daemon `ready` | `checkPortListening` on port 3456 |

Vikunja runs its own database migrations on startup. The 30 s `gracePeriod` on the daemon's ready check accounts for migration time on slow disks.

---

## Dependencies

None. Vikunja runs against an embedded SQLite database; no Postgres or Redis sidecar.

---

## Limitations and Differences from Upstream

- **No riscv64.** The upstream Docker image is published for amd64 and arm64 only.
- **SQLite only.** Postgres/MySQL/MariaDB backends are not exposed. SQLite is appropriate for the home-server / small-team use case StartOS targets.
- **Public registration is disabled by default.** Upstream defaults to `enableregistration: true`; we override to `false`. Re-enable with the Toggle Registration action if needed.
- **Public link sharing is disabled by default.** Upstream defaults to `enablelinksharing: true`; we override to `false` because attachments on shared projects would otherwise be readable by anyone with the link.
- **Email reminders are disabled by default.** Upstream defaults to `true`; without SMTP they would silently no-op, so we default off and surface a warning if the user enables reminders without SMTP.
- **No CalDAV interface exposed in StartOS UI.** CalDAV is enabled (`VIKUNJA_SERVICE_ENABLECALDAV=true`) and reachable at `https://<primary-url>/dav/...` but not exposed as a separate interface card.

---

## Quick Reference for AI Consumers

- Source layout described in `CLAUDE.md`.
- All env vars live in `getVikunjaEnv()` in `startos/utils.ts`.
- All actions register through `startos/actions/index.ts`.
- All init steps register through `startos/init/index.ts`.
- All locale strings live in `startos/i18n/dictionaries/default.ts` and `translations.ts` — every user-visible string in the package code passes through `i18n('...')`.
- Pitfalls (scratch image, USER 1000, volume layout, JWT secret) are documented in `CLAUDE.md`.

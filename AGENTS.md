# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `vikunja`.** A single `webui` service interface (host id `main`) serves the frontend, API, and CalDAV (at `/dav/`). Embedded SQLite — no database sidecar.
- **The upstream `vikunja/vikunja` image is `FROM scratch` with `USER 1000`.** Scratch has no `/etc/passwd`/`/etc/group`, so start-container's USER resolution fails unless entries are planted first. `plantPasswd` (utils.ts) writes minimal `root:0:0` and `vikunja:1000:1000` entries into every subcontainer's rootfs before anything execs — the daemon and every CLI subcontainer call it.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach vikunja -n vikunja -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — here `vikunja-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".

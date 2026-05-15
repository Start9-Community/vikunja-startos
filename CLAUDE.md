# Vikunja-startos — package notes for Claude

The packaging guide at `start-docs/packaging/` is the source of truth for SDK
patterns, recipes, and conventions. This file documents only the
package-specific quirks that aren't derivable from the docs or the code.

## Upstream version pull

`dockerTag` in `startos/manifest/index.ts` is `vikunja/vikunja:<version>`,
no `v` prefix — Docker Hub tags are bare semver, even though GitHub release
tags are `v<version>`.

## Bumping the upstream version

There is no migration history yet. Until the first migration, follow the
"rename in place" rule from `versions.md`:

1. Rename `startos/versions/v<old>.ts` → `startos/versions/v<new>.ts`.
2. Update the `version: 'X.Y.Z:0'` literal and the export name inside.
3. Translate `releaseNotes` for all five locales (en_US, es_ES, de_DE, pl_PL, fr_FR).
4. Update the import in `startos/versions/index.ts`.
5. Bump `dockerTag` in `startos/manifest/index.ts`.

Add a new `startos/versions/v<X>.ts` file (and append the prior version to
`other` in `index.ts`) only when the bump introduces an `up` or `down`
migration, or when you want the prior version's release notes preserved in
git history.

## Package-specific pitfalls

The upstream `vikunja/vikunja` image is `FROM scratch` with `USER 1000`.
That cascade is the source of every Vikunja-specific quirk in the package —
touch the affected files carefully:

- **Scratch /etc/passwd plant.** Scratch images have no `/etc/passwd` or
  `/etc/group`, so start-container's USER resolution fails. `plantPasswd`
  in `startos/utils.ts` writes minimal entries for `root:0:0` and
  `vikunja:1000:1000` into every subcontainer's rootfs. Must be called on
  the daemon subcontainer (in `main.ts`) AND on every temp CLI subcontainer
  (handled by `withVikunjaCli`). Skipping it produces start-container
  UID-resolution failures.

- **Volume bind mounts are owned by UID 0.** We mount the volume **root**
  at `/data` (`subpath: null`) and steer Vikunja into subdirs via
  `VIKUNJA_DATABASE_PATH=/data/db/vikunja.db` and
  `VIKUNJA_FILES_BASEPATH=/data/files`. Do NOT mount `subpath: 'db'`
  directly — those auto-create as UID 0 and we can't chown them from
  inside a user-namespace subcontainer.

- **Volume layout (mkdir + chown) runs at INIT time, not as a daemon
  oneshot.** `startos/init/initVolumeLayout.ts` uses a busybox temp
  subcontainer. A daemon-chain oneshot would never run, because the
  critical "Create Your First Vikunja User" task gates the user before the
  daemon ever starts.

- **CLI subcontainers need the SAME env as the daemon.** `getVikunjaEnv()`
  in `startos/utils.ts` is the single source of truth. `withVikunjaCli`
  wires it in. Don't pass partial env (e.g. only DB path) to a temp sub —
  Vikunja's `user create` command needs `VIKUNJA_SERVICE_PUBLICURL` to
  compose email confirmation links.

- **Persistent JWT secret.** `startos/init/ensureSecret.ts` generates
  `VIKUNJA_SERVICE_SECRET` once on install and stores it in
  `store.json.jwtSecret`. Without this, every container restart invalidates
  every JWT and logs everyone out.

## Conventions

- Interface IDs are `MultiHost('main')` + `createInterface('webui')` —
  matches mempool-startos. Do not rename — anything reading
  `serviceInterface.getOwn(effects, 'webui', ...)` would break.

- Every user-visible string flows through `i18n('...')` — including action
  `name`/`description`/`warning`, group labels, task `reason`, health-check
  messages, action result fields, and the `description` of every entry in
  an `InputSpec` `patterns: [...]` array. Adding a string requires adding
  the English literal as a key to
  `startos/i18n/dictionaries/default.ts` and translating in all four other
  locales in `translations.ts`. Plumbing errors (`throw new Error(...)`
  for invariants) stay English.

- Action `group` field uses `i18n('Accounts')` for user management,
  `i18n('Email')` for SMTP/email, and `i18n('Other')` for the rest. The
  StartOS UI sorts groups alphabetically, so groups render as Accounts →
  Email → Other. The "Accounts" name was chosen specifically for that
  alphabetical ordering — renaming it ("Users", etc.) would change the
  visual order in the UI.

- i18n placeholders use `${name}` template-literal syntax in the string
  keys (the SDK's `i18n()` substitutes `${name}`, NOT `{name}`).
  Single-quoted strings keep them literal. Dictionary keys, translations,
  and call sites must all match.

- The "Create Your First Vikunja User" task uses the canonical
  watch-state-and-prompt pattern (see `recipe-admin-credentials.md` and
  `init.md`). `startos/init/watchInitialUser.ts` runs on every init and
  surfaces the task while `initialUserCreated` is false; the action flips
  the flag, after which the watcher stops re-creating the task and the
  task auto-resolves on the next init pass. There is no explicit
  `clearTask` call — `createOwnTask` is idempotent on its replay key.

- `setupPrimaryUrl` does three things in one place: auto-seed a `.local`
  URL on first boot, surface an `important` task on install asking the
  user to confirm/change the URL, and surface a `critical` task whenever
  the previously-chosen URL becomes unreachable.

- Reactive SMTP and store reads happen inside `setupMain` via
  `getVikunjaEnv → resolveSmtpEnv`. There is no separate
  `watchSystemSmtp` init step; `main.ts`'s `.const(effects)` calls already
  re-run when system SMTP changes, restarting the daemon.

- Default values are exported once from the file model and imported where
  needed (e.g., `defaultMaxAttachmentSize` in
  `startos/fileModels/store.json.ts`).

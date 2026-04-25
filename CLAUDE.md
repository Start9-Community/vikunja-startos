## How the upstream version is pulled
- dockerTag in `startos/manifest/index.ts`: `vikunja/vikunja:<version>` (no `v` prefix — Docker Hub tags are bare semver, even though GitHub release tags are `v<version>`)
- Bumping the version: edit the version literal in three places — `startos/manifest/index.ts` (image tag), `startos/versions/v<version>.ts` (`VersionInfo.of({ version: 'X.Y.Z:0' })`), and `startos/versions/index.ts` (re-export). Add releaseNotes for all five locales (en_US, es_ES, de_DE, pl_PL, fr_FR).

## Pitfalls baked into the package design

The upstream `vikunja/vikunja` image is `FROM scratch` with `USER 1000`. That cascade is handled in three places — touch them carefully:

1. **`/etc/passwd` + `/etc/group` are missing in scratch.** `startos/utils.ts` exports `plantPasswd(sub)`. It must be called on the daemon subcontainer (in `main.ts`) AND on every temp CLI subcontainer (handled by `withVikunjaCli`). Skipping it produces start-container UID-resolution failures.
2. **Volume bind mounts are owned by UID 0.** We mount the volume **root** at `/data` (`subpath: null`) and steer Vikunja into subdirs via `VIKUNJA_DATABASE_PATH=/data/db/vikunja.db` and `VIKUNJA_FILES_BASEPATH=/data/files`. Do NOT mount `subpath: 'db'` directly — those auto-create as UID 0 and we can't chown them from inside a user-namespace subcontainer.
3. **Volume layout (mkdir + chown) runs at INIT time, not as a daemon oneshot.** `startos/init/initVolumeLayout.ts` uses a busybox temp subcontainer. A daemon-chain oneshot would never run, because the critical "Create First User" task gates the user before the daemon ever starts.
4. **CLI subcontainers need the SAME env as the daemon.** `getVikunjaEnv()` in `startos/utils.ts` is the single source of truth. `withVikunjaCli` wires it in. Don't pass partial env (e.g. only DB path) to a temp sub — Vikunja's user-create command needs `VIKUNJA_SERVICE_PUBLICURL` to compose email confirmation links.
5. **Persistent JWT secret.** `startos/init/ensureSecret.ts` generates `VIKUNJA_SERVICE_SECRET` once on install and stores it in `store.json.jwtSecret`. Without this, every container restart invalidates every JWT and logs everyone out.

## Conventions

- Interface IDs are `MultiHost('main')` + `createInterface('webui')` — matches mempool-startos. Do not rename — anything reading `serviceInterface.getOwn(effects, 'webui', ...)` would break.
- Every user-visible string flows through `i18n('...')`. Adding a string requires adding the English literal as a key to `startos/i18n/dictionaries/default.ts` and translating in all four other locales in `translations.ts`. Plumbing errors (`throw new Error(...)` for invariants) stay English.
- Action `group` strings: `'Accounts (User mgmt)'`, `'Email'`, `'Other'`. The StartOS UI sorts groups alphabetically — chosen so they render in the desired Accounts → Email → Other order without numeric prefixes.
- i18n placeholders use `${name}` template-literal syntax in the string keys (the SDK's `i18n()` substitutes `${name}`, NOT `{name}`). Single-quoted strings keep them literal. Dictionary keys, translations, and call sites must all match.

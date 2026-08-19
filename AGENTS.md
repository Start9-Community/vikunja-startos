# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **`plantPasswd` must run before anything executes in a subcontainer.** The upstream image is `FROM scratch` with `USER 1000` and ships no `/etc/passwd` or `/etc/group`, so start-container's user resolution fails without it — daemon and every CLI action alike.
- **`busybox` exists because the app image has no shell.** `initVolumeLayout` needs one for `mkdir -p` + `chown -R`.
- **Mount the volume ROOT, not `subpath: 'db'`.** StartOS auto-creates a mounted subpath as uid 0, which a user-namespaced subcontainer cannot chown. Mounting the root and steering Vikunja's paths via `VIKUNJA_*_PATH` is what makes the ownership fixable.
- **`main` logs before it throws on a missing secret.** StartOS retries a failed `main` on a timer and surfaces nothing anywhere, so without the `console.error` it reads as an unexplained 10-second restart loop.
- **CORS on with an empty `publicurl` aborts Vikunja at startup.** `publicurl` therefore falls back to any reachable address, and with no address at all CORS is switched **off** rather than left at its default. Origins are whitespace-separated — viper reads the env value back through `GetStringSlice`, which splits on `strings.Fields`.
- **Every reachable address is a CORS origin**, read reactively — enabling Tor later re-runs `main` with the new address already allowed. The primary URL is a separate concern: outbound links only.
- **`testing/` is not part of the package and never ships.** `s9pk list-ingredients` packs `javascript/index.js`, `icon.svg`, `LICENSE`, `instructions.md` and `assets/`, and `tsconfig.json` includes `startos/**` only, so the action source in there is neither compiled nor bundled. It exists because Vikunja will not produce the faults the Repair action fixes — `python3 testing/injector.py enable` wires a fault injector into a throwaway build, `disable` takes it back out. Not work notes; don't delete it.
- **Backups exclude `*-wal`/`*-journal`/`*-shm`.** Capturing SQLite's sidecars mid-write can restore a database that disagrees with itself.

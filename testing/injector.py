#!/usr/bin/env python3
"""Wire the fault injector into the package, or take it back out.

    python3 testing/injector.py enable     # then: make x86 && sideload
    python3 testing/injector.py disable    # then rebuild to get a clean package

The Repair action fixes four data-integrity faults, and Vikunja will not
produce any of them through normal use, so testing it means writing them into
the database on purpose. That has to happen from inside the package: the app
image is FROM scratch — the vikunja binary, no shell and no sqlite3 — and
`start-cli package attach` only reaches subcontainers that are already running.

So `enable` copies testing/inject-test-faults.ts into startos/actions/, registers
it, and adds a throwaway image carrying sqlite3 to the manifest. `disable` undoes
exactly those three edits. Both are idempotent, and neither touches anything else.

See testing/README.md.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "testing" / "inject-test-faults.ts"
ACTION = ROOT / "startos" / "actions" / "other" / "injectTestFaults.ts"
MANIFEST = ROOT / "startos" / "manifest" / "index.ts"
INDEX = ROOT / "startos" / "actions" / "index.ts"

IMAGE_ANCHOR = "    busybox: {"
IMAGE_BLOCK = """    // TESTING ONLY — sqlite3 for the fault injector; see testing/README.md
    sqlite: {
      source: { dockerTag: 'docker.io/keinos/sqlite3:latest' },
      arch: ['x86_64', 'aarch64'],
    },
"""

IMPORT_ANCHOR = "import { repair } from './other/repair'\n"
IMPORT_LINE = "import { injectTestFaults } from './other/injectTestFaults' // TESTING ONLY\n"

REGISTER_ANCHOR = "  .addAction(repair)\n"
REGISTER_LINE = "  .addAction(injectTestFaults) // TESTING ONLY\n"


def edit(path, anchor, addition, before=False, *, add):
    text = path.read_text(encoding="utf-8")
    present = addition in text
    if add and not present:
        if anchor not in text:
            sys.exit(f"{path}: anchor not found — has the file changed?\n  {anchor.strip()}")
        text = text.replace(anchor, addition + anchor if before else anchor + addition, 1)
    elif not add and present:
        text = text.replace(addition, "", 1)
    else:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def main():
    verb = sys.argv[1] if len(sys.argv) > 1 else ""
    if verb not in ("enable", "disable"):
        sys.exit(__doc__)
    add = verb == "enable"

    changed = []
    if add:
        if not ACTION.exists():
            ACTION.write_text(SOURCE.read_text(encoding="utf-8"), encoding="utf-8")
            changed.append(f"created {ACTION.relative_to(ROOT)}")
    elif ACTION.exists():
        ACTION.unlink()
        changed.append(f"removed {ACTION.relative_to(ROOT)}")

    if edit(MANIFEST, IMAGE_ANCHOR, IMAGE_BLOCK, before=True, add=add):
        changed.append(f"{'added' if add else 'removed'} the sqlite image")
    if edit(INDEX, IMPORT_ANCHOR, IMPORT_LINE, before=True, add=add):
        changed.append(f"{'added' if add else 'removed'} the import")
    if edit(INDEX, REGISTER_ANCHOR, REGISTER_LINE, add=add):
        changed.append(f"{'registered' if add else 'unregistered'} the action")

    print(f"{verb}d the fault injector" if changed else f"already {verb}d")
    for line in changed:
        print(f"  {line}")
    if add:
        print("\nnext: make x86 && start-cli --host <host> package install -s vikunja_x86_64.s9pk")
    else:
        print("\nnext: rebuild, and check `git status` is clean before committing")


if __name__ == "__main__":
    main()

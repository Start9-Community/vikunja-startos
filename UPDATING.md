# Updating the upstream version

Vikunja runs the official `vikunja/vikunja` image, pinned by tag in the manifest. The Docker Hub tag tracks the GitHub release tag one-to-one, except that Docker Hub tags are bare semver while GitHub release tags carry a leading `v`.

## Determining the upstream version

- [go-vikunja/vikunja](https://github.com/go-vikunja/vikunja) (GitHub releases — source of truth):

  ```
  gh release view -R go-vikunja/vikunja --json tagName -q .tagName
  ```

- [vikunja/vikunja](https://hub.docker.com/r/vikunja/vikunja) (Docker Hub — what the manifest actually pulls):

  ```
  curl -fsSL "https://hub.docker.com/v2/repositories/vikunja/vikunja/tags?page_size=20&ordering=last_updated" | jq -r '.results[].name'
  ```

Compare against `images.vikunja.source.dockerTag` in `startos/manifest/index.ts` (the version after the `:` in `vikunja/vikunja:<version>`).

## Applying the bump

- Bump `dockerTag` in `startos/manifest/index.ts` to `vikunja/vikunja:<new version>`, dropping the leading `v` from the GitHub release tag (Docker Hub tags are bare semver).

## Verifying the bump

- **The tag carries both architectures:**

  ```
  curl -fsSL "https://hub.docker.com/v2/repositories/vikunja/vikunja/tags/<version>" | jq -r '.images[] | "\(.os)/\(.architecture)"'
  ```

  Expect `linux/amd64` and `linux/arm64`.

- **The CLI the actions drive is unchanged.** Every account and diagnostic action shells out to the `vikunja` binary. Check each still takes the same arguments with `docker run --rm vikunja/vikunja:<version> <command> --help`:

  | Command                                          | Used by                          |
  | ------------------------------------------------ | -------------------------------- |
  | `user create --username --email --password`      | Create User                      |
  | `user list` (box-drawing table, parsed)          | List Users, the first-user check |
  | `user reset-password <user> --direct --password` | Reset User Password              |
  | `user delete <user> --now --confirm`             | Delete User                      |
  | `testmail <address>`                             | Send Test Email                  |
  | `doctor`                                         | Run Diagnostics                  |

- **No config key the package sets has moved.** The package configures Vikunja only through `VIKUNJA_*` environment variables (see `getVikunjaEnv` in `startos/utils.ts`). Diff `pkg/config/config.go` between the two tags and check none of them were renamed or removed.

- **Read the release post** at <https://vikunja.io/changelog/> for the whole range crossed, for security fixes to lead the release notes with.

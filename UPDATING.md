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

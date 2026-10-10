# Releases

Releases publish from an annotated Git tag matching the version in the root `package.json` (for example, `vX.Y.Z-beta.N`). The tag must point to the `main` commit that introduced that package version. The release workflow runs anti-slop rule regression, lint, typecheck, build, browser E2E, and packed-consumer checks before publishing the exact verified tarball with npm provenance. Beta versions publish to the `beta` dist-tag; stable versions publish to `latest`. Versions are immutable and are never republished.

All package releases share one concurrency group, and the workflow requires a release version to be strictly newer than the version already on its target npm dist-tag. If tags are pushed close together, an older queued release fails rather than moving the channel backward.

One-time maintainer setup:

1. In npm package settings for `robot-heads-solid`, configure **Trusted Publishers** for GitHub Actions with repository owner `jhomra21`, repository `robot-heads-solid`, workflow filename `release.yml`, and GitHub environment `npm-publish`. Do not create or store an npm token.
2. In GitHub repository settings, create the `npm-publish` environment. Optionally require a reviewer to approve publication; do not add environment secrets.
3. Ensure GitHub Actions is allowed to run and protect the `v*` tag namespace so only release maintainers can create release tags.

For each release, merge the versioned package change to `main`, then create and push its matching tag:

```sh
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

Do not run `npm publish` locally. If npm Trusted Publishing is not configured or the workflow binding does not match, the publish job fails without a token fallback.

# Anti-slop plugin provenance

The 38 plugin assets were copied, without changes, by
`node /Users/juan/.factory/skills/install-anti-slop/scripts/install.mjs`
from `/Users/juan/.factory/skills/install-anti-slop/assets/anti-slop/`
on 2026-10-09. The upstream repository and revision for the bundled
anti-slop plugin are **unknown**: the installed skill assets have no
recoverable Git revision. `SHA256SUMS` records the exact pristine bytes of
every copied asset (SHA-256 of the manifest:
`69fa217ad6262822167aeaa4b4cf9d10bddbba0bd9fcb7f83e1807f3707bdca3`).
This manifest and the untouched copied files constitute a recoverable
pristine snapshot within this repository. This provenance file and
`SHA256SUMS` were added after copying; neither is a bundled asset.

Installed plugin entry point: `tools/oxlint/anti-slop/index.ts`.
The optional Effect entry point and its rules are copied as part of the
bundle but are **not** enabled: this project has no direct `effect` dependency.
Intentional local deviation: `no-shape-in-symbol-names` accepts an optional
`geometricNames` array for exact, explicitly named geometric-domain symbols.
The repository lists its twelve legitimate geometric symbol names while
leaving unrelated structural naming violations at error severity.
`tests/geometry-vocabulary.test.ts` verifies legitimate names pass and a
structural `requestShape` fails. The original rule implementation is recoverable
from the bundled skill snapshot and SHA256SUMS; the manifest intentionally
remains the checksum of pristine copied assets. `no-runtime-typeof` uses its
bundled `allowInTypeGuards` option for actual typed union predicates. No other
bundled rule or helper was modified.

The nested `vendor/eslint-stylistic/UPSTREAM.md` documents that embedded
rule's source (eslint-stylistic commit
`435c3ea0fd26a5fef9042c4b36b6e165fbbf8d08`) and local adaptations.
Its `LICENSE` is retained with the installed plugin.

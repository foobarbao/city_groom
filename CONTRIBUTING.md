# Contributing to City Groom

This document describes the Git workflow, commit conventions and review
process. Coding rules are in
[`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md).

## 1. Branches

A simplified Git Flow model:

| Branch | Role | Protected | Merged from |
|---|---|---|---|
| `main` | Released / distributed code. Every merge is a tagged release. | Yes | `release/*`, `hotfix/*` |
| `develop` | Integration of finished features. Always working. Default branch. | Yes | `feature/*`, `fix/*`, `docs/*`, `chore/*` |
| `feature/<topic>` | New feature. | No | — |
| `fix/<topic>` | Non-urgent bug fix. | No | — |
| `docs/<topic>` | Documentation only. | No | — |
| `chore/<topic>` | Tooling, dependencies, CI. | No | — |
| `release/vX.Y.Z` | Release preparation (feature freeze, version number, changelog). | No | `develop` |
| `hotfix/<topic>` | Urgent fix on production. | No | `main` |

Branches created by the AI assistant use the `claude/<topic>` prefix and follow
the same pull request and review rules.

Rules:

- **Nobody pushes directly to `main` or `develop`**: everything goes through a
  pull request.
- One branch = one topic. Branches are short-lived (a few days at most) and
  deleted after merge.
- Names are in English and `kebab-case`: `feature/locker-map`,
  `fix/gps-permission-crash`.
- A `release/*` or `hotfix/*` branch merged into `main` is also merged into
  `develop`.

## 2. Commits — Conventional Commits

Format:

```
<type>(<optional scope>): <imperative summary, ≤ 72 characters>

<optional body: why the change was made>

<optional footer: Refs #12, BREAKING CHANGE: ...>
```

Allowed types:

| Type | Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Restructuring without behaviour change |
| `perf` | Performance improvement |
| `test` | Adding / fixing tests |
| `build` | Build, dependencies, Capacitor / Android configuration |
| `ci` | Continuous integration |
| `chore` | Miscellaneous maintenance |

Suggested scopes: `backend`, `customer`, `merchant`, `admin`, `api-client`,
`docs`, `adr`, `infra`.

Examples:

```
feat(customer): display nearby lockers on the map
fix(backend): reject orders on a full locker
docs(adr): record hosting decision
```

Small, coherent commits: each commit builds and makes sense on its own.

## 3. Pull requests

1. Create the branch from an up-to-date `develop`.
2. Develop according to the
   [definition of done](docs/CODING_STANDARDS.md#11-definition-of-done).
3. Open a pull request to `develop`, filling in the template (description,
   updated documentation, tests, screenshots for UI changes).
4. CI must be green (lint, type check, tests, build).
5. At least one approving review before merge.
6. **Squash merge** for work branches (readable `develop` history: one pull
   request = one commit); **merge commit** for `release/*` and `hotfix/*` into
   `main`.

## 4. Versioning

- **SemVer**: `MAJOR.MINOR.PATCH`. While the project is a demo, versions stay
  at `0.x.y`.
- Each release is tagged on `main` (`v0.1.0`) and described in `CHANGELOG.md`
  ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format).
- The Android `versionCode` is incremented for every distributed APK.

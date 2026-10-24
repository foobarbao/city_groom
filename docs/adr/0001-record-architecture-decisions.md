# ADR-0001 — Record architecture decisions

- **Status**: Accepted
- **Date**: 2026-10-24

## Context

The project starts as a demo but must serve as the foundation for production.
Choices made now (stack, storage, authentication, hosting, distribution) will
have lasting consequences, and their rationale is quickly lost if it is not
written down.

## Decision

Every structural decision is recorded in an ADR (Architecture Decision Record),
using the short format described in [`TEMPLATE.md`](TEMPLATE.md):

- one file per decision: `docs/adr/NNNN-title-in-kebab-case.md`, sequential
  numbering, never reused;
- possible statuses: `Proposed`, `Accepted`, `Rejected`,
  `Superseded by ADR-XXXX`, `Deprecated`;
- an accepted ADR is not changed in substance afterwards: a new ADR supersedes
  it, and the status of the old one is updated;
- the ADR is added in the pull request that implements the decision (or before,
  in a dedicated pull request, if the decision needs discussion).

## Consequences

- The history of choices and their reasons can be consulted in the repository.
- A small writing overhead for each important decision, accepted given the
  production goal.

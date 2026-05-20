# 02 Architecture

## Contract Boundary
| Item | Contract |
|---|---|
| Input objects | `ImplementationProject`, intake snapshot refs, promoted topic/package context |
| Output objects | `CoreMotiveIdentity`, `CoreMotiveSet`, `CoreMotiveVersion`, motive assertion records, `MotiveEvidenceBoardVersion`, `CrossBoardReview`, `MotivePortfolioDecision` |
| Authority writer | motive/evidence board service through `StateWriter` when available |
| Gates | motive admission, evidence-board trace gate, semantic-change gate, portfolio constraint gate, primary-motive confirmation gate |
| Trace | source literature refs, upstream refs, challenge refs, internal interpretation refs marked non-citable, portfolio decision refs |
| Handoff | T-095 receives motive assertions, evidence gaps, conflicts, validation candidates, portfolio priority, and active motive constraints |

## Contract Review
- Assertions must separate motivation, method, empirical, and scope claims.
- Evidence bindings are support/challenge/context, not final claim evidence.
- Board display summaries are UI/context only and cannot feed citation authority.
- `CoreMotiveSet` must keep active and primary motive counts within configured portfolio constraints.
- `CrossBoardReview` is a structured review cycle, not just UI browsing.
- `MotivePortfolioDecision` is required for role changes, merge/split, park, abandon, and primary replacement.

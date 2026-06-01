# 06 Evaluation Matrix

## Outcome
T-101 converts the frozen roadmap and design-doc rules into repeatable checks. The default evaluation suite is deterministic and credential-free.

## D1-D10 Coverage
| Decision | Rule under evaluation | Evidence |
|---|---|---|
| D1 | `PaperImplementation` is the implementation lane; `PaperProject` is writing/delivery. | Full-flow replay starts from `ImplementationProject` and ends at dossier-derived writing packet only. |
| D2 | Intake bootstraps from active bridge handoff plus matching hash. | `T-101 blocks authority bypass...` checks changed bridge hash conflict and admitted hash stability. |
| D3 | Retired pre-writing control-plane artifacts are not authority, wrappers, or compatibility inputs. | UI static boundary test rejects retired authority references in paper implementation workbench paths. |
| D4 | `ImplementationDossier` is writing-prep authority; packet is projection. | Full-flow replay creates ready dossier before `WritingEntryPacket`; packet carries dossier trace/hash lineage. |
| D5 | Experiments run through `ResearchWorkOrder` and retain all outcomes. | Full-flow replay records a trusted failed run as `RunEvidenceUnit`; blocked-path anchors verify orphan callbacks stay untrusted. |
| D6 | Writing-affecting objects require trace and claim packets. | Full-flow replay creates trace manifests, citation candidate, claim trace packet, dossier readiness, and packet projection. |
| D7 | AI workflow output is proposal-only under harness gates. | Blocked-path test verifies direct authority mutation becomes blocked harness run and critical queue item. |
| D8 | Human confirmation authorizes high-risk transitions, not direct state writes. | T-101 directly blocks a strong claim without explicit human confirmation; child tests cover primary replacement and information-gain override. |
| D9 | Desktop workbench is queue-first command/read-model UI. | UI static boundary verifies no local readiness authority; Fastify route-level smoke verifies backend-backed bootstrap, read model, trace queue, and decision queue surfaces. |
| D10 | Child split follows flow nodes with explicit owners and gates. | Child coverage anchor verifies T-092 through T-100 test evidence remains present. |

## Frozen Ruleset Coverage
| Rule | Required behavior | Evaluation evidence |
|---|---|---|
| FR-01 | V1 produces `ImplementationDossier`, not just motive/claim state. | Full-flow replay creates dossier before writing packet. |
| FR-02 | Every dossier claim has `ClaimTracePacket`. | Full-flow replay admits claim with included claim trace packet. |
| FR-03 | Claim trace separates lineage categories. | Claim trace packet fixture separates literature, experiment, artifact, decision, and internal interpretation. |
| FR-04 | Citation needs citable source evidence and `SourceLocator`. | Blocked-path test rejects missing locator. |
| FR-05 | Memo/rationale/summary cannot be evidence/citation. | Blocked-path test rejects display-summary hard-gate misuse; child anchors cover memo support rejection. |
| FR-06 | Admitted motive semantic contract is versioned/traceable. | Full-flow replay admits trace-ready motive; child anchors cover vNext without evolution decision. |
| FR-07 | Validation cycle needs snapshot, criteria, budget, information gain. | Full-flow replay creates cycle with input snapshot/criteria/budget; child anchors cover missing fields and low-info loop review. |
| FR-08 | Experiments must go through WorkOrder harness. | Full-flow replay creates/admit/submits WorkOrder before monitor ingestion. |
| FR-09 | Failed runs enter ledger. | Full-flow replay stores failed `RunEvidenceUnit`, admits only a negative-result claim from that failed evidence, and includes it in dossier accounting. |
| FR-10 | Exploratory/autotune and confirmatory are separated. | WorkOrder request uses confirmatory run with frozen config; child anchors cover AutoTune primary misuse. |
| FR-11 | Harness does not decide research direction or bypass state writer. | AI blocked-path test keeps direct mutation as blocked proposal/queue item. |
| FR-12 | Pre-writing output needs `TraceManifest`. | Queryability guard checks trace fields; full-flow replay uses trace for dossier and writing packet. |

## Child Package Coverage
| Child | Closure evidence used by T-101 |
|---|---|
| T-092 | Object/component map and queryability matrix are consumed by T-101 docs and queryability test. |
| T-093 | Bootstrap and feedback boundaries are replayed and hash-drift blocked. |
| T-097 | Trace manifest, citation, claim trace, field-role, and repair queue rules are tested. |
| T-094 | Motive admission and evidence board are replayed; portfolio drift anchors remain executable. |
| T-095 | Validation planning and loop-budget anchor remain executable. |
| T-096 | WorkOrder, monitor trust, and failed-run ledger are replayed. |
| T-098 | Result interpretation, claim boundary, dossier readiness, and writing projection are replayed. |
| T-099 | Harness proposal-only and direct mutation blocking are tested. |
| T-100 | Workbench static boundary, Fastify route-level smoke, and T-100 Chrome screenshot evidence cover UI command path. |

## Closure Gate
T-101 passes only if the targeted evaluation test file, shared/backend regression, DB context verification, desktop typecheck, and project governance lint pass.

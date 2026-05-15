# 02 Architecture

## Core Routes
- `POST /topic-selection/v1c/promotion-input-snapshots`
- `GET /topic-selection/v1c/promotion-input-snapshots/{snapshotId}`
- `POST /topic-selection/v1c/promotion-decision-support`
- `GET /topic-selection/v1c/promotion-decision-support/{supportId}`
- `GET /topic-selection/v1c/promotion-dossiers/{dossierId}`
- `POST /topic-selection/v1c/promotion-gate-checks`
- `GET /topic-selection/v1c/promotion-gate-checks/{gateCheckId}`
- `POST /topic-selection/v1c/promotion-decisions`
- `GET /topic-selection/v1c/promotion-decisions/{promotionDecisionId}`
- `POST /topic-selection/v1c/paper-project-bridges`
- `GET /topic-selection/v1c/paper-project-bridges/{bridgeId}`
- `POST /topic-selection/v1c/downstream-feedback`
- `GET /topic-selection/v1c/downstream-feedback/{feedbackId}`
- `POST /topic-selection/v1c/downstream-feedback/{feedbackId}/recheck-requests`
- `GET /topic-selection/v1c/recheck-requests/{recheckRequestId}`

## Replay Routes
- `POST /topic-selection/v1c/offline-evaluation/datasets`
- `POST /topic-selection/v1c/offline-evaluation/datasets/synthetic-baseline`
- `POST /topic-selection/v1c/offline-evaluation/cases`
- `POST /topic-selection/v1c/offline-evaluation/runs`
- `POST /topic-selection/v1c/offline-evaluation/case-results`
- `POST /topic-selection/v1c/offline-evaluation/runs/{runId}/complete`
- `GET /topic-selection/v1c/offline-evaluation/runs/{runId}/metric-results`
- `GET /topic-selection/v1c/offline-evaluation/runs/{runId}/replay-diffs`

## Boundary
HTTP exposes the completed service chain. It does not add business rules beyond validation, id precedence, error mapping, and route-level stage forcing.

## Review Checklist
- Route schemas match shared contracts.
- `buildApp()` wiring supports memory and Prisma modes.
- Replay routes cannot write production authority objects.
- OpenAPI and API index stay synchronized.

## Route Closure Rules
- POST routes create artifacts only through service-layer business rules.
- GET routes expose review artifacts needed before advancing to the next step.
- Path ids override body ids for decision, bridge, feedback, recheck, and replay completion routes.
- v1c replay routes force `stage='v1c'` even if a body attempts another stage.

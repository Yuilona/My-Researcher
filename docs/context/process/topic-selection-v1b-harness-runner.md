# Topic Selection v1b Harness Runner Guide

## Conclusions

- Use `pnpm topic-selection:v1b-harness-e2e` for the fast local v1b fixture smoke.
- Use `pnpm topic-selection:v1b-near-prod-deep-test` for the current near-production v1b deep test bundle. It composes existing harness/runtime/provider entries and writes one summary artifact.
- The default `TOPIC_SELECTION_V1B_HARNESS_REPEAT` is `1`; this is intentional for local development and focused harness smoke.
- Use `pnpm topic-selection:v1b-provider-canary` for current provider-backed slot canaries. This runs the v1b N4/N6/N8 provider-required-live checks through `TopicSelectionProviderCanaryService`; it does not run an N1-N11 provider harness chain.
- Use `pnpm topic-selection:v1b-external-codex-n4-variance` when testing external Codex CLI N4 slice-option variance. This creates independent `codex exec` N4 draft sessions and admits their frozen outputs through deterministic N4 gates.
- Use `pnpm topic-selection:v1b-external-codex-n6-variance` when testing external Codex CLI N6 candidate variance. This creates independent `codex exec` N6 draft sessions and admits their frozen outputs through deterministic N6 gates.
- Use `pnpm topic-selection:v1b-external-codex-n8-variance` when testing external Codex CLI N8 value-draft variance. This keeps setup deterministic through N7, then admits independent external Codex N8 drafts through deterministic value gates.
- `repeat` means exactly N independent workflow chains in one process. It is not a retry budget, not an upper bound, and not a majority-vote target.
- Do not reintroduce legacy v1b write routes. The accepted local automation path is the v1b WorkflowHarness HTTP route plus harness artifact routes.
- `pnpm topic-selection:real-e2e` may still validate the surrounding v1a/v1c flow, but its v1b leg must delegate to the standalone v1b harness runner. Do not use it to revive legacy v1b write-route orchestration or quality-negative direct-route mode.
- When `.env.local` selects Prisma repositories, run `pnpm db:dev:migrate` before local harness canaries if the dev DB is fresh or has schema drift.

## When To Use Each Entry

| Need | Command | Expected scope |
| --- | --- | --- |
| Fast local regression | `pnpm topic-selection:v1b-harness-e2e` | Fixture-backed N1-N11 run, default `repeat=1`, no live provider calls. |
| Near-production v1b deep test | `pnpm topic-selection:v1b-near-prod-deep-test` | Prisma full-chain fixture run, promoted runtime stress, runtime/compression/admission unit layer, and provider slot canary. |
| External Codex N4 variance | `pnpm topic-selection:v1b-external-codex-n4-variance` | Fixture-backed setup through N3, then `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` independent external Codex CLI N4 slice-option drafts admitted through deterministic N4 gates. |
| External Codex N6 variance | `pnpm topic-selection:v1b-external-codex-n6-variance` | Fixture-backed setup through N5, then `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` independent external Codex CLI N6 drafts admitted through deterministic N6 gates. |
| External Codex N8 variance | `pnpm topic-selection:v1b-external-codex-n8-variance` | Fixture-backed setup through N7, then `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` independent external Codex CLI N8 value drafts admitted through deterministic N8 gates. |
| Provider slot canary | `pnpm topic-selection:v1b-provider-canary` | Live OpenAI/DashScope N4/N6/N8 slot checks through `AgentOrchestrator -> BackendLlmGateway`; prompt-cache hits still require provider calls, response reuse remains non-authority, and over-budget fixtures call zero providers. |
| Existing v1a bundle into v1b | `TOPIC_SELECTION_V1B_HARNESS_INPUT_BUNDLE_ID=<id> pnpm topic-selection:v1b-harness-e2e` | Consumes an already-persisted `V1bInputBundle` instead of creating fixture v1a handoff data. |
| Surrounding v1a/v1b/v1c check | `pnpm topic-selection:real-e2e` | Validates v1a resource sampling and v1c/PaperProject surroundings when current local content is available; v1b itself is delegated to the standalone harness runner. |

## Repeat Semantics

`TOPIC_SELECTION_V1B_HARNESS_REPEAT=<n>` is a deterministic loop around the whole runner. The runner starts exactly N independent chains and fails fast on the first failed chain. Passing `repeat=3` therefore means three complete N1-N11 chains must pass.

Provider transport retries are not configured through the v1b harness runner. Do not use `repeat` to tune transport retry behavior; live provider coverage belongs to the slot canary entry.

## Provider Slot Canary

`pnpm topic-selection:v1b-provider-canary` enables the explicit live gates for v1b N4, N6, and N8:

- `T112_V1B_N4_PROVIDER_CANARY_LIVE=1`
- `T112_V1B_N6_PROVIDER_CANARY_LIVE=1`
- `T112_V1B_N8_PROVIDER_CANARY_LIVE=1`
- `BACKEND_TEST_PRESERVE_REAL_ENV=1`

The command runs both OpenAI and DashScope checks when `OPENAI_API_KEY` and `DASHSCOPE_API_KEY` are present. A missing provider key skips only that provider's live checks.

`TOPIC_SELECTION_V1B_HARNESS_SEMANTIC_MODE=provider_llm` is no longer accepted by `pnpm topic-selection:v1b-harness-e2e`. Current v1b N4/N6/N8 first-slice runtime admission rejects provider `model_option_id` values by design, so the old N1-N11 provider repeat harness path is retired instead of soft-disabled.

For a deterministic full-chain smoke, use:

```bash
pnpm topic-selection:v1b-harness-e2e
```

For provider-required-live semantics, use:

```bash
pnpm topic-selection:v1b-provider-canary
```

## Near-Production Deep Test

`pnpm topic-selection:v1b-near-prod-deep-test` is the current bundled entry for v1b deep verification against a local Prisma dev stack plus live provider slot checks.

The runner MUST remain a wrapper around existing entries:

- `pnpm topic-selection:v1b-harness-e2e` for deterministic N1-N11 WorkflowHarness behavior.
- `pnpm topic-selection:v1b-runtime-stress` for promoted N4/N6/N7/N8 runtime slots and prompt-index evidence.
- Focused backend runtime/compression/admission unit tests for registry, L5 compression, N6 admission, and N7 support admission.
- `pnpm topic-selection:v1b-provider-canary` for N4/N6/N8 provider-required-live prompt-cache behavior.
- The retired provider-negative harness path is intentionally not part of this bundle. Deterministic negative/loopback coverage belongs to `pnpm topic-selection:v1b-runtime-stress`; provider-required-live coverage belongs to `pnpm topic-selection:v1b-provider-canary`.

The runner MUST NOT implement independent prompt/cache/compression/admission semantics. It only starts existing commands, captures stdout/stderr, parses existing JSON summaries when available, and writes:

```text
.ai/.tmp/topic-selection-v1b-near-prod-deep-test/<run-id>/90-summary.json
```

Useful controls:

| Env | Default | Meaning |
| --- | --- | --- |
| `TOPIC_SELECTION_V1B_NEAR_PROD_RUN_ID` | timestamped id | Output artifact id. |
| `TOPIC_SELECTION_V1B_NEAR_PROD_HARNESS_REPEAT` | `1` | Full-chain fixture repeat count. |
| `TOPIC_SELECTION_V1B_NEAR_PROD_RUNTIME_ITERATIONS` | `1` | Runtime stress iteration count per scenario. |
| `TOPIC_SELECTION_V1B_NEAR_PROD_CONCURRENT_STRESS_RUNS` | `1` | Number of concurrent runtime-stress processes. |
| `TOPIC_SELECTION_V1B_NEAR_PROD_INCLUDE_PROVIDER_CANARY` | `true` | Whether to run N4/N6/N8 provider slot canaries. |

## Evidence

Harness runs write machine-readable evidence under:

```text
.ai/.tmp/topic-selection-v1b-harness-e2e/<run-id>/result.json
```

`pnpm topic-selection:v1b-provider-canary` is a Node test entry. Its evidence is the TAP output from `apps/backend/src/services/topic-selection-provider-canary-service.unit.test.ts`; live v1b provider tests are explicitly gated and skip when provider keys are unavailable.

`pnpm topic-selection:v1b-near-prod-deep-test` writes wrapper evidence under:

```text
.ai/.tmp/topic-selection-v1b-near-prod-deep-test/<run-id>/
```

The wrapper summary references each child command log and any child JSON summary generated by the underlying harness or runtime-stress runner.

N6 loopback trace assertions for default regeneration, debate escalation, and upstream N5 rollback routing are covered by the runtime stress runner, not by a retired provider-negative harness path.

External Codex N4/N6/N8 variance evidence additionally records per-sample prompt, last-message, stdout, stderr, prompt hash, output hash, parsed payload hash, and node gate result under:

```text
.ai/.tmp/topic-selection-v1b-harness-e2e/<run-id>/external-codex-n4-variance/sample-<n>/
```

```text
.ai/.tmp/topic-selection-v1b-harness-e2e/<run-id>/external-codex-n6-variance/sample-<n>/
```

```text
.ai/.tmp/topic-selection-v1b-harness-e2e/<run-id>/external-codex-n8-variance/sample-<n>/
```

## LLM Operating Rules

- MUST keep `repeat=1` as the default for local smoke unless the user explicitly asks for a soak/canary repeat.
- MUST treat `TOPIC_SELECTION_V1B_HARNESS_SEMANTIC_MODE=provider_llm pnpm topic-selection:v1b-harness-e2e` as an unsupported legacy invocation; use `pnpm topic-selection:v1b-provider-canary` for provider-required-live slot evidence.
- MUST explain that `repeat` is exact independent-chain count and fail-fast.
- MUST use `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` for external Codex sample count; do not overload `repeat` for within-run Codex variance.
- MUST prefer the bundled Codex app CLI when available (`/Applications/Codex.app/Contents/Resources/codex`) because older PATH CLIs may reject current ChatGPT-account model ids.
- MUST use `TOPIC_SELECTION_V1B_HARNESS_CODEX_MODEL` only when a specific compatible Codex CLI model override is known.
- MUST NOT add provider transport retry controls back to the v1b harness runner.
- MUST ensure the local Prisma dev DB has applied repo migrations before running Prisma-backed harness scripts; use `pnpm db:dev:migrate` when in doubt.
- MUST use the harness-native runner or `/topic-selection/v1b/workflow-harness/nodes/:nodeId/invocations`; do not call removed legacy v1b write routes.
- MUST treat `TOPIC_SELECTION_REAL_QUALITY_NEGATIVE_MODE`, `TOPIC_SELECTION_REAL_ALLOW_NON_ADVANCE_V1B`, and the provider-negative loopback harness path as retired. Use `pnpm topic-selection:v1b-runtime-stress` for deterministic loopback coverage and `pnpm topic-selection:v1b-provider-canary` for provider-required-live slot coverage.
- MUST use `pnpm topic-selection:v1b-near-prod-deep-test` when the requested verification scope is near-production v1b runtime/harness/provider behavior instead of a single local smoke.

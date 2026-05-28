# Topic Selection v1b Harness Runner Guide

## Conclusions

- Use `pnpm topic-selection:v1b-harness-e2e` for the fast local v1b fixture smoke.
- The default `TOPIC_SELECTION_V1B_HARNESS_REPEAT` is `1`; this is intentional for local development and negative loopback probes.
- Use `pnpm topic-selection:v1b-provider-canary` for provider-backed acceptance canaries. This sets `TOPIC_SELECTION_V1B_HARNESS_REPEAT=3`.
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
| External Codex N4 variance | `pnpm topic-selection:v1b-external-codex-n4-variance` | Fixture-backed setup through N3, then `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` independent external Codex CLI N4 slice-option drafts admitted through deterministic N4 gates. |
| External Codex N6 variance | `pnpm topic-selection:v1b-external-codex-n6-variance` | Fixture-backed setup through N5, then `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` independent external Codex CLI N6 drafts admitted through deterministic N6 gates. |
| External Codex N8 variance | `pnpm topic-selection:v1b-external-codex-n8-variance` | Fixture-backed setup through N7, then `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` independent external Codex CLI N8 value drafts admitted through deterministic N8 gates. |
| Provider acceptance canary | `pnpm topic-selection:v1b-provider-canary` | Live provider-backed N4/N6/N8 semantic drafts, deterministic harness gates, exact `repeat=3`. |
| Provider negative loopbacks | `pnpm topic-selection:v1b-provider-negative-loopbacks` | Live provider-backed N6/N8 negative semantic outputs, default `repeat=1`, loopback/readmission/exhaustion assertions. |
| Existing v1a bundle into v1b | `TOPIC_SELECTION_V1B_HARNESS_INPUT_BUNDLE_ID=<id> pnpm topic-selection:v1b-harness-e2e` | Consumes an already-persisted `V1bInputBundle` instead of creating fixture v1a handoff data. |
| Surrounding v1a/v1b/v1c check | `pnpm topic-selection:real-e2e` | Validates v1a resource sampling and v1c/PaperProject surroundings when current local content is available; v1b itself is delegated to the standalone harness runner. |

## Repeat Semantics

`TOPIC_SELECTION_V1B_HARNESS_REPEAT=<n>` is a deterministic loop around the whole runner. The runner starts exactly N independent chains and fails fast on the first failed chain. Passing `repeat=3` therefore means three complete N1-N11 chains must pass.

Model/provider retries are controlled separately by `TOPIC_SELECTION_V1B_HARNESS_LLM_MAX_RETRIES`. Do not use `repeat` to tune transport retry behavior.

## Provider Selection

Provider canaries default to OpenAI when `TOPIC_SELECTION_V1B_HARNESS_PROVIDER_ID` is not set.

Use DashScope explicitly when needed:

```bash
TOPIC_SELECTION_V1B_HARNESS_PROVIDER_ID=dashscope pnpm topic-selection:v1b-provider-canary
```

OpenAI currently defaults to a higher retry budget in the runner because TLS connection resets were observed during live canaries. Override only when testing provider transport policy:

```bash
TOPIC_SELECTION_V1B_HARNESS_LLM_MAX_RETRIES=3 pnpm topic-selection:v1b-provider-canary
```

## Evidence

Every run writes machine-readable evidence under:

```text
.ai/.tmp/topic-selection-v1b-harness-e2e/<run-id>/result.json
```

Provider evidence includes semantic artifact summaries and provider telemetry. Negative-loopback evidence includes N6 loopback trace assertions for default regeneration, debate escalation, and upstream N5 rollback routing.

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

- MUST keep `repeat=1` as the default for local smoke and provider-negative loopback probes unless the user explicitly asks for a soak/canary repeat.
- MUST use `repeat=3` for provider-backed acceptance canary evidence unless the user asks for a cheaper probe.
- MUST explain that `repeat` is exact independent-chain count and fail-fast.
- MUST use `TOPIC_SELECTION_V1B_HARNESS_CODEX_VARIANCE_COUNT` for external Codex sample count; do not overload `repeat` for within-run Codex variance.
- MUST prefer the bundled Codex app CLI when available (`/Applications/Codex.app/Contents/Resources/codex`) because older PATH CLIs may reject current ChatGPT-account model ids.
- MUST use `TOPIC_SELECTION_V1B_HARNESS_CODEX_MODEL` only when a specific compatible Codex CLI model override is known.
- MUST use `TOPIC_SELECTION_V1B_HARNESS_LLM_MAX_RETRIES` for provider transport retry changes.
- MUST ensure the local Prisma dev DB has applied repo migrations before running Prisma-backed harness scripts; use `pnpm db:dev:migrate` when in doubt.
- MUST use the harness-native runner or `/topic-selection/v1b/workflow-harness/nodes/:nodeId/invocations`; do not call removed legacy v1b write routes.
- MUST treat `TOPIC_SELECTION_REAL_QUALITY_NEGATIVE_MODE` / `TOPIC_SELECTION_REAL_ALLOW_NON_ADVANCE_V1B` direct-route mode as retired; use `pnpm topic-selection:v1b-provider-negative-loopbacks` for current v1b negative-loopback coverage.

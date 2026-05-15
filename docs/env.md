# Environment Configuration

This document is generated from `env/contract.yaml`. Do not hand-edit.

Generated at (UTC): `2026-05-14T22:28:17Z`

## Environments
- `dev`, `prod`, `staging`

## Variables

| Name | State | Type | Required | Secret | Default | Secret Ref | Scopes | Deprecate After | Replacement | Rename From | Description |
|---|---:|---:|:---:|:---:|---|---|---|---|---|---|---|
| `APPLICATION_SETTINGS_REPOSITORY` | `active` | `enum` | no | no | `memory` | `` | `*` | `` | `` | `` | Repository strategy for application settings; must match TITLE_CARD_REPOSITORY when title-card uses Prisma. |
| `APP_ENV` | `active` | `enum` | yes | no | `dev` | `` | `*` | `` | `` | `` | Deployment environment profile. |
| `AUTO_PULL_REPOSITORY` | `active` | `enum` | no | no | `memory` | `` | `*` | `` | `` | `` | Repository strategy for auto-pull stores; must match TITLE_CARD_REPOSITORY when title-card uses Prisma. |
| `AUTO_PULL_SCHEDULER_ENABLED` | `active` | `enum` | no | no | `true` | `` | `*` | `` | `` | `` | Enable the auto-pull background scheduler. |
| `DATABASE_URL` | `active` | `url` | yes | yes | `` | `database_url` | `dev` | `` | `` | `` | Prisma database URL for the local development database. |
| `HOST` | `active` | `string` | no | no | `0.0.0.0` | `` | `*` | `` | `` | `` | Service listen host. |
| `LITERATURE_PIPELINE_EMBEDDING_API_KEY` | `active` | `string` | no | no | `` | `` | `*` | `` | `` | `` | Optional API key for external embedding endpoint. |
| `LITERATURE_PIPELINE_EMBEDDING_MODEL` | `active` | `string` | no | no | `text-embedding-v1` | `` | `*` | `` | `` | `` | Embedding model name used when external embedding endpoint is configured. |
| `LITERATURE_PIPELINE_EMBEDDING_URL` | `active` | `string` | no | no | `` | `` | `*` | `` | `` | `` | Optional external embedding endpoint; unset means local fallback embedding. |
| `LITERATURE_USER_AUTH_PIPELINE_ENABLED` | `active` | `enum` | no | no | `false` | `` | `*` | `` | `` | `` | Enable deep pipeline stages for USER_AUTH literature rights class. |
| `PORT` | `active` | `int` | yes | no | `8000` | `` | `*` | `` | `` | `` | Service listen port. |
| `RESEARCH_LIFECYCLE_REPOSITORY` | `active` | `enum` | no | no | `memory` | `` | `*` | `` | `` | `` | Repository strategy for research lifecycle stores; cascades from TITLE_CARD_REPOSITORY when unset. |
| `SERVICE_NAME` | `active` | `string` | yes | no | `your-service` | `` | `*` | `` | `` | `` | Service name (logical). |
| `TITLE_CARD_REPOSITORY` | `active` | `enum` | no | no | `memory` | `` | `*` | `` | `` | `` | Repository strategy for title-card management and topic-selection authority stores. |

## Loading model (recommended)

1. Runtime injection (cloud)
2. Local .env.local (gitignored)
3. env/values/<env>.yaml
4. env/contract.yaml defaults

## Secret handling rules

- Secret values must never be committed to the repository.
- Secret variables are defined in the contract with `secret: true` and `secret_ref`.
- Secret refs are stored in `env/secrets/<env>.ref.yaml`.

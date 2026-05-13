# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-032`

## Goal
- Add settings for provider credentials/model options and configurable local storage roots for literature content-processing.

## Outcome
- Added DB-backed `ApplicationSetting` support and a redacted literature content-processing settings API.
- Added desktop settings controls for provider keys, embedding profiles, and storage roots.
- Introduced OpenAI embedding profile settings, including large default and economy profile options, plus storage categories for raw files, normalized text, artifacts/cache, indexes, and exports.
- Secrets are preserved/replaced/cleared through explicit API behavior and are never echoed in responses.

## Retained Context
- Per-user permission complexity and metadata-only mode were intentionally out of scope.
- Provider design allows future providers even though OpenAI embeddings were the first normal path.

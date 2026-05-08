# 05 Pitfalls

## Do Not Repeat
- Do not treat source fetch success as import success.
- Do not let arXiv 429 become a noisy permanent failure without cooldown/retry state.
- Do not use mock scorer evidence as proof of real quality scoring.
- Do not download arbitrary URLs without SSRF, redirect, size, MIME, and timeout controls.
- Do not assume DOI/source landing pages are PDFs.
- Do not auto-trigger expensive content-processing from collection import.
- Do not activate a new embedding/index version until indexing and retrieval smoke checks pass.
- Do not rely on one-paper E2E as batch backfill evidence.
- Do not add new feature UI dependencies to the frozen legacy CSS layer.

## Known Lessons From Pre-Task Testing
- arXiv can rate-limit immediately in local test loops; source-specific pacing is required.
- Crossref can return incomplete records; partial import counts are expected and must stay visible.
- GROBID service can parse normal PDFs well, but scanned/no-text PDFs need an explicit OCR decision.
- A downloaded raw asset alone does not mean the literature is retrieval-ready; citation/abstract/fulltext/key-content/chunk/embedding/index gates remain explicit.

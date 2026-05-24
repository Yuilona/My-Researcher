# Pitfalls

## Do Not Repeat
- Do not let the live adapter become a second experiment-foundation implementation.
- Do not let experiment-foundation callbacks directly create trusted `RunEvidenceUnit`.
- Do not treat external job success as a scientific outcome; scientific outcome still comes from `RunEvidenceUnit.run_status` and result validation.
- Do not copy training task specs, recipes, datasets, code, result artifacts, or validation reports into PaperImplementation payloads beyond refs/hashes.
- Do not make cloud credentials or external provider availability required for default verification.

## 2026-05-24 - Prisma Validate Environment
- Symptom: `pnpm --filter @paper-engineering-assistant/backend prisma:validate` failed with `Environment variable not found: DATABASE_URL`.
- Root cause: Prisma validate reads `env("DATABASE_URL")` even when no DB connection is attempted.
- Fix: reran with `DATABASE_URL='postgresql://user:pass@localhost:5432/my_researcher_validate'`.
- Prevention: use an explicit validation URL for schema-only validation in T-104/T-105 closure commands.

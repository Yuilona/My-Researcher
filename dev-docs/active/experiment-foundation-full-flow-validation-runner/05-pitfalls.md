# 05 Pitfalls

## Do-not-repeat
- Do not make real cloud credentials part of the default validation lane.
- Do not treat `.env.local` absence as a secret disclosure problem; report missing keys by name only.
- Do not run destructive DB commands against the developer's normal local schema.
- Do not let the runner become a second implementation of readiness, promotion, materialization, adapter execution, or result validation.
- Do not mix generated validation artifacts into source commits.

## Resolved Issues
### Package script argument separator
- Symptom: `pnpm experiment-foundation:full-flow -- --mode contract` passed a literal `--` argument to the Node script, causing the first package smoke to fail with `Unknown or incomplete argument: --`.
- Root cause: the Phase 1 parser handled only runner flags and did not ignore the conventional package-script separator.
- Fix: the parser now skips a bare `--` before processing runner options.
- Prevention: keep package-script invocation in the Phase 1 verification list so future parser changes preserve the public operator command.

### Migration status blocks full-flow preflight
- Symptom: Phase 2 preflight could connect to Postgres, but `prisma migrate status` returned non-zero.
- Root cause: the local database has unapplied repo migrations, including the experiment-foundation core/job tables and later paper-implementation tables.
- Fix/workaround: do not hide this in the runner; surface it as `prisma-migration-status` with an action to inspect and apply migrations intentionally.
- Prevention: keep migration status as a blocker before deterministic/full-flow orchestration so later test failures are not misdiagnosed as experiment-foundation runtime defects.

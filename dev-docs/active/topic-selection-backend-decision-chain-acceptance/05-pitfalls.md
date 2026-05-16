# 05 Pitfalls

## Do-not-repeat Summary
- Do not use T-042 closure as proof that the backend acceptance suite has been executed.
- Do not treat memory-mode route tests as sufficient for persistence acceptance.
- Do not ignore environment-gated Prisma smoke requirements; use an isolated disposable schema.
- Do not mark desktop UI gaps as backend acceptance blockers unless they expose an API or service contract bug.
- Do not treat synthetic replay metrics as mature product quality thresholds.
- Do not collapse v1b value disposition and v1c promotion decision into one acceptance condition.
- Do not allow downstream feedback/recheck to mutate upstream topic-selection authority during acceptance fixtures.

## Historical Lessons
- Pending. Add entries only after an acceptance failure is diagnosed and resolved.

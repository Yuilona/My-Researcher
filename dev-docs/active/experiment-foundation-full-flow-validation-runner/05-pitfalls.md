# 05 Pitfalls

## Do-not-repeat
- Do not make real cloud credentials part of the default validation lane.
- Do not treat `.env.local` absence as a secret disclosure problem; report missing keys by name only.
- Do not run destructive DB commands against the developer's normal local schema.
- Do not let the runner become a second implementation of readiness, promotion, materialization, adapter execution, or result validation.
- Do not mix generated validation artifacts into source commits.

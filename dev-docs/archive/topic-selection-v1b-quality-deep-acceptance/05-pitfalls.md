# 05 Pitfalls

## Do Not Repeat
- Do not treat successful LLM structured output as sufficient research quality.
- Do not treat ordinary uncertainty as an accepted risk unless an inherited `accepted_risk` authority ref exists.
- Do not force `advance_to_package` in real-flow quality tests when `TopicValueAssessment.readiness_status` is not `ready` or `ready_with_accepted_risk`; that should create a non-advance disposition and stop before package/v1c.
- Do not assume provider structured output will fully enumerate semantic coverage arrays unless the schema and prompt both require exact counts. Keep exact `minItems`/`maxItems` for all six value gates and all nine value dimensions, with backend coverage validation as the final guard.
- Do not run product-level v1b E2E with `DATABASE_URL=dummy`; the Prisma HTTP smoke requires reachable Postgres with repo migrations applied.

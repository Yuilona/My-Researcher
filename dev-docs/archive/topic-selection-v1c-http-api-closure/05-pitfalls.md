# 05 Pitfalls

- Do not let API closure define new core contracts that bypass service review.
- Do not make bridge creation possible without human promotion decision ids.
- Do not silently skip Prisma HTTP smoke when `DATABASE_URL` is missing.
- Do not expose replay routes that write production authority objects.
- Do not leave OpenAPI and API index stale.

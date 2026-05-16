# 05 Pitfalls

- Do not write production promotion, bridge, or feedback objects from replay.
- Do not make replay metrics promotion authorization.
- Do not break v1a/v1b replay fixture compatibility while adding v1c.
- Do not require Prisma schema changes unless existing JSON/string columns are insufficient.
- Do not hide downstream mutation attempts as normal loopback mismatches.

# Schema Diff Preview

Added lightweight structured relation tables for literature duplicate and cluster decisions:

- `LiteratureCluster`
- `LiteratureClusterMember`
- `LiteratureClusterEvidence`

The migration is additive only. It creates new tables, indexes, and foreign keys to `LiteratureRecord`; it does not alter or drop existing tables or columns.

Migration file:

- `prisma/migrations/20260510133000_add_literature_clusters/migration.sql`

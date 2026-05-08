# 01 Schema Diff Preview

## Migration

- `prisma/migrations/20260508120000_add_literature_fulltext_acquisition/migration.sql`

## Added Tables

- `LiteratureFulltextAcquisitionJob`
- `LiteratureFulltextAcquisitionItem`
- `LiteratureSourceRuntimeState`

## Added Relations And Indexes

- `LiteratureFulltextAcquisitionItem.jobId` -> `LiteratureFulltextAcquisitionJob.id` with cascade delete.
- `LiteratureFulltextAcquisitionItem.literatureId` -> `LiteratureRecord.id` with cascade delete.
- `LiteratureFulltextAcquisitionItem.contentAssetId` -> `LiteratureContentAsset.id` with set-null delete behavior.
- Job indexes for status/created time and update time.
- Item indexes for job/status, literature/status, content asset id, and update time.
- Source runtime unique index on `source`, plus status/cooldown and update-time indexes.

## Destructive Operations

- None. The migration only creates new tables/indexes/foreign keys.

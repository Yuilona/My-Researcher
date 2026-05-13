# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-021`
- Closure: Archived with remaining environment/manual acceptance handed off to later topic-selection work.

## Goal
- Deliver the desktop title-card management workbench and public semantic shift from ambiguous topic wording to `retrieval-topics + title-cards`.

## Outcome
- Shared contracts, OpenAPI/API index, backend routes/controllers/services/repositories, desktop module, and project docs were switched to `retrieval-topics + title-cards` semantics.
- `TitleCardManagementModule` was added and wired into the desktop “选题管理” module, with title-card overview/workflow views and demo seed controls moved out of implicit bootstrap behavior.
- Prisma SSOT added the title-card root, evidence basket persistence, and legacy topic-management data backfill migration using mapped `TitleCard*` developer-facing names.
- Paper-project creation semantics were cut over from legacy `topic_id` to `title_card_id`, with route/OpenAPI drift tests guarding against regression.
- Residual real-database migration/apply, legacy backfill smoke, and interactive desktop manual acceptance are not kept in this task; they are handed off to later active topic-selection work.

## Retained Context
- This archive records the semantic cutover and implementation baseline, not proof that every real-environment/manual acceptance scenario was executed.
- Known unclosed environment-dependent checks require a real `DATABASE_URL` and should be handled by active follow-up work, especially `T-042 topic-selection-decision-chain-redesign` or a new scoped migration/acceptance task.
- The old `Topic*` physical DB names remain only through Prisma `@map/@@map` compatibility and should not leak back into public contracts.

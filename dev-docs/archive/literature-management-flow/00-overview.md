# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-011`

## Goal
- Deliver the original literature management flow upgrade across auto-pull, manual/Zotero import, overview, metadata editing, and the historical Pipeline V2/V2.1 runtime.

## Outcome
- Auto import moved to topic/rule/run/alert flows with async runs, single-flight skip behavior, alert ack, and failed-source retry.
- Manual import, Zotero import, literature overview, metadata editing, paper sync, citation updates, and quality scoring were implemented and repeatedly regression tested.
- Pipeline V2/V2.1 artifacts, stage state, and overview actions landed as the historical predecessor to the later content-processing model.
- The package is now closed as superseded: `T-030` through `T-040` replaced the old pipeline/import terminology with collection plus explicit content-processing semantics, and `T-037` owns batch backfill.

## Retained Context
- Treat references to `POST /literature/import`, `/literature/:literatureId/pipeline*`, `pipeline_state`, and local-hash embedding behavior as historical only.
- Current authoritative semantics live in the archived `T-029` through `T-040` content-processing tasks.
- Some original manual/gray-rollout checklist items remained unexecuted, but they are no longer current acceptance gates after supersession.

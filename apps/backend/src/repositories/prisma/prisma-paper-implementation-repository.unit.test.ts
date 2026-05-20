import assert from 'node:assert/strict';
import test from 'node:test';

import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  ImplementationIntakeSnapshot,
  ImplementationProject,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';

import { AppError } from '../../errors/app-error.js';
import { PrismaPaperImplementationRepository } from './prisma-paper-implementation-repository.js';

const NOW = '2026-05-20T00:00:00.000Z';

function ref(refType: string, refId: string, versionId: string | null = null): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
    version_id: versionId,
  };
}

function makeProject(bridgePayloadHash = 'bridge_payload_hash_001'): ImplementationProject {
  return {
    implementation_project_id: 'implementation_project_001',
    intake_snapshot_id: 'implementation_intake_snapshot_001',
    workspace_id: 'workspace_001',
    title_card_id: 'title_card_001',
    paper_project_bridge_id: 'paper_project_bridge_001',
    bridge_payload_hash: bridgePayloadHash,
    target_paper_project_ref: null,
    lifecycle_status: 'active',
    freshness_status: 'fresh',
    source_status: 'active',
    version_number: 1,
    policy_version_id: 'policy_v1',
    created_by: 'system',
    created_at: NOW,
    updated_at: NOW,
  };
}

function makeSnapshot(project: ImplementationProject): ImplementationIntakeSnapshot {
  return {
    intake_snapshot_id: project.intake_snapshot_id,
    implementation_project_id: project.implementation_project_id,
    workspace_id: project.workspace_id,
    title_card_id: project.title_card_id,
    paper_project_bridge_id: project.paper_project_bridge_id,
    paper_project_bridge_ref: ref('paper_project_bridge', project.paper_project_bridge_id, project.bridge_payload_hash),
    bridge_payload_hash: project.bridge_payload_hash,
    promotion_decision_id: 'promotion_decision_001',
    promotion_decision_ref: ref('promotion_decision', 'promotion_decision_001'),
    promotion_commitment_profile_id: 'promotion_commitment_profile_001',
    promotion_commitment_profile_ref: ref('promotion_commitment_profile', 'promotion_commitment_profile_001'),
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_ref: ref('promotion_input_snapshot', 'promotion_input_snapshot_001'),
    promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    topic_package_id: 'topic_package_001',
    package_version: 'v1',
    source_status: 'active',
    snapshot_hashes: {
      bundle_hash: 'bundle_hash_001',
      package_snapshot_hash: 'package_snapshot_hash_001',
      package_draft_input_snapshot_hash: 'package_draft_input_snapshot_hash_001',
      promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    },
    source_refs: [ref('topic_package', 'topic_package_001', 'v1')],
    accepted_risk_refs: [],
    condition_refs: [],
    early_check_obligations: [],
    working_copy_payload: {
      editable_title: 'Working paper title',
      problem_statement: 'Problem statement.',
      contribution_summary: 'Contribution summary.',
      evaluation_plan: 'Evaluation plan.',
      initial_planning_notes: [],
      claim_ceiling: 'Bounded claim ceiling.',
      prohibited_claims: [],
      conditions: [],
      accepted_risk_refs: [],
      early_check_obligations: [],
      source_lineage_summary: {},
    },
    working_copy_payload_hash: 'working_copy_payload_hash_001',
    source_handoff: {} as never,
    target_paper_project_ref: null,
    intake_snapshot_hash: 'intake_snapshot_hash_001',
    policy_version_id: 'policy_v1',
    created_by: 'system',
    created_at: NOW,
  };
}

function toProjectRow(project: ImplementationProject) {
  return {
    id: project.implementation_project_id,
    intakeSnapshotId: project.intake_snapshot_id,
    workspaceId: project.workspace_id,
    titleCardId: project.title_card_id,
    paperProjectBridgeId: project.paper_project_bridge_id,
    bridgePayloadHash: project.bridge_payload_hash,
    targetPaperProjectRef: null,
    lifecycleStatus: project.lifecycle_status,
    freshnessStatus: project.freshness_status,
    sourceStatus: project.source_status,
    versionNumber: project.version_number,
    policyVersionId: project.policy_version_id,
    createdBy: project.created_by,
    createdAt: new Date(project.created_at),
    updatedAt: new Date(project.updated_at),
  };
}

function toSnapshotRow(snapshot: ImplementationIntakeSnapshot) {
  return {
    id: snapshot.intake_snapshot_id,
    implementationProjectId: snapshot.implementation_project_id,
    workspaceId: snapshot.workspace_id,
    titleCardId: snapshot.title_card_id,
    paperProjectBridgeId: snapshot.paper_project_bridge_id,
    paperProjectBridgeRef: snapshot.paper_project_bridge_ref,
    bridgePayloadHash: snapshot.bridge_payload_hash,
    promotionDecisionId: snapshot.promotion_decision_id,
    promotionDecisionRef: snapshot.promotion_decision_ref,
    promotionCommitmentProfileId: snapshot.promotion_commitment_profile_id,
    promotionCommitmentProfileRef: snapshot.promotion_commitment_profile_ref,
    promotionInputSnapshotId: snapshot.promotion_input_snapshot_id,
    promotionInputSnapshotRef: snapshot.promotion_input_snapshot_ref,
    promotionInputSnapshotHash: snapshot.promotion_input_snapshot_hash,
    topicPackageId: snapshot.topic_package_id,
    packageVersion: snapshot.package_version,
    sourceStatus: snapshot.source_status,
    snapshotHashes: snapshot.snapshot_hashes,
    sourceRefs: snapshot.source_refs,
    acceptedRiskRefs: snapshot.accepted_risk_refs,
    conditionRefs: snapshot.condition_refs,
    earlyCheckObligations: snapshot.early_check_obligations,
    workingCopyPayload: snapshot.working_copy_payload,
    workingCopyPayloadHash: snapshot.working_copy_payload_hash,
    sourceHandoff: snapshot.source_handoff,
    targetPaperProjectRef: null,
    intakeSnapshotHash: snapshot.intake_snapshot_hash,
    policyVersionId: snapshot.policy_version_id,
    createdBy: snapshot.created_by,
    createdAt: new Date(snapshot.created_at),
  };
}

function makeUniqueConflict(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`paperProjectBridgeId`)',
    {
      code: 'P2002',
      clientVersion: '5.22.0',
      meta: { target: ['paperProjectBridgeId'] },
    },
  );
}

function makeConflictPrismaClient(
  existingProject: ImplementationProject,
  existingSnapshot: ImplementationIntakeSnapshot,
): PrismaClient {
  return {
    $transaction: async () => {
      throw makeUniqueConflict();
    },
    paperImplementationProject: {
      findUnique: async () => toProjectRow(existingProject),
    },
    paperImplementationIntakeSnapshot: {
      findUnique: async () => toSnapshotRow(existingSnapshot),
    },
  } as unknown as PrismaClient;
}

test('Prisma PaperImplementation bootstrap maps same bridge/hash unique race to existing project', async () => {
  const project = makeProject();
  const snapshot = makeSnapshot(project);
  const repository = new PrismaPaperImplementationRepository(
    makeConflictPrismaClient(project, snapshot),
  );

  const result = await repository.createBootstrap({
    implementation_project: project,
    intake_snapshot: snapshot,
  });

  assert.equal(result.created, false);
  assert.equal(result.implementation_project.implementation_project_id, project.implementation_project_id);
  assert.equal(result.intake_snapshot.intake_snapshot_id, snapshot.intake_snapshot_id);
});

test('Prisma PaperImplementation bootstrap maps same bridge changed hash race to VERSION_CONFLICT', async () => {
  const requestProject = makeProject('requested_hash');
  const requestSnapshot = makeSnapshot(requestProject);
  const existingProject = makeProject('admitted_hash');
  const existingSnapshot = makeSnapshot(existingProject);
  const repository = new PrismaPaperImplementationRepository(
    makeConflictPrismaClient(existingProject, existingSnapshot),
  );

  await assert.rejects(
    () => repository.createBootstrap({
      implementation_project: requestProject,
      intake_snapshot: requestSnapshot,
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'VERSION_CONFLICT',
  );
});

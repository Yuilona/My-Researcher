import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  ListLiteratureClustersFilter,
  LiteratureClusterEvidenceRecord,
  LiteratureClusterGraphRecord,
  LiteratureClusterMemberRecord,
  LiteratureClusterRecord,
  LiteratureClusterUpdatePatch,
} from '../../literature-repository.js';
import {
  toLiteratureClusterGraphRecord,
  toLiteratureClusterMemberRecord,
} from './prisma-literature-record-mappers.js';

export class PrismaLiteratureClusterStore {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertLiteratureCluster(
    record: LiteratureClusterRecord,
    members: LiteratureClusterMemberRecord[],
    evidence: LiteratureClusterEvidenceRecord[],
  ): Promise<LiteratureClusterGraphRecord> {
    const existing = await this.prisma.literatureCluster.findUnique({
      where: { id: record.id },
    });
    const now = new Date(record.updatedAt);

    await this.prisma.literatureCluster.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        clusterType: record.clusterType,
        status: record.status,
        representativeLiteratureId: record.representativeLiteratureId,
        confidence: record.confidence,
        method: record.method,
        createdAt: new Date(record.createdAt),
        updatedAt: now,
      },
      update: {
        clusterType: record.clusterType,
        status: existing?.status ?? record.status,
        representativeLiteratureId: existing?.representativeLiteratureId ?? record.representativeLiteratureId,
        confidence: Math.max(existing?.confidence ?? 0, record.confidence),
        method: record.method,
        updatedAt: now,
      },
    });

    for (const member of members) {
      await this.prisma.literatureClusterMember.upsert({
        where: {
          clusterId_literatureId: {
            clusterId: member.clusterId,
            literatureId: member.literatureId,
          },
        },
        create: {
          id: member.id,
          clusterId: member.clusterId,
          literatureId: member.literatureId,
          role: member.role,
          relationType: member.relationType,
          confidence: member.confidence,
          decisionStatus: member.decisionStatus,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt),
        },
        update: {
          role: member.role,
          relationType: member.relationType,
          confidence: Math.max(member.confidence, 0),
          updatedAt: new Date(member.updatedAt),
        },
      });
    }

    for (const item of evidence) {
      await this.prisma.literatureClusterEvidence.upsert({
        where: {
          clusterId_literatureIdA_literatureIdB_signalType: {
            clusterId: item.clusterId,
            literatureIdA: item.literatureIdA,
            literatureIdB: item.literatureIdB,
            signalType: item.signalType,
          },
        },
        create: {
          id: item.id,
          clusterId: item.clusterId,
          literatureIdA: item.literatureIdA,
          literatureIdB: item.literatureIdB,
          signalType: item.signalType,
          score: item.score,
          payload: item.payload as Prisma.InputJsonObject,
          createdAt: new Date(item.createdAt),
        },
        update: {
          score: item.score,
          payload: item.payload as Prisma.InputJsonObject,
        },
      });
    }

    const graph = await this.findLiteratureClusterById(record.id);
    if (!graph) {
      throw new Error(`Literature cluster ${record.id} was not persisted.`);
    }
    return graph;
  }

  async findLiteratureClusterById(clusterId: string): Promise<LiteratureClusterGraphRecord | null> {
    const row = await this.prisma.literatureCluster.findUnique({
      where: { id: clusterId },
      include: {
        members: { orderBy: [{ role: 'asc' }, { literatureId: 'asc' }] },
        evidence: { orderBy: [{ signalType: 'asc' }, { literatureIdA: 'asc' }, { literatureIdB: 'asc' }] },
      },
    });
    return row ? toLiteratureClusterGraphRecord(row) : null;
  }

  async listLiteratureClusters(filter: ListLiteratureClustersFilter = {}): Promise<LiteratureClusterGraphRecord[]> {
    const literatureIds = filter.literatureIds?.filter((id) => id.trim().length > 0) ?? [];
    const rows = await this.prisma.literatureCluster.findMany({
      where: {
        status: filter.status,
        clusterType: filter.clusterType,
        members: filter.literatureId
          ? { some: { literatureId: filter.literatureId } }
          : literatureIds.length > 0
            ? { some: { literatureId: { in: literatureIds } } }
            : undefined,
      },
      include: {
        members: { orderBy: [{ role: 'asc' }, { literatureId: 'asc' }] },
        evidence: { orderBy: [{ signalType: 'asc' }, { literatureIdA: 'asc' }, { literatureIdB: 'asc' }] },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: filter.limit,
    });
    return rows.map((row) => toLiteratureClusterGraphRecord(row));
  }

  async updateLiteratureCluster(
    clusterId: string,
    patch: LiteratureClusterUpdatePatch,
  ): Promise<LiteratureClusterGraphRecord> {
    await this.prisma.literatureCluster.update({
      where: { id: clusterId },
      data: {
        status: patch.status,
        representativeLiteratureId: patch.representativeLiteratureId,
        confidence: patch.confidence,
        method: patch.method,
        updatedAt: patch.updatedAt ? new Date(patch.updatedAt) : new Date(),
      },
    });
    const graph = await this.findLiteratureClusterById(clusterId);
    if (!graph) {
      throw new Error(`Literature cluster ${clusterId} not found after update.`);
    }
    return graph;
  }

  async updateLiteratureClusterMember(
    clusterId: string,
    literatureId: string,
    patch: Partial<Omit<LiteratureClusterMemberRecord, 'id' | 'clusterId' | 'literatureId' | 'createdAt'>>,
  ): Promise<LiteratureClusterMemberRecord> {
    const updated = await this.prisma.literatureClusterMember.update({
      where: {
        clusterId_literatureId: { clusterId, literatureId },
      },
      data: {
        role: patch.role,
        relationType: patch.relationType,
        confidence: patch.confidence,
        decisionStatus: patch.decisionStatus,
        updatedAt: patch.updatedAt ? new Date(patch.updatedAt) : new Date(),
      },
    });
    return toLiteratureClusterMemberRecord(updated);
  }
}

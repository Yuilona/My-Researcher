-- CreateTable
CREATE TABLE "LiteratureCluster" (
    "id" TEXT NOT NULL,
    "clusterType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "representativeLiteratureId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LiteratureCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiteratureClusterMember" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "literatureId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decisionStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LiteratureClusterMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiteratureClusterEvidence" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "literatureIdA" TEXT NOT NULL,
    "literatureIdB" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LiteratureClusterEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiteratureCluster_clusterType_status_idx" ON "LiteratureCluster"("clusterType", "status");

-- CreateIndex
CREATE INDEX "LiteratureCluster_representativeLiteratureId_idx" ON "LiteratureCluster"("representativeLiteratureId");

-- CreateIndex
CREATE UNIQUE INDEX "LiteratureClusterMember_clusterId_literatureId_key" ON "LiteratureClusterMember"("clusterId", "literatureId");

-- CreateIndex
CREATE INDEX "LiteratureClusterMember_literatureId_decisionStatus_idx" ON "LiteratureClusterMember"("literatureId", "decisionStatus");

-- CreateIndex
CREATE INDEX "LiteratureClusterMember_clusterId_idx" ON "LiteratureClusterMember"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "LiteratureClusterEvidence_clusterId_literatureIdA_literatureIdB_signalType_key" ON "LiteratureClusterEvidence"("clusterId", "literatureIdA", "literatureIdB", "signalType");

-- CreateIndex
CREATE INDEX "LiteratureClusterEvidence_clusterId_idx" ON "LiteratureClusterEvidence"("clusterId");

-- CreateIndex
CREATE INDEX "LiteratureClusterEvidence_literatureIdA_literatureIdB_idx" ON "LiteratureClusterEvidence"("literatureIdA", "literatureIdB");

-- CreateIndex
CREATE INDEX "LiteratureClusterEvidence_signalType_idx" ON "LiteratureClusterEvidence"("signalType");

-- AddForeignKey
ALTER TABLE "LiteratureCluster" ADD CONSTRAINT "LiteratureCluster_representativeLiteratureId_fkey" FOREIGN KEY ("representativeLiteratureId") REFERENCES "LiteratureRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiteratureClusterMember" ADD CONSTRAINT "LiteratureClusterMember_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "LiteratureCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiteratureClusterMember" ADD CONSTRAINT "LiteratureClusterMember_literatureId_fkey" FOREIGN KEY ("literatureId") REFERENCES "LiteratureRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiteratureClusterEvidence" ADD CONSTRAINT "LiteratureClusterEvidence_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "LiteratureCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiteratureClusterEvidence" ADD CONSTRAINT "LiteratureClusterEvidence_literatureIdA_fkey" FOREIGN KEY ("literatureIdA") REFERENCES "LiteratureRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiteratureClusterEvidence" ADD CONSTRAINT "LiteratureClusterEvidence_literatureIdB_fkey" FOREIGN KEY ("literatureIdB") REFERENCES "LiteratureRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "FaceAnalysisTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userImageUrl" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "detectedShape" TEXT,
    "confidence" DOUBLE PRECISION,
    "basicResult" JSONB,
    "fullResult" JSONB,
    "reportUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "externalTaskId" TEXT,
    "prompt" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceAnalysisTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FaceAnalysisTask_userId_idx" ON "FaceAnalysisTask"("userId");

-- CreateIndex
CREATE INDEX "FaceAnalysisTask_userId_createdAt_idx" ON "FaceAnalysisTask"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FaceAnalysisTask_status_idx" ON "FaceAnalysisTask"("status");

-- CreateIndex
CREATE INDEX "FaceAnalysisTask_expiresAt_idx" ON "FaceAnalysisTask"("expiresAt");

-- CreateIndex
CREATE INDEX "FaceAnalysisTask_externalTaskId_idx" ON "FaceAnalysisTask"("externalTaskId");

-- AddForeignKey
ALTER TABLE "FaceAnalysisTask" ADD CONSTRAINT "FaceAnalysisTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

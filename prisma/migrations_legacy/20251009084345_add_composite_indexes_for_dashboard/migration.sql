-- CreateIndex
CREATE INDEX "TryOnTask_userId_createdAt_idx" ON "TryOnTask"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TryOnTask_userId_status_idx" ON "TryOnTask"("userId", "status");

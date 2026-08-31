CREATE TABLE "FaceShapeDetection" (
    "id" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaceShapeDetection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaceShapeDetection_status_createdAt_idx"
ON "FaceShapeDetection"("status", "createdAt");

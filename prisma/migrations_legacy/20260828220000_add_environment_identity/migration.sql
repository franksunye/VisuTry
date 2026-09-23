-- Explicit environment/database identity marker. This migration is additive;
-- registration is performed only by the guarded local/Preview bootstrap.
CREATE TABLE "EnvironmentMetadata" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "databaseIdentity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EnvironmentMetadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EnvironmentMetadata_databaseIdentity_key" ON "EnvironmentMetadata"("databaseIdentity");

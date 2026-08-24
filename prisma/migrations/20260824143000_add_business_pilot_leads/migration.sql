-- CreateEnum
CREATE TYPE "BusinessPilotLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SCHEDULED', 'PILOT_REQUESTED', 'PILOT_ACTIVE', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateTable
CREATE TABLE "BusinessPilotLead" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "BusinessPilotLeadStatus" NOT NULL DEFAULT 'NEW',
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "frameCountRange" TEXT NOT NULL,
    "trafficSource" TEXT,
    "goal" TEXT NOT NULL,
    "message" TEXT,
    "locale" TEXT NOT NULL,
    "acquisitionSource" TEXT,
    "acquisitionMedium" TEXT,
    "campaignName" TEXT,
    "landingPath" TEXT,
    "referrerHost" TEXT,
    "consentToContact" BOOLEAN NOT NULL,
    "objection" TEXT,
    "nextAction" TEXT,
    "pilotOutcome" TEXT,
    "demoAt" TIMESTAMP(3),
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPilotLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPilotLeadRateLimit" (
    "identityHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPilotLeadRateLimit_pkey" PRIMARY KEY ("identityHash", "windowStart")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPilotLead_requestId_key" ON "BusinessPilotLead"("requestId");
CREATE INDEX "BusinessPilotLead_status_createdAt_idx" ON "BusinessPilotLead"("status", "createdAt" DESC);
CREATE INDEX "BusinessPilotLead_email_idx" ON "BusinessPilotLead"("email");
CREATE INDEX "BusinessPilotLead_businessName_idx" ON "BusinessPilotLead"("businessName");
CREATE INDEX "BusinessPilotLead_acquisitionSource_createdAt_idx" ON "BusinessPilotLead"("acquisitionSource", "createdAt" DESC);
CREATE INDEX "BusinessPilotLeadRateLimit_windowStart_idx" ON "BusinessPilotLeadRateLimit"("windowStart");

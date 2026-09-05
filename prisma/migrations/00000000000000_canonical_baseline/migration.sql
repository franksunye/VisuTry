-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PREMIUM_MONTHLY', 'PREMIUM_YEARLY', 'CREDITS_PACK', 'CREDITS_PACK_PROMO_60', 'PREMIUM_MONTHLY_PROMO', 'PREMIUM_YEARLY_PROMO');

-- CreateEnum
CREATE TYPE "TryOnType" AS ENUM ('GLASSES', 'OUTFIT', 'SHOES', 'ACCESSORIES');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MerchantMembershipRole" AS ENUM ('OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MerchantAgentCredentialStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "MerchantOAuthAuthorizationStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "TryOnOrigin" AS ENUM ('CONSUMER', 'STORE_DEMO', 'STORE_PILOT');

-- CreateEnum
CREATE TYPE "GenerationTelemetryOrigin" AS ENUM ('CONSUMER', 'STORE', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "GenerationRequestFinalStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "GenerationAttemptStatus" AS ENUM ('STARTED', 'SUBMITTED', 'COMPLETED', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "GenerationErrorCode" AS ENUM ('PROVIDER_REJECTED', 'PROVIDER_FAILED', 'PROVIDER_TIMEOUT', 'NETWORK_ERROR', 'INVALID_INPUT', 'CONTENT_POLICY', 'UPLOAD_OR_ASSET_ERROR', 'CALLBACK_ERROR', 'INTERNAL_ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GenerationFailureStage" AS ENUM ('SUBMIT', 'PROVIDER_PROCESSING', 'POLL_NETWORK', 'STALE_DISPATCH', 'ASSET_UPLOAD', 'INTERNAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MerchantFrameStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CampaignObjective" AS ENUM ('TRAFFIC', 'INTENT', 'LEAD');

-- CreateEnum
CREATE TYPE "CampaignGate" AS ENUM ('NONE', 'OPT_IN_AFTER_VALUE', 'OPT_IN_BEFORE_AI');

-- CreateEnum
CREATE TYPE "PresentationMode" AS ENUM ('ACTION_FIRST', 'PRODUCT_FIRST', 'EDITORIAL_FIRST');

-- CreateEnum
CREATE TYPE "MerchantFrameSource" AS ENUM ('SEED', 'MANUAL', 'CSV', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'REVIEW_REQUIRED', 'APPROVED');

-- CreateEnum
CREATE TYPE "MerchantSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MerchantIntentType" AS ENUM ('FAVORITE', 'PRODUCT_CLICK', 'INQUIRY');

-- CreateEnum
CREATE TYPE "StoreEventSource" AS ENUM ('CLIENT', 'SERVER');

-- CreateEnum
CREATE TYPE "StoreAssetPurpose" AS ENUM ('SHOPPER_PHOTO', 'FRAME_INPUT', 'GENERATED_RESULT');

-- CreateEnum
CREATE TYPE "StoreAssetAccessMode" AS ENUM ('PUBLIC_TEMPORARY', 'PRIVATE_SIGNED');

-- CreateEnum
CREATE TYPE "RetentionStatus" AS ENUM ('ACTIVE', 'PENDING_DELETE', 'DELETE_BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "MerchantUsageKind" AS ENUM ('RENDER_ATTEMPT', 'RENDER_SUCCESS', 'RENDER_FAILURE', 'SESSION', 'AI_COMMERCE_SESSION');

-- CreateEnum
CREATE TYPE "MerchantClassification" AS ENUM ('REAL', 'POSSIBLE_EXTERNAL', 'INTERNAL', 'TEST', 'AUTOMATION', 'REFERENCE', 'SUSPICIOUS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ExperienceType" AS ENUM ('STORE', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BusinessPilotLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SCHEDULED', 'PILOT_REQUESTED', 'PILOT_ACTIVE', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "MerchantSponsoredUsageType" AS ENUM ('SPONSORED_GENERATION', 'SPONSORED_COMPARE');

-- CreateEnum
CREATE TYPE "MerchantSponsoredUsageStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED');

-- CreateTable
CREATE TABLE "EnvironmentMetadata" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "environment" TEXT NOT NULL,
    "databaseIdentity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "username" TEXT,
    "freeTrialsUsed" INTEGER NOT NULL DEFAULT 0,
    "premiumUsageCount" INTEGER NOT NULL DEFAULT 0,
    "creditsPurchased" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumExpiresAt" TIMESTAMP(3),
    "currentSubscriptionType" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "lastRetention3DayEmailSent" TIMESTAMP(3),
    "lastRetention24HEmailSent" TIMESTAMP(3),
    "lastRetentionDeletedEmailSent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "TryOnTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "TryOnType" NOT NULL DEFAULT 'GLASSES',
    "userImageUrl" TEXT NOT NULL,
    "itemImageUrl" TEXT NOT NULL,
    "glassesImageUrl" TEXT,
    "resultImageUrl" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "quotaSettledAt" TIMESTAMP(3),
    "quotaSource" TEXT,
    "origin" "TryOnOrigin" NOT NULL DEFAULT 'CONSUMER',
    "merchantId" TEXT,
    "merchantSessionId" TEXT,
    "merchantFrameId" TEXT,
    "idempotencyKey" TEXT,
    "prompt" TEXT,
    "clientSubmissionId" TEXT,
    "batchId" TEXT,
    "metadata" JSONB,
    "dispatchLeaseOwner" TEXT,
    "dispatchLeaseUntil" TIMESTAMP(3),
    "dispatchVersion" INTEGER NOT NULL DEFAULT 0,
    "resultPersistLeaseOwner" TEXT,
    "resultPersistLeaseUntil" TIMESTAMP(3),
    "resultPersistVersion" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "retentionStatus" "RetentionStatus" NOT NULL DEFAULT 'ACTIVE',
    "deleteFailCount" INTEGER NOT NULL DEFAULT 0,
    "lastDeleteError" TEXT,
    "lastDeleteAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryOnTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationRequest" (
    "id" TEXT NOT NULL,
    "tryOnTaskId" TEXT NOT NULL,
    "origin" "GenerationTelemetryOrigin" NOT NULL,
    "userId" TEXT,
    "merchantId" TEXT,
    "storeId" TEXT,
    "campaignId" TEXT,
    "clientSubmissionId" TEXT,
    "generationType" TEXT NOT NULL,
    "requestedModel" TEXT,
    "requestedProvider" TEXT,
    "finalStatus" "GenerationRequestFinalStatus" NOT NULL DEFAULT 'STARTED',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "endToEndDurationMs" INTEGER,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "finalErrorCode" "GenerationErrorCode",
    "failureStage" "GenerationFailureStage",
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationAttempt" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "providerTaskId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "submitDurationMs" INTEGER,
    "attemptDurationMs" INTEGER,
    "providerDurationMs" INTEGER,
    "status" "GenerationAttemptStatus" NOT NULL DEFAULT 'STARTED',
    "errorCode" "GenerationErrorCode",
    "failureStage" "GenerationFailureStage",
    "errorMessageNormalized" TEXT,
    "isTimeout" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationAttempt_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "FaceShapeDetection" (
    "id" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaceShapeDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "productType" "ProductType" NOT NULL,
    "description" TEXT,
    "attribution" JSONB,
    "unlockTaskId" TEXT,
    "statusReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundId" TEXT,
    "refundedAt" TIMESTAMP(3),
    "creditsRevoked" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlassesFrame" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "price" INTEGER,
    "style" TEXT,
    "material" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassesFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceShape" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "characteristics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceShape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlassesCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassesCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameFaceShapeRecommendation" (
    "id" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "faceShapeId" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "FrameFaceShapeRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameCategoryAssociation" (
    "id" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "FrameCategoryAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "contactEmail" TEXT,
    "accentColor" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
    "pilotType" TEXT NOT NULL DEFAULT 'LIVE',
    "referenceData" BOOLEAN NOT NULL DEFAULT false,
    "classification" "MerchantClassification" NOT NULL DEFAULT 'UNKNOWN',
    "classificationSource" VARCHAR(80),
    "classificationReason" TEXT,
    "defaultSource" TEXT,
    "defaultCampaign" TEXT,
    "tryOnEnabled" BOOLEAN NOT NULL DEFAULT true,
    "compareEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxCompareFrames" INTEGER NOT NULL DEFAULT 2,
    "inquiryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "planCode" TEXT,
    "sponsoredUsagePolicyKey" TEXT,
    "commercialStage" TEXT,
    "pricingVersion" TEXT,
    "entitlementVersion" TEXT,
    "commerceSessionAllowance" INTEGER,
    "standardRenderAllowance" INTEGER,
    "premiumRenderAllowance" INTEGER,
    "campaignAllowance" INTEGER,
    "entitlementEffectiveFrom" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "commercialExceptionCode" TEXT,
    "commercialStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "role" "MerchantMembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantBillingAccount" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "subscriptionStatus" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "lastEventCreatedAt" INTEGER,
    "lastEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantBillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantBillingEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerEventId" TEXT NOT NULL,
    "merchantId" TEXT,
    "billingAccountId" TEXT,
    "eventType" TEXT NOT NULL,
    "planCode" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "eventCreatedAt" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "processingReason" TEXT,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "lastDuplicateAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantBillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantAgentCredential" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "status" "MerchantAgentCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "rotatedFromId" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantAgentCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOperationAudit" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantOperationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOAuthClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "redirectUris" TEXT[],
    "tokenEndpointAuthMethod" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantOAuthClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOAuthDcrCounter" (
    "id" TEXT NOT NULL,
    "bucketHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantOAuthDcrCounter_pkey" PRIMARY KEY ("id")
);

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

    CONSTRAINT "BusinessPilotLeadRateLimit_pkey" PRIMARY KEY ("identityHash","windowStart")
);

-- CreateTable
CREATE TABLE "MerchantOAuthAuthorizationRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scopes" TEXT[],
    "resource" TEXT,
    "state" TEXT,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantOAuthAuthorizationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOAuthAuthorization" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "scopes" TEXT[],
    "resource" TEXT NOT NULL,
    "status" "MerchantOAuthAuthorizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantOAuthAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOAuthAuthorizationCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scopes" TEXT[],
    "resource" TEXT,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantOAuthAuthorizationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOAuthAccessToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantOAuthAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOAuthRefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "rotatedFromId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantOAuthRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantFrame" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "variant" TEXT,
    "imageUrl" TEXT,
    "imageAssetId" TEXT,
    "productUrl" TEXT,
    "price" INTEGER,
    "currency" TEXT,
    "shape" TEXT NOT NULL,
    "material" TEXT,
    "color" TEXT,
    "widthClass" TEXT,
    "lensWidthMm" INTEGER,
    "bridgeWidthMm" INTEGER,
    "templeLengthMm" INTEGER,
    "frameWidthMm" INTEGER,
    "styleTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "collectionTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceNotes" TEXT,
    "source" "MerchantFrameSource" NOT NULL DEFAULT 'SEED',
    "externalId" TEXT,
    "enrichmentStatus" "EnrichmentStatus" NOT NULL DEFAULT 'APPROVED',
    "status" "MerchantFrameStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" "ExperienceType" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ExperienceStatus" NOT NULL DEFAULT 'DRAFT',
    "headline" TEXT,
    "description" TEXT,
    "heroAssetUrl" TEXT,
    "primaryCtaType" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaUrl" TEXT,
    "secondaryCtaType" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaUrl" TEXT,
    "offerLabel" TEXT,
    "offerCode" TEXT,
    "offerTerms" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "campaignObjective" "CampaignObjective",
    "campaignGate" "CampaignGate",
    "presentationMode" "PresentationMode",
    "referenceData" BOOLEAN NOT NULL DEFAULT false,
    "defaultSource" TEXT,
    "defaultCampaign" TEXT,
    "referenceMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceFrame" (
    "experienceId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantFrameId" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceFrame_pkey" PRIMARY KEY ("experienceId","merchantFrameId")
);

-- CreateTable
CREATE TABLE "MerchantSession" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "experienceId" TEXT,
    "anonymousVisitorId" TEXT,
    "photoAssetId" TEXT,
    "capabilityTokenHash" TEXT NOT NULL,
    "locale" TEXT,
    "status" "MerchantSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "referenceData" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "acquisitionSurface" TEXT,
    "referrer" TEXT,
    "landingUrl" TEXT,
    "aiAgentSource" TEXT,
    "billableAICommerceSession" BOOLEAN NOT NULL DEFAULT false,
    "billableAICommerceSessionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantIntent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT NOT NULL,
    "experienceId" TEXT,
    "merchantFrameId" TEXT,
    "type" "MerchantIntentType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "experienceId" TEXT,
    "merchantFrameId" TEXT,
    "tryOnTaskId" TEXT,
    "source" "StoreEventSource" NOT NULL,
    "locale" TEXT,
    "deviceType" TEXT,
    "referenceData" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreAsset" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "purpose" "StoreAssetPurpose" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "accessMode" "StoreAssetAccessMode" NOT NULL DEFAULT 'PUBLIC_TEMPORARY',
    "providerUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionStatus" "RetentionStatus" NOT NULL DEFAULT 'ACTIVE',
    "deleteFailCount" INTEGER NOT NULL DEFAULT 0,
    "lastDeleteError" TEXT,
    "lastDeleteAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantUsageLedger" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "tryOnTaskId" TEXT,
    "kind" "MerchantUsageKind" NOT NULL,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantUsageLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantSponsoredUsage" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "experienceId" TEXT,
    "userId" TEXT,
    "shopperIdentityHash" TEXT NOT NULL,
    "usageType" "MerchantSponsoredUsageType" NOT NULL,
    "status" "MerchantSponsoredUsageStatus" NOT NULL DEFAULT 'RESERVED',
    "idempotencyKey" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSponsoredUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOrphanBlob" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT,
    "merchantId" TEXT,
    "tryOnTaskId" TEXT,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastDeleteAttemptAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOrphanBlob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreAbuseCounter" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "bytes" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreAbuseCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentMetadata_databaseIdentity_key" ON "EnvironmentMetadata"("databaseIdentity");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TryOnTask_idempotencyKey_key" ON "TryOnTask"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TryOnTask_userId_idx" ON "TryOnTask"("userId");

-- CreateIndex
CREATE INDEX "TryOnTask_status_idx" ON "TryOnTask"("status");

-- CreateIndex
CREATE INDEX "TryOnTask_type_idx" ON "TryOnTask"("type");

-- CreateIndex
CREATE INDEX "TryOnTask_userId_type_createdAt_idx" ON "TryOnTask"("userId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TryOnTask_userId_createdAt_idx" ON "TryOnTask"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TryOnTask_userId_status_idx" ON "TryOnTask"("userId", "status");

-- CreateIndex
CREATE INDEX "TryOnTask_status_quotaSettledAt_idx" ON "TryOnTask"("status", "quotaSettledAt");

-- CreateIndex
CREATE INDEX "TryOnTask_expiresAt_idx" ON "TryOnTask"("expiresAt");

-- CreateIndex
CREATE INDEX "TryOnTask_retentionStatus_expiresAt_idx" ON "TryOnTask"("retentionStatus", "expiresAt");

-- CreateIndex
CREATE INDEX "TryOnTask_origin_status_dispatchLeaseUntil_idx" ON "TryOnTask"("origin", "status", "dispatchLeaseUntil");

-- CreateIndex
CREATE INDEX "TryOnTask_retentionStatus_deleteFailCount_lastDeleteAttempt_idx" ON "TryOnTask"("retentionStatus", "deleteFailCount", "lastDeleteAttemptAt");

-- CreateIndex
CREATE INDEX "TryOnTask_origin_idx" ON "TryOnTask"("origin");

-- CreateIndex
CREATE INDEX "TryOnTask_merchantId_createdAt_idx" ON "TryOnTask"("merchantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TryOnTask_merchantSessionId_idx" ON "TryOnTask"("merchantSessionId");

-- CreateIndex
CREATE INDEX "TryOnTask_merchantSessionId_batchId_idx" ON "TryOnTask"("merchantSessionId", "batchId");

-- CreateIndex
CREATE INDEX "TryOnTask_merchantFrameId_idx" ON "TryOnTask"("merchantFrameId");

-- CreateIndex
CREATE UNIQUE INDEX "TryOnTask_userId_clientSubmissionId_key" ON "TryOnTask"("userId", "clientSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationRequest_tryOnTaskId_key" ON "GenerationRequest"("tryOnTaskId");

-- CreateIndex
CREATE INDEX "GenerationRequest_startedAt_idx" ON "GenerationRequest"("startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_origin_startedAt_idx" ON "GenerationRequest"("origin", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_finalStatus_startedAt_idx" ON "GenerationRequest"("finalStatus", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_requestedProvider_startedAt_idx" ON "GenerationRequest"("requestedProvider", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_requestedModel_startedAt_idx" ON "GenerationRequest"("requestedModel", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_finalErrorCode_startedAt_idx" ON "GenerationRequest"("finalErrorCode", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_merchantId_startedAt_idx" ON "GenerationRequest"("merchantId", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_isTest_startedAt_idx" ON "GenerationRequest"("isTest", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_environment_startedAt_idx" ON "GenerationRequest"("environment", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationRequest_failureStage_startedAt_idx" ON "GenerationRequest"("failureStage", "startedAt");

-- CreateIndex
CREATE INDEX "GenerationAttempt_requestId_status_idx" ON "GenerationAttempt"("requestId", "status");

-- CreateIndex
CREATE INDEX "GenerationAttempt_provider_submittedAt_idx" ON "GenerationAttempt"("provider", "submittedAt");

-- CreateIndex
CREATE INDEX "GenerationAttempt_status_submittedAt_idx" ON "GenerationAttempt"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "GenerationAttempt_providerTaskId_idx" ON "GenerationAttempt"("providerTaskId");

-- CreateIndex
CREATE INDEX "GenerationAttempt_isTimeout_submittedAt_idx" ON "GenerationAttempt"("isTimeout", "submittedAt");

-- CreateIndex
CREATE INDEX "GenerationAttempt_failureStage_submittedAt_idx" ON "GenerationAttempt"("failureStage", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationAttempt_requestId_attemptNumber_key" ON "GenerationAttempt"("requestId", "attemptNumber");

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

-- CreateIndex
CREATE INDEX "FaceShapeDetection_status_createdAt_idx" ON "FaceShapeDetection"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FaceShapeDetection_failureReason_createdAt_idx" ON "FaceShapeDetection"("failureReason", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_refundId_key" ON "Payment"("refundId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_stripeSubscriptionId_idx" ON "Payment"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Payment_unlockTaskId_idx" ON "Payment"("unlockTaskId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GlassesFrame_brand_idx" ON "GlassesFrame"("brand");

-- CreateIndex
CREATE INDEX "GlassesFrame_category_idx" ON "GlassesFrame"("category");

-- CreateIndex
CREATE INDEX "GlassesFrame_isActive_idx" ON "GlassesFrame"("isActive");

-- CreateIndex
CREATE INDEX "GlassesFrame_style_idx" ON "GlassesFrame"("style");

-- CreateIndex
CREATE INDEX "GlassesFrame_material_idx" ON "GlassesFrame"("material");

-- CreateIndex
CREATE INDEX "GlassesFrame_isActive_category_idx" ON "GlassesFrame"("isActive", "category");

-- CreateIndex
CREATE INDEX "GlassesFrame_isActive_brand_idx" ON "GlassesFrame"("isActive", "brand");

-- CreateIndex
CREATE INDEX "GlassesFrame_isActive_createdAt_idx" ON "GlassesFrame"("isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FaceShape_name_key" ON "FaceShape"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GlassesCategory_name_key" ON "GlassesCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FrameFaceShapeRecommendation_frameId_faceShapeId_key" ON "FrameFaceShapeRecommendation"("frameId", "faceShapeId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameCategoryAssociation_frameId_categoryId_key" ON "FrameCategoryAssociation"("frameId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");

-- CreateIndex
CREATE INDEX "Merchant_status_idx" ON "Merchant"("status");

-- CreateIndex
CREATE INDEX "Merchant_classification_idx" ON "Merchant"("classification");

-- CreateIndex
CREATE INDEX "Merchant_updatedAt_idx" ON "Merchant"("updatedAt");

-- CreateIndex
CREATE INDEX "Merchant_planCode_idx" ON "Merchant"("planCode");

-- CreateIndex
CREATE INDEX "MerchantMembership_userId_idx" ON "MerchantMembership"("userId");

-- CreateIndex
CREATE INDEX "MerchantMembership_merchantId_idx" ON "MerchantMembership"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantMembership_userId_merchantId_key" ON "MerchantMembership"("userId", "merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBillingAccount_stripeCustomerId_key" ON "MerchantBillingAccount"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBillingAccount_stripeSubscriptionId_key" ON "MerchantBillingAccount"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBillingAccount_stripeCheckoutSessionId_key" ON "MerchantBillingAccount"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "MerchantBillingAccount_merchantId_idx" ON "MerchantBillingAccount"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantBillingAccount_stripeSubscriptionId_idx" ON "MerchantBillingAccount"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBillingAccount_merchantId_provider_key" ON "MerchantBillingAccount"("merchantId", "provider");

-- CreateIndex
CREATE INDEX "MerchantBillingEvent_merchantId_createdAt_idx" ON "MerchantBillingEvent"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "MerchantBillingEvent_merchantId_planCode_status_idx" ON "MerchantBillingEvent"("merchantId", "planCode", "status");

-- CreateIndex
CREATE INDEX "MerchantBillingEvent_billingAccountId_createdAt_idx" ON "MerchantBillingEvent"("billingAccountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBillingEvent_provider_providerEventId_key" ON "MerchantBillingEvent"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAgentCredential_keyPrefix_key" ON "MerchantAgentCredential"("keyPrefix");

-- CreateIndex
CREATE INDEX "MerchantAgentCredential_merchantId_status_idx" ON "MerchantAgentCredential"("merchantId", "status");

-- CreateIndex
CREATE INDEX "MerchantAgentCredential_createdByUserId_idx" ON "MerchantAgentCredential"("createdByUserId");

-- CreateIndex
CREATE INDEX "MerchantAgentCredential_rotatedFromId_idx" ON "MerchantAgentCredential"("rotatedFromId");

-- CreateIndex
CREATE INDEX "MerchantOperationAudit_merchantId_createdAt_idx" ON "MerchantOperationAudit"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "MerchantOperationAudit_actorType_actorId_createdAt_idx" ON "MerchantOperationAudit"("actorType", "actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOAuthClient_clientId_key" ON "MerchantOAuthClient"("clientId");

-- CreateIndex
CREATE INDEX "MerchantOAuthClient_createdAt_idx" ON "MerchantOAuthClient"("createdAt");

-- CreateIndex
CREATE INDEX "MerchantOAuthDcrCounter_windowStart_idx" ON "MerchantOAuthDcrCounter"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOAuthDcrCounter_bucketHash_windowStart_key" ON "MerchantOAuthDcrCounter"("bucketHash", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPilotLead_requestId_key" ON "BusinessPilotLead"("requestId");

-- CreateIndex
CREATE INDEX "BusinessPilotLead_status_createdAt_idx" ON "BusinessPilotLead"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BusinessPilotLead_email_idx" ON "BusinessPilotLead"("email");

-- CreateIndex
CREATE INDEX "BusinessPilotLead_businessName_idx" ON "BusinessPilotLead"("businessName");

-- CreateIndex
CREATE INDEX "BusinessPilotLead_acquisitionSource_createdAt_idx" ON "BusinessPilotLead"("acquisitionSource", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BusinessPilotLeadRateLimit_windowStart_idx" ON "BusinessPilotLeadRateLimit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOAuthAuthorizationRequest_requestId_key" ON "MerchantOAuthAuthorizationRequest"("requestId");

-- CreateIndex
CREATE INDEX "MerchantOAuthAuthorizationRequest_expiresAt_idx" ON "MerchantOAuthAuthorizationRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "MerchantOAuthAuthorizationRequest_userId_idx" ON "MerchantOAuthAuthorizationRequest"("userId");

-- CreateIndex
CREATE INDEX "MerchantOAuthAuthorization_userId_merchantId_idx" ON "MerchantOAuthAuthorization"("userId", "merchantId");

-- CreateIndex
CREATE INDEX "MerchantOAuthAuthorization_clientId_idx" ON "MerchantOAuthAuthorization"("clientId");

-- CreateIndex
CREATE INDEX "MerchantOAuthAuthorization_merchantId_status_idx" ON "MerchantOAuthAuthorization"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOAuthAuthorizationCode_codeHash_key" ON "MerchantOAuthAuthorizationCode"("codeHash");

-- CreateIndex
CREATE INDEX "MerchantOAuthAuthorizationCode_clientId_expiresAt_idx" ON "MerchantOAuthAuthorizationCode"("clientId", "expiresAt");

-- CreateIndex
CREATE INDEX "MerchantOAuthAuthorizationCode_expiresAt_idx" ON "MerchantOAuthAuthorizationCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOAuthAccessToken_tokenHash_key" ON "MerchantOAuthAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MerchantOAuthAccessToken_authorizationId_idx" ON "MerchantOAuthAccessToken"("authorizationId");

-- CreateIndex
CREATE INDEX "MerchantOAuthAccessToken_expiresAt_idx" ON "MerchantOAuthAccessToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOAuthRefreshToken_tokenHash_key" ON "MerchantOAuthRefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MerchantOAuthRefreshToken_authorizationId_idx" ON "MerchantOAuthRefreshToken"("authorizationId");

-- CreateIndex
CREATE INDEX "MerchantOAuthRefreshToken_expiresAt_idx" ON "MerchantOAuthRefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "MerchantFrame_merchantId_status_idx" ON "MerchantFrame"("merchantId", "status");

-- CreateIndex
CREATE INDEX "MerchantFrame_merchantId_updatedAt_idx" ON "MerchantFrame"("merchantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantFrame_merchantId_sku_key" ON "MerchantFrame"("merchantId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantFrame_merchantId_source_externalId_key" ON "MerchantFrame"("merchantId", "source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantFrame_id_merchantId_key" ON "MerchantFrame"("id", "merchantId");

-- CreateIndex
CREATE INDEX "Experience_merchantId_type_status_idx" ON "Experience"("merchantId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Experience_merchantId_slug_key" ON "Experience"("merchantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Experience_id_merchantId_key" ON "Experience"("id", "merchantId");

-- CreateIndex
CREATE INDEX "ExperienceFrame_merchantId_experienceId_active_sortOrder_idx" ON "ExperienceFrame"("merchantId", "experienceId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "MerchantSession_merchantId_status_idx" ON "MerchantSession"("merchantId", "status");

-- CreateIndex
CREATE INDEX "MerchantSession_merchantId_createdAt_idx" ON "MerchantSession"("merchantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MerchantSession_expiresAt_idx" ON "MerchantSession"("expiresAt");

-- CreateIndex
CREATE INDEX "MerchantSession_capabilityTokenHash_idx" ON "MerchantSession"("capabilityTokenHash");

-- CreateIndex
CREATE INDEX "MerchantSession_merchantId_source_idx" ON "MerchantSession"("merchantId", "source");

-- CreateIndex
CREATE INDEX "MerchantSession_merchantId_acquisitionSurface_idx" ON "MerchantSession"("merchantId", "acquisitionSurface");

-- CreateIndex
CREATE INDEX "MerchantSession_merchantId_campaign_idx" ON "MerchantSession"("merchantId", "campaign");

-- CreateIndex
CREATE INDEX "MerchantSession_merchantId_experienceId_idx" ON "MerchantSession"("merchantId", "experienceId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSession_id_merchantId_key" ON "MerchantSession"("id", "merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantIntent_idempotencyKey_key" ON "MerchantIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MerchantIntent_merchantId_createdAt_idx" ON "MerchantIntent"("merchantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MerchantIntent_merchantId_type_idx" ON "MerchantIntent"("merchantId", "type");

-- CreateIndex
CREATE INDEX "MerchantIntent_merchantSessionId_idx" ON "MerchantIntent"("merchantSessionId");

-- CreateIndex
CREATE INDEX "MerchantIntent_merchantId_experienceId_idx" ON "MerchantIntent"("merchantId", "experienceId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantEvent_eventId_key" ON "MerchantEvent"("eventId");

-- CreateIndex
CREATE INDEX "MerchantEvent_merchantId_createdAt_idx" ON "MerchantEvent"("merchantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MerchantEvent_merchantId_type_idx" ON "MerchantEvent"("merchantId", "type");

-- CreateIndex
CREATE INDEX "MerchantEvent_merchantSessionId_idx" ON "MerchantEvent"("merchantSessionId");

-- CreateIndex
CREATE INDEX "MerchantEvent_tryOnTaskId_idx" ON "MerchantEvent"("tryOnTaskId");

-- CreateIndex
CREATE INDEX "MerchantEvent_merchantId_experienceId_idx" ON "MerchantEvent"("merchantId", "experienceId");

-- CreateIndex
CREATE INDEX "StoreAsset_merchantId_purpose_idx" ON "StoreAsset"("merchantId", "purpose");

-- CreateIndex
CREATE INDEX "StoreAsset_expiresAt_deletedAt_idx" ON "StoreAsset"("expiresAt", "deletedAt");

-- CreateIndex
CREATE INDEX "StoreAsset_merchantSessionId_idx" ON "StoreAsset"("merchantSessionId");

-- CreateIndex
CREATE INDEX "StoreAsset_storageKey_idx" ON "StoreAsset"("storageKey");

-- CreateIndex
CREATE INDEX "StoreAsset_retentionStatus_expiresAt_idx" ON "StoreAsset"("retentionStatus", "expiresAt");

-- CreateIndex
CREATE INDEX "StoreAsset_retentionStatus_deleteFailCount_lastDeleteAttemp_idx" ON "StoreAsset"("retentionStatus", "deleteFailCount", "lastDeleteAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantUsageLedger_dedupeKey_key" ON "MerchantUsageLedger"("dedupeKey");

-- CreateIndex
CREATE INDEX "MerchantUsageLedger_merchantId_kind_idx" ON "MerchantUsageLedger"("merchantId", "kind");

-- CreateIndex
CREATE INDEX "MerchantUsageLedger_merchantId_merchantSessionId_kind_idx" ON "MerchantUsageLedger"("merchantId", "merchantSessionId", "kind");

-- CreateIndex
CREATE INDEX "MerchantUsageLedger_tryOnTaskId_idx" ON "MerchantUsageLedger"("tryOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantUsageLedger_tryOnTaskId_kind_key" ON "MerchantUsageLedger"("tryOnTaskId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSponsoredUsage_idempotencyKey_key" ON "MerchantSponsoredUsage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MerchantSponsoredUsage_merchantId_shopperIdentityHash_usage_idx" ON "MerchantSponsoredUsage"("merchantId", "shopperIdentityHash", "usageType", "createdAt");

-- CreateIndex
CREATE INDEX "MerchantSponsoredUsage_merchantId_userId_usageType_createdA_idx" ON "MerchantSponsoredUsage"("merchantId", "userId", "usageType", "createdAt");

-- CreateIndex
CREATE INDEX "MerchantSponsoredUsage_status_reservedAt_idx" ON "MerchantSponsoredUsage"("status", "reservedAt");

-- CreateIndex
CREATE INDEX "StoreOrphanBlob_deletedAt_failCount_lastDeleteAttemptAt_idx" ON "StoreOrphanBlob"("deletedAt", "failCount", "lastDeleteAttemptAt");

-- CreateIndex
CREATE INDEX "StoreOrphanBlob_merchantId_idx" ON "StoreOrphanBlob"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOrphanBlob_url_key" ON "StoreOrphanBlob"("url");

-- CreateIndex
CREATE INDEX "StoreAbuseCounter_merchantId_bucket_idx" ON "StoreAbuseCounter"("merchantId", "bucket");

-- CreateIndex
CREATE UNIQUE INDEX "StoreAbuseCounter_merchantId_bucket_windowStart_key" ON "StoreAbuseCounter"("merchantId", "bucket", "windowStart");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_merchantSessionId_merchantId_fkey" FOREIGN KEY ("merchantSessionId", "merchantId") REFERENCES "MerchantSession"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_merchantFrameId_merchantId_fkey" FOREIGN KEY ("merchantFrameId", "merchantId") REFERENCES "MerchantFrame"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationAttempt" ADD CONSTRAINT "GenerationAttempt_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "GenerationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceAnalysisTask" ADD CONSTRAINT "FaceAnalysisTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameFaceShapeRecommendation" ADD CONSTRAINT "FrameFaceShapeRecommendation_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "GlassesFrame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameFaceShapeRecommendation" ADD CONSTRAINT "FrameFaceShapeRecommendation_faceShapeId_fkey" FOREIGN KEY ("faceShapeId") REFERENCES "FaceShape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameCategoryAssociation" ADD CONSTRAINT "FrameCategoryAssociation_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "GlassesFrame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameCategoryAssociation" ADD CONSTRAINT "FrameCategoryAssociation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GlassesCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantMembership" ADD CONSTRAINT "MerchantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantMembership" ADD CONSTRAINT "MerchantMembership_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBillingAccount" ADD CONSTRAINT "MerchantBillingAccount_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBillingEvent" ADD CONSTRAINT "MerchantBillingEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBillingEvent" ADD CONSTRAINT "MerchantBillingEvent_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "MerchantBillingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAgentCredential" ADD CONSTRAINT "MerchantAgentCredential_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAgentCredential" ADD CONSTRAINT "MerchantAgentCredential_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOperationAudit" ADD CONSTRAINT "MerchantOperationAudit_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOAuthAuthorization" ADD CONSTRAINT "MerchantOAuthAuthorization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOAuthAuthorization" ADD CONSTRAINT "MerchantOAuthAuthorization_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOAuthAccessToken" ADD CONSTRAINT "MerchantOAuthAccessToken_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "MerchantOAuthAuthorization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOAuthRefreshToken" ADD CONSTRAINT "MerchantOAuthRefreshToken_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "MerchantOAuthAuthorization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantFrame" ADD CONSTRAINT "MerchantFrame_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceFrame" ADD CONSTRAINT "ExperienceFrame_experienceId_merchantId_fkey" FOREIGN KEY ("experienceId", "merchantId") REFERENCES "Experience"("id", "merchantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceFrame" ADD CONSTRAINT "ExperienceFrame_merchantFrameId_merchantId_fkey" FOREIGN KEY ("merchantFrameId", "merchantId") REFERENCES "MerchantFrame"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSession" ADD CONSTRAINT "MerchantSession_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSession" ADD CONSTRAINT "MerchantSession_experienceId_merchantId_fkey" FOREIGN KEY ("experienceId", "merchantId") REFERENCES "Experience"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSession" ADD CONSTRAINT "MerchantSession_photoAssetId_fkey" FOREIGN KEY ("photoAssetId") REFERENCES "StoreAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantIntent" ADD CONSTRAINT "MerchantIntent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantIntent" ADD CONSTRAINT "MerchantIntent_merchantSessionId_merchantId_fkey" FOREIGN KEY ("merchantSessionId", "merchantId") REFERENCES "MerchantSession"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantIntent" ADD CONSTRAINT "MerchantIntent_experienceId_merchantId_fkey" FOREIGN KEY ("experienceId", "merchantId") REFERENCES "Experience"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantIntent" ADD CONSTRAINT "MerchantIntent_merchantFrameId_merchantId_fkey" FOREIGN KEY ("merchantFrameId", "merchantId") REFERENCES "MerchantFrame"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantEvent" ADD CONSTRAINT "MerchantEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantEvent" ADD CONSTRAINT "MerchantEvent_merchantSessionId_merchantId_fkey" FOREIGN KEY ("merchantSessionId", "merchantId") REFERENCES "MerchantSession"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantEvent" ADD CONSTRAINT "MerchantEvent_experienceId_merchantId_fkey" FOREIGN KEY ("experienceId", "merchantId") REFERENCES "Experience"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantEvent" ADD CONSTRAINT "MerchantEvent_merchantFrameId_merchantId_fkey" FOREIGN KEY ("merchantFrameId", "merchantId") REFERENCES "MerchantFrame"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAsset" ADD CONSTRAINT "StoreAsset_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAsset" ADD CONSTRAINT "StoreAsset_merchantSessionId_merchantId_fkey" FOREIGN KEY ("merchantSessionId", "merchantId") REFERENCES "MerchantSession"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantUsageLedger" ADD CONSTRAINT "MerchantUsageLedger_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantUsageLedger" ADD CONSTRAINT "MerchantUsageLedger_merchantSessionId_merchantId_fkey" FOREIGN KEY ("merchantSessionId", "merchantId") REFERENCES "MerchantSession"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSponsoredUsage" ADD CONSTRAINT "MerchantSponsoredUsage_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSponsoredUsage" ADD CONSTRAINT "MerchantSponsoredUsage_merchantSessionId_fkey" FOREIGN KEY ("merchantSessionId") REFERENCES "MerchantSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSponsoredUsage" ADD CONSTRAINT "MerchantSponsoredUsage_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSponsoredUsage" ADD CONSTRAINT "MerchantSponsoredUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrphanBlob" ADD CONSTRAINT "StoreOrphanBlob_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAbuseCounter" ADD CONSTRAINT "StoreAbuseCounter_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DB-P2A raw-SQL preservation: these invariants are not expressible in
-- prisma/schema.prisma and are copied from the current applied migration SQL.
ALTER TABLE "TryOnTask" ADD CONSTRAINT "try_on_task_actor_check" CHECK (
  (
    "origin" = 'CONSUMER'
    AND "userId" IS NOT NULL
    AND "merchantId" IS NULL
    AND "merchantSessionId" IS NULL
    AND "merchantFrameId" IS NULL
  )
  OR
  (
    "origin" IN ('STORE_DEMO', 'STORE_PILOT')
    AND "merchantId" IS NOT NULL
    AND "merchantSessionId" IS NOT NULL
    AND "merchantFrameId" IS NOT NULL
  )
);

ALTER TABLE "Merchant"
  ADD CONSTRAINT "Merchant_maxCompareFrames_check"
  CHECK ("maxCompareFrames" IN (2, 3, 4));

CREATE INDEX "StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx"
  ON "StoreAsset"("deletedAt", "deleteFailCount", "lastDeleteAttemptAt");

CREATE INDEX "MerchantUsageLedger_merchantId_kind_createdAt_idx"
  ON "MerchantUsageLedger"("merchantId", "kind", "createdAt");

CREATE INDEX "Merchant_commercialStatus_idx"
  ON "Merchant"("commercialStatus");

CREATE INDEX "MerchantSession_merchantId_billableAICommerceSession_idx"
  ON "MerchantSession"("merchantId", "billableAICommerceSession");

CREATE UNIQUE INDEX "Experience_one_active_store_per_merchant_idx"
  ON "Experience"("merchantId")
  WHERE "type" = 'STORE' AND "status" = 'ACTIVE';

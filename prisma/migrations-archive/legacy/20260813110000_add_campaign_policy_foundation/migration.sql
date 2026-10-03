CREATE TYPE "CampaignObjective" AS ENUM ('TRAFFIC', 'INTENT', 'LEAD');
CREATE TYPE "CampaignGate" AS ENUM ('NONE', 'OPT_IN_AFTER_VALUE', 'OPT_IN_BEFORE_AI');
CREATE TYPE "PresentationMode" AS ENUM ('ACTION_FIRST', 'PRODUCT_FIRST', 'EDITORIAL_FIRST');

ALTER TABLE "Experience"
  ADD COLUMN "campaignObjective" "CampaignObjective",
  ADD COLUMN "campaignGate" "CampaignGate",
  ADD COLUMN "presentationMode" "PresentationMode";

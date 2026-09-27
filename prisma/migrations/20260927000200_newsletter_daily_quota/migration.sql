-- Status a campaign moves to when it has delivered its daily quota and is
-- waiting for the next calendar day.
ALTER TYPE "NewsletterCampaignStatus" ADD VALUE 'PAUSED';

-- Deliveries allowed per calendar day. 0 keeps the original single-run shape.
ALTER TABLE "newsletter_campaigns" ADD COLUMN "dailyQuota" INTEGER NOT NULL DEFAULT 0;

-- When a paused campaign becomes eligible again.
ALTER TABLE "newsletter_campaigns" ADD COLUMN "nextRunAt" TIMESTAMP(3);

-- Supports the scheduler's "what is due?" lookup.
CREATE INDEX "newsletter_campaigns_status_nextRunAt_idx" ON "newsletter_campaigns"("status", "nextRunAt");

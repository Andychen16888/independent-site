-- Phase 10: Allow guest checkout — addresses can exist without a user account.
-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "userId" DROP NOT NULL;
-- Extend the quoting currency set.
-- A China-based exporter is routinely asked to quote in CNY, and buyers in the
-- UAE, India and SE Asia ask in their own currency; the original five values
-- forced every one of those deals back through USD. ADD VALUE is additive, so
-- existing product and order rows are untouched.
-- This must run before the CRM tables are created, because they default to the
-- type and PostgreSQL will not use a value added later in the same transaction.
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'CNY';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'JPY';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'SGD';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'AED';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'INR';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'CHF';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'HKD';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'KRW';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'MXN';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'THB';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'VND';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'IDR';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'MYR';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'PHP';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'NZD';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'SEK';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'NOK';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'DKK';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'PLN';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'TRY';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'BRL';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'ZAR';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'RUB';

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'PROCESSING', 'QUOTATION_SENT', 'CUSTOMER_REPLIED', 'NEGOTIATION', 'ORDER_CONFIRMED', 'LOST');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('WEBSITE_RFQ', 'PRODUCT_PAGE', 'CAMPAIGN', 'AI_AGENT');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "EmailPurpose" AS ENUM ('QUOTATION', 'FOLLOW_UP', 'GENERAL', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "periodDay" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "inquiryNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "companyName" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "jobTitle" TEXT,
    "linkedin" TEXT,
    "source" "InquirySource" NOT NULL DEFAULT 'WEBSITE_RFQ',
    "locale" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    "productImage" TEXT,
    "productCategory" TEXT,
    "modelNumber" TEXT,
    "quantity" DECIMAL(20,3),
    "unit" TEXT,
    "targetPrice" DECIMAL(12,2),
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "application" TEXT,
    "customerMessage" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "assignedUserId" TEXT,
    "lostReason" TEXT,
    "internalNote" TEXT,
    "customerIntent" TEXT,
    "recommendedPrice" DECIMAL(12,2),
    "aiReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "moq" TEXT,
    "leadTime" TEXT,
    "paymentTerms" TEXT,
    "shippingTerms" TEXT,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "validUntil" TIMESTAMP(3),
    "note" TEXT,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "specification" TEXT,
    "quantity" DECIMAL(20,3) NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_records" (
    "id" TEXT NOT NULL,
    "emailNo" TEXT NOT NULL,
    "inquiryId" TEXT,
    "quotationId" TEXT,
    "direction" "EmailDirection" NOT NULL DEFAULT 'OUTBOUND',
    "purpose" "EmailPurpose" NOT NULL DEFAULT 'GENERAL',
    "receiver" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachment" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "nextAction" TEXT,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_scope_periodDay_key" ON "number_sequences"("scope", "periodDay");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "inquiries_email_idx" ON "inquiries"("email");

-- CreateIndex
CREATE INDEX "inquiries_country_idx" ON "inquiries"("country");

-- CreateIndex
CREATE INDEX "inquiries_createdAt_idx" ON "inquiries"("createdAt");

-- CreateIndex
CREATE INDEX "inquiries_assignedUserId_idx" ON "inquiries"("assignedUserId");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_inquiryId_idx" ON "quotations"("inquiryId");

-- CreateIndex
CREATE INDEX "quotations_createdAt_idx" ON "quotations"("createdAt");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- CreateIndex
CREATE INDEX "email_records_inquiryId_idx" ON "email_records"("inquiryId");

-- CreateIndex
CREATE INDEX "email_records_quotationId_idx" ON "email_records"("quotationId");

-- CreateIndex
CREATE INDEX "email_records_status_idx" ON "email_records"("status");

-- CreateIndex
CREATE INDEX "email_records_createdAt_idx" ON "email_records"("createdAt");

-- CreateIndex
CREATE INDEX "follow_ups_inquiryId_idx" ON "follow_ups"("inquiryId");

-- CreateIndex
CREATE INDEX "follow_ups_status_followUpDate_idx" ON "follow_ups"("status", "followUpDate");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_records" ADD CONSTRAINT "email_records_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_records" ADD CONSTRAINT "email_records_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "newsletters" ADD COLUMN "unsubscribeToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "newsletters_unsubscribeToken_key" ON "newsletters"("unsubscribeToken");

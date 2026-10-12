-- CreateTable
CREATE TABLE "banner_translations" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "ctaText" TEXT,
    "link" TEXT,

    CONSTRAINT "banner_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banner_translations_locale_idx" ON "banner_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "banner_translations_bannerId_locale_key" ON "banner_translations"("bannerId", "locale");

-- AddForeignKey
ALTER TABLE "banner_translations" ADD CONSTRAINT "banner_translations_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

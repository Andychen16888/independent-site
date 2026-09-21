-- DropTable column: category type is no longer used (categories are independent,
-- products choose their own category instead).
ALTER TABLE "categories" DROP COLUMN IF EXISTS "type";
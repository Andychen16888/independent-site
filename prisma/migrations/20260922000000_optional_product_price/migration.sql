-- Make product price optional (nullable) so products can be added without a price.
ALTER TABLE "products" ALTER COLUMN "unitPrice" DROP NOT NULL;

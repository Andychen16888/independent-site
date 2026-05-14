import { PrismaClient, ProductStatus, Currency } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const adminPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@orientalbeauty.com" },
    update: {},
    create: {
      email: "admin@orientalbeauty.com",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "Oriental",
      role: "ADMIN",
    },
  })
  console.log("Admin user created:", admin.email)

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "beauty" },
      update: {},
      create: {
        name: "Beauty",
        slug: "beauty",
        description: "Premium peptide skincare inspired by Eastern beauty rituals",
        type: "BEAUTY",
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "handmade-living" },
      update: {},
      create: {
        name: "Handmade Living",
        slug: "handmade-living",
        description: "Artisanal home objects crafted by master artisans from across Asia",
        type: "LIVING",
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "peptide-masks" },
      update: {},
      create: {
        name: "Peptide Masks",
        slug: "peptide-masks",
        description: "Advanced peptide sheet masks for radiant skin",
        type: "BEAUTY",
        parentId: (await prisma.category.findUnique({ where: { slug: "beauty" } }))?.id,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "serums" },
      update: {},
      create: {
        name: "Serums & Essences",
        slug: "serums",
        description: "Concentrated peptide treatments for targeted results",
        type: "BEAUTY",
        parentId: (await prisma.category.findUnique({ where: { slug: "beauty" } }))?.id,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "ceramics" },
      update: {},
      create: {
        name: "Ceramics",
        slug: "ceramics",
        description: "Hand-thrown pottery from ancient kilns",
        type: "LIVING",
        parentId: (await prisma.category.findUnique({ where: { slug: "handmade-living" } }))?.id,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "home-decor" },
      update: {},
      create: {
        name: "Home Decor",
        slug: "home-decor",
        description: "Curated objects for mindful living spaces",
        type: "LIVING",
        parentId: (await prisma.category.findUnique({ where: { slug: "handmade-living" } }))?.id,
        sortOrder: 2,
      },
    }),
  ])
  console.log("Categories created:", categories.length)

  const welcomeCoupon = await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "WELCOME",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 50,
      maxDiscount: 30,
      isActive: true,
    },
  })
  console.log("Welcome coupon created:", welcomeCoupon.code)

  const siteSettings = [
    { key: "store_name", value: "Oriental Beauty" },
    { key: "support_email", value: "hello@orientalbeauty.com" },
    { key: "free_shipping_threshold", value: "100" },
    { key: "default_currency", value: "USD" },
    { key: "tax_rate", value: "8" },
  ]

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log("Site settings created")

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

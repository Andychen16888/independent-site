import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // 检查数据库连接和表是否存在
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    console.error("Cannot connect to database. Check DATABASE_URL in .env")
    process.exit(1)
  }

  const adminEmail = "81570423@qq.com"
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (existing) {
    console.log("Admin user already exists, skipping...")
  } else {
    const passwordHash = await bcrypt.hash("Admin123!", 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: "Admin",
        lastName: "Oriental Beauty",
        role: "ADMIN",
      },
    })
    console.log("Admin user created:")
    console.log("  Email:    81570423@qq.com")
    console.log("  Password: Admin123!")
  }

  const categoryData = [
    { name: "Beauty", slug: "beauty", description: "Peptide skincare and beauty products", type: "BEAUTY", sortOrder: 1 },
    { name: "Handmade Living", slug: "handmade-living", description: "Artisanal home objects and decor", type: "HOME", sortOrder: 2 },
  ]

  const categoryIds: Record<string, string> = {}
  for (const cat of categoryData) {
    const existingCat = await prisma.category.findUnique({ where: { slug: cat.slug } })
    if (existingCat) {
      categoryIds[cat.slug] = existingCat.id
    } else {
      const created = await prisma.category.create({ data: cat })
      categoryIds[cat.slug] = created.id
      console.log(`Category created: ${cat.name}`)
    }
  }

  const productData: {
    name: string; slug: string; sku: string; brand: string;
    description: string; shortDescription: string;
    unitPrice: number; originalPrice: number | null;
    stock: number; status: "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED";
    isFeatured: boolean; isBestSeller: boolean; isNew: boolean;
    categorySlug: string; imageUrl: string;
  }[] = [
    {
      name: "Peptide Hydration Serum",
      slug: "peptide-hydration-serum",
      sku: "OB-001",
      brand: "Oriental Beauty",
      description: "A lightweight, fast-absorbing serum packed with multi-weight hyaluronic acid and copper peptides to deeply hydrate and support skin barrier repair.",
      shortDescription: "Deep hydration serum with copper peptides and hyaluronic acid",
      unitPrice: 48.00,
      originalPrice: 58.00,
      stock: 150,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Serum",
    },
    {
      name: "Vitamin C Brightening Cream",
      slug: "vitamin-c-brightening-cream",
      sku: "OB-002",
      brand: "Oriental Beauty",
      description: "A rich yet silky moisturizer featuring stabilized vitamin C and niacinamide to brighten skin tone, reduce dark spots, and improve overall radiance.",
      shortDescription: "Brightening moisturizer with vitamin C and niacinamide",
      unitPrice: 42.00,
      originalPrice: null,
      stock: 200,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Cream",
    },
    {
      name: "Retinol Night Oil",
      slug: "retinol-night-oil",
      sku: "OB-003",
      brand: "Oriental Beauty",
      description: "A gentle yet effective overnight treatment combining encapsulated retinol with squalane and rosehip oil to smooth fine lines and improve skin texture while you sleep.",
      shortDescription: "Overnight retinol treatment with squalane and rosehip oil",
      unitPrice: 52.00,
      originalPrice: 62.00,
      stock: 100,
      status: "ACTIVE",
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Night+Oil",
    },
    {
      name: "Ceramide Barrier Balm",
      slug: "ceramide-barrier-balm",
      sku: "OB-004",
      brand: "Oriental Beauty",
      description: "An ultra-nourishing balm formulated with ceramides, panthenol, and shea butter to restore and strengthen the skin barrier for compromised or dry skin types.",
      shortDescription: "Nourishing barrier repair balm with ceramides and shea butter",
      unitPrice: 38.00,
      originalPrice: null,
      stock: 80,
      status: "DRAFT",
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      categorySlug: "beauty",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Balm",
    },
    {
      name: "Handcrafted Soy Candle - Jasmine",
      slug: "handcrafted-soy-candle-jasmine",
      sku: "OB-101",
      brand: "Oriental Beauty",
      description: "Hand-poured soy wax candle with natural jasmine essential oil. Burns cleanly for 45+ hours in a hand-thrown ceramic vessel.",
      shortDescription: "Soy wax candle with natural jasmine essential oil",
      unitPrice: 28.00,
      originalPrice: 32.00,
      stock: 60,
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      categorySlug: "handmade-living",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Candle",
    },
    {
      name: "Linen Tea Towel Set",
      slug: "linen-tea-towel-set",
      sku: "OB-102",
      brand: "Oriental Beauty",
      description: "Set of three stonewashed linen tea towels in neutral earth tones. Pre-washed for softness, each measures 18x28 inches.",
      shortDescription: "Set of 3 stonewashed linen tea towels",
      unitPrice: 34.00,
      originalPrice: null,
      stock: 120,
      status: "ACTIVE",
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      categorySlug: "handmade-living",
      imageUrl: "https://placehold.co/400x400/ivory/charcoal?text=Towel+Set",
    },
  ]

  for (const prod of productData) {
    const existingProduct = await prisma.product.findUnique({ where: { slug: prod.slug } })
    if (existingProduct) {
      console.log(`  Product exists: ${prod.name}`)
      continue
    }

    const { categorySlug, imageUrl, ...productFields } = prod
    const product = await prisma.product.create({
      data: productFields,
    })

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        alt: prod.name,
        sortOrder: 0,
        isPrimary: true,
      },
    })

    await prisma.productCategory.create({
      data: {
        productId: product.id,
        categoryId: categoryIds[categorySlug],
      },
    })

    console.log(`  Product created: ${prod.name}`)
  }

  console.log("Seeding complete.")
}

main()
  .catch((e) => {
    if (e.code === "P2021") {
      console.error("\n  Database tables not found. Run `npm run db:push` first to create tables.\n")
    } else {
      console.error("Seed error:", e)
    }
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

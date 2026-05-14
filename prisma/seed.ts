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

  const beautyCat = await prisma.category.findUnique({ where: { slug: "beauty" } })
  const livingCat = await prisma.category.findUnique({ where: { slug: "handmade-living" } })
  const serumsCat = await prisma.category.findUnique({ where: { slug: "serums" } })
  const masksCat = await prisma.category.findUnique({ where: { slug: "peptide-masks" } })
  const ceramicsCat = await prisma.category.findUnique({ where: { slug: "ceramics" } })
  const decorCat = await prisma.category.findUnique({ where: { slug: "home-decor" } })

  const productsData = [
    {
      name: "Peptide Hydration Serum",
      slug: "peptide-hydration-serum",
      sku: "PEP-HYDR-001",
      brand: "Oriental Beauty",
      description: "A lightweight, fast-absorbing peptide serum that delivers multi-weight peptides deep into the skin. Formulated with hyaluronic acid and niacinamide, this serum provides intense hydration while supporting collagen production. The result is plumper, smoother, and more radiant skin with visible reduction in fine lines and improved skin barrier function.",
      shortDescription: "Advanced multi-peptide serum for deep hydration and visible anti-aging results",
      unitPrice: 78,
      originalPrice: 98,
      stock: 25,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      categoryIds: [beautyCat!.id, serumsCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80", alt: "Peptide Hydration Serum bottle", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80", alt: "Serum dropper application", sortOrder: 1 },
        { url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80", alt: "Luxury skincare routine", sortOrder: 2 },
      ],
      videos: [
        { url: "https://cdn.coverr.co/videos/coverr-skincare-product-presentation-5711/1080p.mp4", title: "Product Application Guide", sortOrder: 0 },
      ],
      parameters: [
        { name: "Size", value: "30ml / 1.0 fl oz" },
        { name: "Key Ingredients", value: "Multi-Weight Peptides, Hyaluronic Acid, Niacinamide" },
        { name: "Skin Type", value: "All skin types" },
        { name: "Shelf Life", value: "12 months after opening" },
        { name: "Free From", value: "Parabens, Sulfates, Phthalates, Synthetic Fragrance" },
      ],
      faqs: [
        { question: "How often should I use this serum?", answer: "Apply twice daily, morning and evening, after cleansing and before moisturizer. A few drops are sufficient for the entire face and neck." },
        { question: "How long until I see results?", answer: "Most users notice improved skin texture and hydration within 2 weeks. For visible anti-aging benefits, consistent use for 4-8 weeks is recommended." },
        { question: "Can I use this with other active ingredients?", answer: "Yes, this serum is formulated to layer well with other products. Apply before heavier creams and oils. If using Vitamin C or retinol, apply peptide serum at alternate times." },
      ],
    },
    {
      name: "Rice Bran Peptide Mask",
      slug: "rice-bran-peptide-mask",
      sku: "RICE-PEP-002",
      brand: "Oriental Beauty",
      description: "Inspired by traditional Japanese rice bran skincare, this innovative sheet mask combines fermented rice extract with our signature peptide complex. The biodegradable cupro fiber sheet adheres seamlessly to the skin, delivering concentrated nutrients that brighten, firm, and restore radiance. Each mask is infused with sake ferment filtrate to gently exfoliate and refine skin texture.",
      shortDescription: "Brightening sheet mask with fermented rice and peptides",
      unitPrice: 12,
      originalPrice: null,
      stock: 100,
      isFeatured: true,
      isBestSeller: false,
      isNew: true,
      categoryIds: [beautyCat!.id, masksCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80", alt: "Sheet mask on face", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80", alt: "Luxury skincare products", sortOrder: 1 },
        { url: "https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?w=800&q=80", alt: "Skincare with natural ingredients", sortOrder: 2 },
      ],
      videos: [],
      parameters: [
        { name: "Quantity", value: "5 masks per box" },
        { name: "Key Ingredients", value: "Fermented Rice Extract, Peptide Complex, Sake Filtrate" },
        { name: "Sheet Material", value: "Cupro fiber (biodegradable)" },
        { name: "Skin Type", value: "All skin types, especially dull skin" },
        { name: "Shelf Life", value: "18 months" },
      ],
      faqs: [
        { question: "How often should I use this mask?", answer: "For best results, use 2-3 times per week as part of your evening skincare routine." },
        { question: "How long should I leave the mask on?", answer: "Leave on for 15-20 minutes. Do not let the mask dry completely on the face. Gently pat remaining essence into skin." },
      ],
    },
    {
      name: "Ginseng Peptide Eye Cream",
      slug: "ginseng-peptide-eye-cream",
      sku: "GIN-PEP-003",
      brand: "Oriental Beauty",
      description: "A luxurious eye cream that combines the adaptogenic power of Korean red ginseng with our advanced peptide technology. This rich yet fast-absorbing formula targets the five signs of aging around the delicate eye area: fine lines, puffiness, dark circles, dryness, and loss of firmness. Caffeine and ceramides work in synergy to de-puff and strengthen the skin barrier.",
      shortDescription: "Anti-aging eye treatment with red ginseng and peptides",
      unitPrice: 62,
      originalPrice: 78,
      stock: 30,
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      categoryIds: [beautyCat!.id, serumsCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80", alt: "Eye cream jar", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80", alt: "Luxury skincare", sortOrder: 1 },
      ],
      videos: [],
      parameters: [
        { name: "Size", value: "15ml / 0.5 fl oz" },
        { name: "Key Ingredients", value: "Korean Red Ginseng, Peptide Complex, Caffeine, Ceramides" },
        { name: "Skin Type", value: "All skin types, especially mature skin" },
        { name: "Shelf Life", value: "12 months after opening" },
      ],
      faqs: [
        { question: "When should I apply eye cream?", answer: "Apply morning and evening after serum, before moisturizer. Use your ring finger to gently tap a rice-grain amount around the orbital bone." },
      ],
    },
    {
      name: "Vitamin C Brightening Essence",
      slug: "vitamin-c-brightening-essence",
      sku: "VIT-C-004",
      brand: "Oriental Beauty",
      description: "A lightweight, water-like essence that delivers a stabilized form of Vitamin C alongside ferulic acid and vitamin E. This potent antioxidant formula brightens the complexion, evens skin tone, and protects against environmental damage. Infused with Asian pennywort extract to soothe and support skin regeneration.",
      shortDescription: "Stabilized Vitamin C essence for radiant, even-toned skin",
      unitPrice: 55,
      originalPrice: null,
      stock: 40,
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
      categoryIds: [beautyCat!.id, serumsCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&q=80", alt: "Vitamin C essence bottle", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80", alt: "Skincare routine", sortOrder: 1 },
      ],
      videos: [],
      parameters: [
        { name: "Size", value: "50ml / 1.7 fl oz" },
        { name: "Key Ingredients", value: "20% Vitamin C (Ascorbyl Glucoside), Ferulic Acid, Vitamin E, Pennywort" },
        { name: "pH Level", value: "5.0-5.5" },
        { name: "Skin Type", value: "All skin types" },
      ],
      faqs: [],
    },
    {
      name: "Raku Teacup Set",
      slug: "raku-teacup-set",
      sku: "CR-RAKU-001",
      brand: "Kyoto Craft House",
      description: "Handcrafted by master potter Takeshi Yamamoto in his Kyoto studio, each Raku teacup is individually fired using the ancient Raku technique dating back to the 16th century. The unique crackle glaze and irregular form make each piece one of a kind. This set of four cups embodies the wabi-sabi philosophy of finding beauty in imperfection. Each cup bears the artist's stamp on the base.",
      shortDescription: "Set of 4 handcrafted Raku teacups from Kyoto",
      unitPrice: 145,
      originalPrice: null,
      stock: 8,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      categoryIds: [livingCat!.id, ceramicsCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80", alt: "Raku teacup set", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80", alt: "Ceramic teacup detail", sortOrder: 1 },
        { url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80", alt: "Tea ceremony setup", sortOrder: 2 },
      ],
      videos: [
        { url: "https://cdn.coverr.co/videos/coverr-pouring-tea-into-a-cup-5762/1080p.mp4", title: "Tea Ceremony", sortOrder: 0 },
      ],
      parameters: [
        { name: "Material", value: "Raku-fired stoneware" },
        { name: "Dimensions", value: "8cm diameter × 6cm height (each)" },
        { name: "Set Includes", value: "4 teacups, wooden gift box" },
        { name: "Origin", value: "Kyoto, Japan" },
        { name: "Care", value: "Hand wash recommended. Not microwave safe." },
      ],
      faqs: [
        { question: "Are these dishwasher safe?", answer: "Due to the delicate Raku glaze, we recommend hand washing only. The unique crackle pattern is part of the design, not a defect." },
        { question: "Is each cup truly unique?", answer: "Yes! The Raku firing process creates unpredictable patterns. No two cups are exactly alike, making each set truly one of a kind." },
      ],
    },
    {
      name: "Celadon Lotus Vase",
      slug: "celadon-lotus-vase",
      sku: "CR-CEL-002",
      brand: "Korea Heritage Atelier",
      description: "Inspired by the celadon masterpieces of the Goryeo Dynasty, this exquisite vase features a lotus motif carved under a sage-green celadon glaze. Made by artisans in Icheon, Korea, using traditional techniques passed down through generations. The subtle crackle pattern in the glaze is characteristic of high-quality celadon and develops character over time.",
      shortDescription: "Korean celadon vase with hand-carved lotus motif",
      unitPrice: 230,
      originalPrice: 280,
      stock: 3,
      isFeatured: true,
      isBestSeller: false,
      isNew: true,
      categoryIds: [livingCat!.id, ceramicsCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80", alt: "Celadon vase", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80", alt: "Ceramic vase detail", sortOrder: 1 },
      ],
      videos: [],
      parameters: [
        { name: "Material", value: "Celadon-glazed stoneware" },
        { name: "Dimensions", value: "25cm height × 15cm diameter" },
        { name: "Origin", value: "Icheon, Korea" },
        { name: "Technique", value: "Traditional Goryeo celadon, hand-carved" },
        { name: "Care", value: "Wipe with soft dry cloth. Avoid harsh cleaners." },
      ],
      faqs: [],
    },
    {
      name: "Bamboo Incense Holder",
      slug: "bamboo-incense-holder",
      sku: "HD-BAM-001",
      brand: "Bali Artisan Collective",
      description: "Carved from sustainably harvested bamboo by artisans in Ubud, Bali, this minimalist incense holder features a discreet drawer for storing your favorite incense sticks. The natural bamboo grain is highlighted with a matte finish that ages beautifully over time. Designed to complement both modern and traditional interiors.",
      shortDescription: "Minimalist bamboo incense holder with storage drawer",
      unitPrice: 38,
      originalPrice: null,
      stock: 50,
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      categoryIds: [livingCat!.id, decorCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1602872030216-3ae6e5f3e5e5?w=800&q=80", alt: "Bamboo incense holder", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&q=80", alt: "Incense burning", sortOrder: 1 },
      ],
      videos: [],
      parameters: [
        { name: "Material", value: "Sustainably harvested bamboo" },
        { name: "Dimensions", value: "20cm × 5cm × 3cm" },
        { name: "Finish", value: "Natural matte" },
        { name: "Origin", value: "Ubud, Bali, Indonesia" },
        { name: "Includes", value: "Holder with drawer, 10 sandalwood incense sticks" },
      ],
      faqs: [],
    },
    {
      name: "Mulberry Silk Eye Mask",
      slug: "mulberry-silk-eye-mask",
      sku: "TX-SILK-001",
      brand: "Oriental Beauty",
      description: "Crafted from 22-momme mulberry silk, this luxurious eye mask provides complete light blockage for deeper sleep and meditation. The adjustable strap ensures a comfortable fit for all head sizes, while the silk fabric is gentle on delicate under-eye skin, preventing sleep lines and creases. Filled with a thin layer of silk floss for gentle pressure that promotes relaxation.",
      shortDescription: "22-momme mulberry silk eye mask for restful sleep",
      unitPrice: 48,
      originalPrice: 58,
      stock: 35,
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      categoryIds: [livingCat!.id, decorCat!.id],
      images: [
        { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80", alt: "Silk eye mask on bed", isPrimary: true, sortOrder: 0 },
        { url: "https://images.unsplash.com/photo-1616627561950-9f7461d1ec37?w=800&q=80", alt: "Luxury sleep accessories", sortOrder: 1 },
      ],
      videos: [],
      parameters: [
        { name: "Material", value: "22-momme mulberry silk" },
        { name: "Filling", value: "Silk floss" },
        { name: "Weight", value: "25g" },
        { name: "Care", value: "Hand wash with mild detergent. Air dry away from direct sunlight." },
        { name: "Origin", value: "Suzhou, China" },
      ],
      faqs: [
        { question: "Does the mask block all light?", answer: "Yes, the multiple layers of mulberry silk combined with the contoured design provide complete blackout for undisturbed sleep." },
      ],
    },
  ]

  const createdProducts = []
  for (const data of productsData) {
    const { images, videos, parameters, faqs, categoryIds, ...productData } = data
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...productData,
        currency: "USD",
        status: "ACTIVE",
        unitPrice: productData.unitPrice,
        originalPrice: productData.originalPrice,
        stock: productData.stock,
      },
    })
    createdProducts.push(product)

    await prisma.productImage.deleteMany({ where: { productId: product.id } })
    await prisma.productVideo.deleteMany({ where: { productId: product.id } })
    await prisma.productParameter.deleteMany({ where: { productId: product.id } })
    await prisma.productFAQ.deleteMany({ where: { productId: product.id } })
    await prisma.productCategory.deleteMany({ where: { productId: product.id } })

    for (const img of images) {
      await prisma.productImage.create({ data: { productId: product.id, ...img } })
    }
    for (const vid of videos) {
      await prisma.productVideo.create({ data: { productId: product.id, ...vid } })
    }
    for (const param of parameters) {
      await prisma.productParameter.create({ data: { productId: product.id, ...param } })
    }
    for (const faq of faqs) {
      await prisma.productFAQ.create({ data: { productId: product.id, ...faq } })
    }
    for (const catId of categoryIds) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: catId } },
        update: {},
        create: { productId: product.id, categoryId: catId },
      })
    }
    console.log(`Product created: ${product.name}`)
  }

  const banners = [
    { title: "Spring Collection 2026", subtitle: "Discover our new peptide-infused skincare", image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1600&q=80", link: "/products?sort=newest", isActive: true, sortOrder: 0 },
    { title: "Handcrafted with Love", subtitle: "Authentic artisan pieces from across Asia", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1600&q=80", link: "/categories/handmade-living", isActive: true, sortOrder: 1 },
    { title: "Free Shipping", subtitle: "On orders over $100 — arrives in 5-8 business days", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1600&q=80", link: "/shipping", isActive: true, sortOrder: 2 },
  ]
  await prisma.banner.deleteMany({})
  for (const banner of banners) {
    await prisma.banner.create({ data: banner })
  }
  console.log("Banners created")

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

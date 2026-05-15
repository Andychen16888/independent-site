import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const adminEmail = "admin@orientalbeauty.com"
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
    console.log("  Email:    admin@orientalbeauty.com")
    console.log("  Password: Admin123!")
  }

  const categories = [
    { name: "Beauty", slug: "beauty", description: "Peptide skincare and beauty products", type: "BEAUTY", sortOrder: 1 },
    { name: "Handmade Living", slug: "handmade-living", description: "Artisanal home objects and decor", type: "HOME", sortOrder: 2 },
  ]

  for (const cat of categories) {
    const existingCat = await prisma.category.findUnique({ where: { slug: cat.slug } })
    if (!existingCat) {
      await prisma.category.create({ data: cat })
      console.log(`Category created: ${cat.name}`)
    }
  }

  console.log("Seeding complete.")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

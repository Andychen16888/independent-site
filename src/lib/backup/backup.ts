import { promises as fs } from "fs"
import path from "path"
import { zip, unzip, strToU8, strFromU8 } from "fflate"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { getUploadDir } from "@/lib/uploads"

export const BACKUP_FORMAT = "b2b-independent-site-backup"
export const BACKUP_VERSION = 1
export const MAX_RESTORE_BYTES = 50 * 1024 * 1024

/**
 * Catalog content that survives a host rebuild: product categories, products and
 * all their child rows, plus the editorial surfaces (pages, blog, faqs, banners,
 * menus) and global site settings. Orders/users are intentionally excluded.
 */
export type BackupData = {
  categories: Prisma.CategoryUncheckedCreateInput[]
  categoryTranslations: Prisma.CategoryTranslationUncheckedCreateInput[]
  categoryBanners: Prisma.CategoryBannerUncheckedCreateInput[]
  products: Prisma.ProductUncheckedCreateInput[]
  productCategories: Prisma.ProductCategoryUncheckedCreateInput[]
  productImages: Prisma.ProductImageUncheckedCreateInput[]
  productVideos: Prisma.ProductVideoUncheckedCreateInput[]
  productParameters: Prisma.ProductParameterUncheckedCreateInput[]
  productFaqs: Prisma.ProductFAQUncheckedCreateInput[]
  productRelations: Prisma.ProductRelationUncheckedCreateInput[]
  productTranslations: Prisma.ProductTranslationUncheckedCreateInput[]
  siteSettings: Prisma.SiteSettingUncheckedCreateInput[]
  banners: Prisma.BannerUncheckedCreateInput[]
  menus: Prisma.MenuUncheckedCreateInput[]
  pages: Prisma.PageUncheckedCreateInput[]
  pageTranslations: Prisma.PageTranslationUncheckedCreateInput[]
  blogPosts: Prisma.BlogPostUncheckedCreateInput[]
  blogPostTranslations: Prisma.BlogPostTranslationUncheckedCreateInput[]
  siteFaqs: Prisma.SiteFaqUncheckedCreateInput[]
  siteFaqTranslations: Prisma.SiteFaqTranslationUncheckedCreateInput[]
}

export type BackupManifest = {
  format: typeof BACKUP_FORMAT
  version: number
  createdAt: string
  counts: Record<string, number>
  fileCount: number
}

export type RestoreSummary = {
  mode: "merge" | "replace"
  tables: Record<string, number>
  filesRestored: number
  errors: string[]
}

async function collectCatalogData(): Promise<BackupData> {
  const [
    categories,
    categoryTranslations,
    categoryBanners,
    products,
    productCategories,
    productImages,
    productVideos,
    productParameters,
    productFaqs,
    productRelations,
    productTranslations,
    siteSettings,
    banners,
    menus,
    pages,
    pageTranslations,
    blogPosts,
    blogPostTranslations,
    siteFaqs,
    siteFaqTranslations,
  ] = await Promise.all([
    prisma.category.findMany(),
    prisma.categoryTranslation.findMany(),
    prisma.categoryBanner.findMany(),
    prisma.product.findMany(),
    prisma.productCategory.findMany(),
    prisma.productImage.findMany(),
    prisma.productVideo.findMany(),
    prisma.productParameter.findMany(),
    prisma.productFAQ.findMany(),
    prisma.productRelation.findMany(),
    prisma.productTranslation.findMany(),
    prisma.siteSetting.findMany(),
    prisma.banner.findMany(),
    prisma.menu.findMany(),
    prisma.page.findMany(),
    prisma.pageTranslation.findMany(),
    prisma.blogPost.findMany(),
    prisma.blogPostTranslation.findMany(),
    prisma.siteFaq.findMany(),
    prisma.siteFaqTranslation.findMany(),
  ])

  return {
    categories,
    categoryTranslations,
    categoryBanners,
    products,
    productCategories,
    productImages,
    productVideos,
    productParameters,
    productFaqs,
    productRelations,
    productTranslations,
    siteSettings,
    banners,
    menus,
    pages,
    pageTranslations,
    blogPosts,
    blogPostTranslations,
    siteFaqs,
    siteFaqTranslations,
  }
}

/**
 * Uploaded media lives as flat files in the upload dir. We also probe the
 * historical locations (`cwd/uploads`, `cwd/public/uploads`) so files served via
 * a legacy fallback still make it into the archive.
 */
async function collectUploadFiles(): Promise<Record<string, Uint8Array>> {
  const dirs = new Set<string>([
    getUploadDir(),
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "public", "uploads"),
  ])

  const files: Record<string, Uint8Array> = {}
  for (const dir of dirs) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isFile() || files[entry.name]) continue
      try {
        const buffer = await fs.readFile(path.join(dir, entry.name))
        files[entry.name] = new Uint8Array(buffer)
      } catch {
        // Skip unreadable files rather than failing the whole backup.
      }
    }
  }
  return files
}

function countBackupData(data: BackupData): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [key, value] of Object.entries(data)) {
    counts[key] = Array.isArray(value) ? value.length : 0
  }
  return counts
}

export async function createBackup(): Promise<{
  bytes: Uint8Array
  manifest: BackupManifest
  filename: string
}> {
  const [data, files] = await Promise.all([collectCatalogData(), collectUploadFiles()])

  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    counts: countBackupData(data),
    fileCount: Object.keys(files).length,
  }

  const input: Record<string, Uint8Array | [Uint8Array, { level: 0 | 6 }]> = {
    "manifest.json": [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }],
    "data.json": [strToU8(JSON.stringify(data)), { level: 6 }],
  }
  for (const [name, content] of Object.entries(files)) {
    // Media is already compressed; store it verbatim to save CPU.
    input[`uploads/${name}`] = [content, { level: 0 }]
  }

  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    zip(input, { level: 6 }, (err, out) => (err ? reject(err) : resolve(out)))
  })

  const stamp = manifest.createdAt
    .replace(/\.\d+Z$/, "")
    .replace(/[-:]/g, "")
    .replace("T", "-")

  return { bytes, manifest, filename: `backup-${stamp}.zip` }
}

export async function getBackupSummary(): Promise<{
  counts: Record<string, number>
  uploadDir: string
}> {
  const [
    products,
    categories,
    productImages,
    banners,
    menus,
    pages,
    blogPosts,
    siteFaqs,
    siteSettings,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.productImage.count(),
    prisma.banner.count(),
    prisma.menu.count(),
    prisma.page.count(),
    prisma.blogPost.count(),
    prisma.siteFaq.count(),
    prisma.siteSetting.count(),
  ])

  const files = await collectUploadFiles()

  return {
    counts: {
      products,
      categories,
      productImages,
      banners,
      menus,
      pages,
      blogPosts,
      siteFaqs,
      siteSettings,
      files: Object.keys(files).length,
    },
    uploadDir: getUploadDir(),
  }
}

function rows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function addError(summary: RestoreSummary, label: string, error: unknown): void {
  if (summary.errors.length >= 100) return
  const message = error instanceof Error ? error.message : String(error)
  summary.errors.push(`${label}: ${message}`)
}

async function runTable<T>(
  summary: RestoreSummary,
  label: string,
  items: T[],
  step: (item: T) => Promise<unknown>,
): Promise<void> {
  let ok = 0
  for (const item of items) {
    try {
      await step(item)
      ok++
    } catch (error) {
      addError(summary, label, error)
    }
  }
  summary.tables[label] = ok
}

async function wipeData(summary: RestoreSummary): Promise<void> {
  const steps: Array<[string, () => Promise<unknown>]> = [
    ["productRelation", () => prisma.productRelation.deleteMany()],
    ["productTranslation", () => prisma.productTranslation.deleteMany()],
    ["productFAQ", () => prisma.productFAQ.deleteMany()],
    ["productParameter", () => prisma.productParameter.deleteMany()],
    ["productVideo", () => prisma.productVideo.deleteMany()],
    ["productImage", () => prisma.productImage.deleteMany()],
    ["productCategory", () => prisma.productCategory.deleteMany()],
    ["product", () => prisma.product.deleteMany()],
    ["categoryBanner", () => prisma.categoryBanner.deleteMany()],
    ["categoryTranslation", () => prisma.categoryTranslation.deleteMany()],
    ["category:unparent", () => prisma.category.updateMany({ data: { parentId: null } })],
    ["category", () => prisma.category.deleteMany()],
    ["menu:unparent", () => prisma.menu.updateMany({ data: { parentId: null } })],
    ["menu", () => prisma.menu.deleteMany()],
    ["pageTranslation", () => prisma.pageTranslation.deleteMany()],
    ["page", () => prisma.page.deleteMany()],
    ["blogPostTranslation", () => prisma.blogPostTranslation.deleteMany()],
    ["blogPost", () => prisma.blogPost.deleteMany()],
    ["siteFaqTranslation", () => prisma.siteFaqTranslation.deleteMany()],
    ["siteFaq", () => prisma.siteFaq.deleteMany()],
    ["banner", () => prisma.banner.deleteMany()],
    ["siteSetting", () => prisma.siteSetting.deleteMany()],
  ]

  for (const [label, step] of steps) {
    try {
      await step()
    } catch (error) {
      // A dependent table (e.g. a cart line) can block a delete; report and move on.
      addError(summary, `wipe:${label}`, error)
    }
  }
}

export async function restoreBackup(
  bytes: Uint8Array,
  options: { wipe?: boolean } = {},
): Promise<RestoreSummary> {
  const summary: RestoreSummary = {
    mode: options.wipe ? "replace" : "merge",
    tables: {},
    filesRestored: 0,
    errors: [],
  }

  const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(bytes, (err, out) => (err ? reject(err) : resolve(out)))
  })

  const manifestRaw = unzipped["manifest.json"]
  if (!manifestRaw) throw new Error("备份文件缺少 manifest.json（不是有效的站点备份）")

  let manifest: BackupManifest
  try {
    manifest = JSON.parse(strFromU8(manifestRaw)) as BackupManifest
  } catch {
    throw new Error("备份文件的 manifest.json 无法解析")
  }
  if (manifest.format !== BACKUP_FORMAT) throw new Error("备份文件格式不受支持")
  if (typeof manifest.version !== "number" || manifest.version > BACKUP_VERSION) {
    throw new Error(
      `备份文件版本(${manifest.version})高于当前系统支持的版本(${BACKUP_VERSION})`,
    )
  }

  const dataRaw = unzipped["data.json"]
  if (!dataRaw) throw new Error("备份文件缺少 data.json")

  let data: Partial<BackupData>
  try {
    data = JSON.parse(strFromU8(dataRaw)) as Partial<BackupData>
  } catch {
    throw new Error("备份文件的 data.json 无法解析")
  }

  if (options.wipe) await wipeData(summary)

  // Categories: insert without parents first, then link, so ordering never breaks.
  const categories = rows<Prisma.CategoryUncheckedCreateInput>(data.categories)
  await runTable(summary, "categories", categories, (row) =>
    prisma.category.upsert({
      where: { id: row.id as string },
      create: { ...row, parentId: null },
      update: { ...row, parentId: null } as Prisma.CategoryUncheckedUpdateInput,
    }),
  )
  await runTable(
    summary,
    "categories:parent",
    categories.filter((row) => row.parentId),
    (row) =>
      prisma.category.update({
        where: { id: row.id as string },
        data: { parentId: row.parentId as string },
      }),
  )

  await runTable(
    summary,
    "categoryTranslations",
    rows<Prisma.CategoryTranslationUncheckedCreateInput>(data.categoryTranslations),
    (row) =>
      prisma.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: row.categoryId as string,
            locale: row.locale as string,
          },
        },
        create: row,
        update: row as Prisma.CategoryTranslationUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "categoryBanners",
    rows<Prisma.CategoryBannerUncheckedCreateInput>(data.categoryBanners),
    (row) =>
      prisma.categoryBanner.upsert({
        where: { categoryId: row.categoryId as string },
        create: row,
        update: row as Prisma.CategoryBannerUncheckedUpdateInput,
      }),
  )

  // Products.
  await runTable(
    summary,
    "products",
    rows<Prisma.ProductUncheckedCreateInput>(data.products),
    (row) =>
      prisma.product.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.ProductUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "productCategories",
    rows<Prisma.ProductCategoryUncheckedCreateInput>(data.productCategories),
    (row) =>
      prisma.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: row.productId as string,
            categoryId: row.categoryId as string,
          },
        },
        create: row,
        update: row as Prisma.ProductCategoryUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "productImages",
    rows<Prisma.ProductImageUncheckedCreateInput>(data.productImages),
    (row) =>
      prisma.productImage.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.ProductImageUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "productVideos",
    rows<Prisma.ProductVideoUncheckedCreateInput>(data.productVideos),
    (row) =>
      prisma.productVideo.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.ProductVideoUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "productParameters",
    rows<Prisma.ProductParameterUncheckedCreateInput>(data.productParameters),
    (row) =>
      prisma.productParameter.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.ProductParameterUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "productFaqs",
    rows<Prisma.ProductFAQUncheckedCreateInput>(data.productFaqs),
    (row) =>
      prisma.productFAQ.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.ProductFAQUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "productRelations",
    rows<Prisma.ProductRelationUncheckedCreateInput>(data.productRelations),
    (row) =>
      prisma.productRelation.upsert({
        where: {
          sourceProductId_targetProductId: {
            sourceProductId: row.sourceProductId as string,
            targetProductId: row.targetProductId as string,
          },
        },
        create: row,
        update: row as Prisma.ProductRelationUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "productTranslations",
    rows<Prisma.ProductTranslationUncheckedCreateInput>(data.productTranslations),
    (row) =>
      prisma.productTranslation.upsert({
        where: {
          productId_locale: {
            productId: row.productId as string,
            locale: row.locale as string,
          },
        },
        create: row,
        update: row as Prisma.ProductTranslationUncheckedUpdateInput,
      }),
  )

  // Global settings, banners.
  await runTable(
    summary,
    "siteSettings",
    rows<Prisma.SiteSettingUncheckedCreateInput>(data.siteSettings),
    (row) =>
      prisma.siteSetting.upsert({
        where: { key: row.key as string },
        create: row,
        update: row as Prisma.SiteSettingUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "banners",
    rows<Prisma.BannerUncheckedCreateInput>(data.banners),
    (row) =>
      prisma.banner.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.BannerUncheckedUpdateInput,
      }),
  )

  // Menus: same two-pass parent handling as categories.
  const menus = rows<Prisma.MenuUncheckedCreateInput>(data.menus)
  await runTable(summary, "menus", menus, (row) =>
    prisma.menu.upsert({
      where: { id: row.id as string },
      create: { ...row, parentId: null },
      update: { ...row, parentId: null } as Prisma.MenuUncheckedUpdateInput,
    }),
  )
  await runTable(
    summary,
    "menus:parent",
    menus.filter((row) => row.parentId),
    (row) =>
      prisma.menu.update({
        where: { id: row.id as string },
        data: { parentId: row.parentId as string },
      }),
  )

  // Pages.
  await runTable(
    summary,
    "pages",
    rows<Prisma.PageUncheckedCreateInput>(data.pages),
    (row) =>
      prisma.page.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.PageUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "pageTranslations",
    rows<Prisma.PageTranslationUncheckedCreateInput>(data.pageTranslations),
    (row) =>
      prisma.pageTranslation.upsert({
        where: {
          pageId_locale: { pageId: row.pageId as string, locale: row.locale as string },
        },
        create: row,
        update: row as Prisma.PageTranslationUncheckedUpdateInput,
      }),
  )

  // Blog.
  await runTable(
    summary,
    "blogPosts",
    rows<Prisma.BlogPostUncheckedCreateInput>(data.blogPosts),
    (row) =>
      prisma.blogPost.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.BlogPostUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "blogPostTranslations",
    rows<Prisma.BlogPostTranslationUncheckedCreateInput>(data.blogPostTranslations),
    (row) =>
      prisma.blogPostTranslation.upsert({
        where: {
          blogPostId_locale: {
            blogPostId: row.blogPostId as string,
            locale: row.locale as string,
          },
        },
        create: row,
        update: row as Prisma.BlogPostTranslationUncheckedUpdateInput,
      }),
  )

  // Site FAQs.
  await runTable(
    summary,
    "siteFaqs",
    rows<Prisma.SiteFaqUncheckedCreateInput>(data.siteFaqs),
    (row) =>
      prisma.siteFaq.upsert({
        where: { id: row.id as string },
        create: row,
        update: row as Prisma.SiteFaqUncheckedUpdateInput,
      }),
  )

  await runTable(
    summary,
    "siteFaqTranslations",
    rows<Prisma.SiteFaqTranslationUncheckedCreateInput>(data.siteFaqTranslations),
    (row) =>
      prisma.siteFaqTranslation.upsert({
        where: {
          siteFaqId_locale: {
            siteFaqId: row.siteFaqId as string,
            locale: row.locale as string,
          },
        },
        create: row,
        update: row as Prisma.SiteFaqTranslationUncheckedUpdateInput,
      }),
  )

  // Media files. Only flat names inside uploads/ are honored (no traversal).
  const uploadDir = getUploadDir()
  await fs.mkdir(uploadDir, { recursive: true })
  for (const [entryPath, content] of Object.entries(unzipped)) {
    if (!entryPath.startsWith("uploads/")) continue
    const name = entryPath.slice("uploads/".length)
    if (!name || name.endsWith("/")) continue
    if (name.includes("/") || name.includes("\\") || name.includes("..")) continue
    try {
      await fs.writeFile(path.join(uploadDir, name), Buffer.from(content))
      summary.filesRestored++
    } catch (error) {
      addError(summary, `file:${name}`, error)
    }
  }

  return summary
}

import { cache } from "react"
import { prisma } from "@/lib/db/prisma"
import { ALL_SETTING_KEYS } from "./keys"

export type SiteSettings = Record<string, string>

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await prisma.siteSetting.findMany()
  const map: SiteSettings = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
})

export async function getSetting(
  key: string,
  fallback = ""
): Promise<string> {
  const all = await getSiteSettings()
  return all[key] || fallback
}

export async function getSettingsForKeys(keys: string[]): Promise<SiteSettings> {
  const all = await getSiteSettings()
  const out: SiteSettings = {}
  for (const key of keys) {
    if (all[key] !== undefined) out[key] = all[key]
  }
  return out
}

/** Upsert a set of settings (only known keys are persisted). */
export async function updateSiteSettings(input: Record<string, string>) {
  const known = new Set(ALL_SETTING_KEYS)
  for (const [key, value] of Object.entries(input)) {
    if (!known.has(key)) continue
    const existing = await prisma.siteSetting.findUnique({ where: { key } })
    if (existing) {
      await prisma.siteSetting.update({ where: { key }, data: { value } })
    } else {
      await prisma.siteSetting.create({ data: { key, value } })
    }
  }
}

export const SITE_DEFAULTS: Record<string, string> = {
  "site.name": "Commodities From China",
  "site.description": "",
}

export function siteNameValue(s: SiteSettings): string {
  return s["site.name"] || SITE_DEFAULTS["site.name"]
}

export interface SiteSeo {
  siteName: string
  siteDescription: string
  logo: string
  favicon: string
  homepageTitle: string
  homepageDescription: string
  defaultKeywords: string
  language: string
  contactEmail: string
  contactPhone: string
  social: {
    facebook: string
    instagram: string
    linkedin: string
    youtube: string
    twitter: string
  }
}

/** DB-driven site identity used for SEO, structured data, emails, payments and the AI assistant. */
export const getSiteSeo = cache(async (): Promise<SiteSeo> => {
  const s = await getSiteSettings()
  const siteName = siteNameValue(s)
  return {
    siteName,
    siteDescription: s["site.description"] || siteName,
    logo: s["site.logo"] || "",
    favicon: s["site.favicon"] || "",
    homepageTitle: s["seo.homeTitle"] || siteName,
    homepageDescription: s["seo.homeDescription"] || s["site.description"] || siteName,
    defaultKeywords: s["seo.defaultKeywords"] || "",
    language: s["site.language"] || "en",
    contactEmail: s["contact.email"] || "",
    contactPhone: s["contact.phone"] || "",
    social: {
      facebook: s["social.facebook"] || "",
      instagram: s["social.instagram"] || "",
      linkedin: s["social.linkedin"] || "",
      youtube: s["social.youtube"] || "",
      twitter: s["social.twitter"] || "",
    },
  }
})
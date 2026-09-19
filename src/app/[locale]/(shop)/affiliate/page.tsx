import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { AffiliateProgram } from "@/components/affiliate/AffiliateProgram"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "affiliate" })
  return genMeta({
    title: t("metaTitle"),
    description: t("metaDescription"),
    canonical: "/affiliate",
    locale,
  })
}

export default async function AffiliatePage({ params }: Props) {
  const { locale } = await params
  const tc = await getTranslations("common")
  const t = await getTranslations("affiliate")

  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: tc("home"), href: "/" }, { label: t("metaTitle") }]}
          className="mb-8"
        />
        <AffiliateProgram />
      </Container>
    </div>
  )
}
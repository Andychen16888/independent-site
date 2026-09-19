import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CartContent } from "@/components/cart/CartContent"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "cart" })
  return genMeta({
    title: t("title"),
    description: t("metaDescription"),
    noindex: true,
    nofollow: true,
    locale,
  })
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations("cart")
  const tc = await getTranslations("common")

  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[{ label: tc("home"), href: "/" }, { label: t("title") }]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-12">{t("title")}</h1>
        <CartContent />
      </Container>
    </div>
  )
}
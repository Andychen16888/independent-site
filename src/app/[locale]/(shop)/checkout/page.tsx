import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "checkout" })
  return genMeta({
    title: t("title"),
    description: t("metaDescription"),
    noindex: true,
    nofollow: true,
    locale,
  })
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations("checkout")
  const tc = await getTranslations("common")
  const tcart = await getTranslations("cart")

  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[
            { label: tc("home"), href: "/" },
            { label: tcart("title"), href: "/cart" },
            { label: t("title") },
          ]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-12">{t("title")}</h1>
        <CheckoutForm />
      </Container>
    </div>
  )
}
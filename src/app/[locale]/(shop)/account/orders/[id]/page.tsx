import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { OrderDetail } from "@/components/order/OrderDetail"
import { generateMetadata as genMeta } from "@/lib/seo/generate-metadata"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "account.ordersDetail" })
  return genMeta({
    title: t("metaTitle"),
    description: t("metaDescription"),
    noindex: true,
    nofollow: true,
    locale,
  })
}

export default async function OrderDetailPage({ params }: Props) {
  const { id, locale } = await params
  const t = await getTranslations("account.ordersDetail")
  const ta = await getTranslations("account")
  const tas = await getTranslations("account.sidebar")
  const tc = await getTranslations("common")

  return (
    <div className="min-h-screen">
      <Container>
        <Breadcrumb
          items={[
            { label: tc("home"), href: "/" },
            { label: ta("myAccount"), href: "/account" },
            { label: tas("orders"), href: "/account/orders" },
            { label: `#${id.slice(0, 8)}` },
          ]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-12">{t("title")}</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <OrderDetail orderId={id} />
        </div>
      </Container>
    </div>
  )
}
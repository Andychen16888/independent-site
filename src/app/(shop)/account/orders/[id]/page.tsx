import { Container } from "@/components/ui/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { OrderDetail } from "@/components/order/OrderDetail"
import { generateMetadata } from "@/lib/seo/generate-metadata"

export const metadata = generateMetadata({
  title: "Order Details",
  description: "View your order details and tracking information.",
})

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="pt-[100px] md:pt-[116px] min-h-screen">
      <Container>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "My Account", href: "/account" },
            { label: "Orders", href: "/account/orders" },
            { label: `#${id.slice(0, 8)}` },
          ]}
          className="mb-8"
        />
        <h1 className="heading-xl mb-12">Order Details</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <OrderDetail orderId={id} />
        </div>
      </Container>
    </div>
  )
}

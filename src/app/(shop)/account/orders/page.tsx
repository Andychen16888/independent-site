import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { OrdersList } from "@/components/account/OrdersList"

export default function OrdersPage() {
  return (
    <div className="min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">My Orders</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <OrdersList />
        </div>
      </Container>
    </div>
  )
}

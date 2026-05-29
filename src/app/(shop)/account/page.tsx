import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { AccountOverview } from "@/components/account/AccountOverview"

export default function AccountPage() {
  return (
    <div className="pt-[100px] md:pt-[116px] min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">My Account</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <AccountOverview />
        </div>
      </Container>
    </div>
  )
}

import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { AccountOverview } from "@/components/account/AccountOverview"

export default async function AccountPage() {
  const t = await getTranslations("account")

  return (
    <div className="min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">{t("myAccount")}</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <AccountOverview />
        </div>
      </Container>
    </div>
  )
}
import { getTranslations } from "next-intl/server"
import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"

export default async function AccountReviewsPage() {
  const t = await getTranslations("account.reviewsPage")

  return (
    <div className="min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">{t("title")}</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <div>
            <div className="bg-cream p-12 text-center">
              <p className="text-body text-sm">{t("noReviews")}</p>
              <p className="text-xs text-stone mt-2">
                {t("noReviewsBody")}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
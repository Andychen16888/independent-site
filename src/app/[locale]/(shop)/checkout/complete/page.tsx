import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"
import { HiOutlineCheckCircle } from "react-icons/hi2"

export default async function CheckoutCompletePage() {
  const t = await getTranslations("checkout")
  const tcart = await getTranslations("cart")

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container>
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-sage/20 rounded-full flex items-center justify-center">
            <HiOutlineCheckCircle className="w-8 h-8 text-sage" />
          </div>
          <h1 className="heading-xl mb-4">{t("orderConfirmed")}</h1>
          <p className="text-body mb-8">
            {t("thankYou")}
          </p>
          <div className="space-y-4">
            <Link href="/account/orders" className="btn-primary block">
              {t("viewOrder")}
            </Link>
            <Link href="/" className="btn-outline block">
              {tcart("continueShopping")}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
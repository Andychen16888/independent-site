import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"

export default async function LocaleNotFound() {
  const t = await getTranslations("common")
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <p className="font-serif text-8xl text-mist mb-6">404</p>
          <h1 className="heading-lg mb-4">{t("notFoundTitle")}</h1>
          <p className="text-body mb-8">{t("notFoundDescription")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary">
              {t("backToHome")}
            </Link>
            <Link href="/products" className="btn-outline">
              {t("browseProducts")}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
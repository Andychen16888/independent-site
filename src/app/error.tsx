"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("common")
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <p className="font-serif text-8xl text-mist mb-6">500</p>
          <h1 className="heading-lg mb-4">{t("errorTitle")}</h1>
          <p className="text-body mb-8">{t("errorDescription")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={reset} variant="primary">
              {t("tryAgain")}
            </Button>
            <Link href="/" className="btn-outline inline-flex items-center justify-center">
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
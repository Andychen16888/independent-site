"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"
import { fetchJsonResponse, responseErrorMessage } from "@/lib/json-response"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const t = useTranslations("auth")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { parsed } = await fetchJsonResponse("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (parsed.ok) {
        setSent(true)
      } else {
        setError(responseErrorMessage(parsed, t("somethingWentWrong")))
      }
    } catch {
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <h1 className="heading-lg mb-4">{t("checkYourEmail")}</h1>
            <p className="text-body mb-8">
              {t("checkYourEmailBody")}
            </p>
            <Link
              href="/auth/signin"
              className="text-charcoal underline underline-offset-4 decoration-mist hover:decoration-charcoal text-sm"
            >
              {t("backToSignIn")}
            </Link>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="heading-lg mb-3">{t("forgotTitle")}</h1>
            <p className="text-body">
              {t("forgotSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rosegold/10 border border-rosegold/30 px-4 py-3 text-sm text-rosegold">
                {error}
              </div>
            )}

            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center px-8 py-3 bg-charcoal text-white text-sm tracking-widest uppercase font-light transition-all duration-300 hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t("sending") : t("sendResetLink")}
            </button>
          </form>

          <p className="text-center text-sm text-stone mt-8">
            {t("rememberPassword")}{" "}
            <Link
              href="/auth/signin"
              className="text-charcoal underline underline-offset-4 decoration-mist hover:decoration-charcoal"
            >
              {t("signInLink")}
            </Link>
          </p>
        </div>
      </Container>
    </div>
  )
}

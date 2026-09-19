"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Container } from "@/components/ui/Container"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const t = useTranslations("home.newsletter")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus("success")
        setEmail("")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <section className="section-padding bg-cream">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <span className="text-caption mb-4 block">{t("eyebrow")}</span>
          <h2 className="heading-lg mb-4">{t("heading")}</h2>
          <p className="text-body mb-8">
            {t("body")}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder")}
              required
              className="flex-1 px-6 py-3 bg-transparent border border-charcoal/30 focus:border-charcoal outline-none text-sm transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary whitespace-nowrap"
            >
              {status === "loading" ? t("subscribing") : t("subscribe")}
            </button>
          </form>

          {status === "success" && (
            <p className="text-sage text-sm mt-4">
              {t("success")}
            </p>
          )}
          {status === "error" && (
            <p className="text-rosegold text-sm mt-4">
              {t("error")}
            </p>
          )}

          <p className="text-xs text-stone mt-4">
            {t("disclaimer")}
          </p>
        </motion.div>
      </Container>
    </section>
  )
}

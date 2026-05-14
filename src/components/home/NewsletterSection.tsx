"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Container } from "@/components/ui/Container"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

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
          <span className="text-caption mb-4 block">Stay Connected</span>
          <h2 className="heading-lg mb-4">Join Our Inner Circle</h2>
          <p className="text-body mb-8">
            Be the first to discover new arrivals, exclusive collections, and 
            receive 10% off your first order.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-3 bg-transparent border border-charcoal/30 focus:border-charcoal outline-none text-sm transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary whitespace-nowrap"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </form>

          {status === "success" && (
            <p className="text-sage text-sm mt-4">
              Welcome to the circle! Check your inbox for your 10% off code.
            </p>
          )}
          {status === "error" && (
            <p className="text-rosegold text-sm mt-4">
              Something went wrong. Please try again.
            </p>
          )}

          <p className="text-xs text-stone mt-4">
            No spam, ever. Unsubscribe anytime. By subscribing, you agree to our Privacy Policy.
          </p>
        </motion.div>
      </Container>
    </section>
  )
}

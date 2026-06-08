"use client"

import { useState } from "react"
import { Container } from "@/components/ui/Container"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        setSent(true)
      } else {
        setError(data.error || "Something went wrong")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <h1 className="heading-lg mb-4">Check Your Email</h1>
            <p className="text-body mb-8">
              If an account exists with that email, we&apos;ve sent a password reset link.
              It expires in 1 hour.
            </p>
            <a
              href="/auth/signin"
              className="text-charcoal underline underline-offset-4 decoration-mist hover:decoration-charcoal text-sm"
            >
              Back to sign in
            </a>
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
            <h1 className="heading-lg mb-3">Forgot Password</h1>
            <p className="text-body">
              Enter your email and we&apos;ll send you a reset link.
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
              placeholder="Email"
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
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="text-center text-sm text-stone mt-8">
            Remember your password?{" "}
            <a
              href="/auth/signin"
              className="text-charcoal underline underline-offset-4 decoration-mist hover:decoration-charcoal"
            >
              Sign in
            </a>
          </p>
        </div>
      </Container>
    </div>
  )
}

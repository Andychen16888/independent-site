"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Registration failed")
      }

      await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        callbackUrl: "/account",
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="heading-lg mb-3">Create Account</h1>
            <p className="text-body">Join the {process.env.NEXT_PUBLIC_SITE_NAME || "Store"} community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rosegold/10 border border-rosegold/30 px-4 py-3 text-sm text-rosegold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
              />
              <input
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm transition-colors"
            />

            <Button type="submit" loading={isLoading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-stone mt-8">
            Already have an account?{" "}
            <a href="/auth/signin" className="text-charcoal underline underline-offset-4 decoration-mist hover:decoration-charcoal">
              Sign in
            </a>
          </p>
        </div>
      </Container>
    </div>
  )
}

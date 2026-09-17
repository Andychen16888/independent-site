"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { HiOutlineShare, HiOutlineCurrencyDollar, HiOutlineUserGroup, HiOutlineChartBar } from "react-icons/hi2"

export function AffiliateProgram() {
  const [isApplying, setIsApplying] = useState(false)
  const [email, setEmail] = useState("")

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplying(true)
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        alert("Application submitted! We'll review and get back to you.")
        setEmail("")
      }
    } catch {
      alert("Something went wrong. Please try again.")
    } finally {
      setIsApplying(false)
    }
  }

  const benefits = [
    {
      icon: HiOutlineCurrencyDollar,
      title: "Earn 5-15% Commission",
      description: "Generous commissions on every sale made through your referral link",
    },
    {
      icon: HiOutlineShare,
      title: "Unique Referral Links",
      description: "Automatically generated tracking links for your content",
    },
    {
      icon: HiOutlineUserGroup,
      title: "Dedicated Support",
      description: "Personal affiliate manager and exclusive resources",
    },
    {
      icon: HiOutlineChartBar,
      title: "Real-time Analytics",
      description: "Track clicks, conversions, and commissions in real-time",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <span className="text-caption mb-4 block">Partner With Us</span>
        <h1 className="heading-xl mb-6">Affiliate Program</h1>
        <p className="text-body max-w-2xl mx-auto">
          Share quality, factory-direct products from China with your audience. 
          Earn generous commissions while promoting products you believe in.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="bg-cream p-8">
            <benefit.icon className="w-8 h-8 text-stone mb-4" />
            <h3 className="font-serif text-lg mb-2">{benefit.title}</h3>
            <p className="text-body text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-cream p-8 md:p-12 text-center max-w-lg mx-auto">
        <h2 className="font-serif text-xl mb-4">Apply Now</h2>
        <p className="text-body text-sm mb-6">
          Join our affiliate program and start earning today.
        </p>
        <form onSubmit={handleApply} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full px-4 py-3 bg-transparent border border-charcoal/20 focus:border-charcoal outline-none text-sm"
          />
          <Button type="submit" loading={isApplying} className="w-full">
            Apply Now
          </Button>
        </form>
        <p className="text-xs text-stone mt-4">
          We review all applications within 2-3 business days.
        </p>
      </div>
    </div>
  )
}

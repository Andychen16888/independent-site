"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#2C2C2C",
            color: "#FFFFF0",
            fontSize: "14px",
            borderRadius: "0",
            letterSpacing: "0.05em",
          },
        }}
      />
    </SessionProvider>
  )
}

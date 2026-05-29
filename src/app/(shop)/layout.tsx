import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ChatButton } from "@/components/chat/ChatButton"

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="h-[100px] md:h-[116px]" />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ChatButton />
    </>
  )
}

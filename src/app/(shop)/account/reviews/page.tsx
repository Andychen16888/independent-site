import { Container } from "@/components/ui/Container"
import { AccountSidebar } from "@/components/account/AccountSidebar"

export default function AccountReviewsPage() {
  return (
    <div className="min-h-screen">
      <Container>
        <h1 className="heading-xl mb-12">My Reviews</h1>
        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          <AccountSidebar />
          <div>
            <div className="bg-cream p-12 text-center">
              <p className="text-body text-sm">No reviews yet</p>
              <p className="text-xs text-stone mt-2">
                Reviews will appear here after you purchase and review products.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

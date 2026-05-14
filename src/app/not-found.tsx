import Link from "next/link"
import { Container } from "@/components/ui/Container"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <p className="font-serif text-8xl text-mist mb-6">404</p>
          <h1 className="heading-lg mb-4">Page Not Found</h1>
          <p className="text-body mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
            <Link href="/products" className="btn-outline">
              Browse Products
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}

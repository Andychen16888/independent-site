import { Container } from "@/components/ui/Container"
import { SectionLoading } from "@/components/ui/Loading"

export default function ProductsLoading() {
  return (
    <div>
      <Container>
        <div className="animate-pulse mb-8">
          <div className="h-4 bg-mist rounded w-1/4 mb-4" />
          <div className="h-10 bg-mist rounded w-1/3 mb-4" />
          <div className="h-4 bg-mist rounded w-2/3" />
        </div>
        <SectionLoading />
      </Container>
    </div>
  )
}

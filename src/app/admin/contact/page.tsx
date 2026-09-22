import SlugPageEditor from "@/components/admin/SlugPageEditor"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Contact Us / 联系我们",
}

export default function AdminContactPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Contact Us</h1>
        <p className="text-sm text-stone mt-1">Manage the Contact Us page content, publishing state, and SEO.</p>
      </div>
      <SlugPageEditor slug="contact" />
    </div>
  )
}
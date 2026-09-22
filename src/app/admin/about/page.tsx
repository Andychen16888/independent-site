import SlugPageEditor from "@/components/admin/SlugPageEditor"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "About Us / 关于我们",
}

export default function AdminAboutPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">About Us</h1>
        <p className="text-sm text-stone mt-1">Manage the About Us page content, publishing state, and SEO.</p>
      </div>
      <SlugPageEditor slug="about" />
    </div>
  )
}
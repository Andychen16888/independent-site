import BannerForm from "@/components/admin/BannerForm"

export const metadata = {
  title: "New Banner",
}

export default function NewBannerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">New Banner</h1>
        <p className="text-body text-sm mt-1">Add a homepage banner. Order by sort order (ascending).</p>
      </div>
      <BannerForm mode="new" />
    </div>
  )
}
import Link from "next/link"

export default function AdminBannersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-md">Banners</h1>
          <p className="text-body text-sm mt-1">Manage homepage banners.</p>
        </div>
        <Link href="/admin/banners/new" className="btn-primary text-xs">Add Banner</Link>
      </div>
      <div className="bg-white border border-mist p-12 text-center text-sm text-stone">
        No banners yet.
      </div>
    </div>
  )
}

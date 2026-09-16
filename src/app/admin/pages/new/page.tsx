import PageForm from "@/components/admin/PageForm"

export const metadata = {
  title: "New Page",
}

export default function NewPagePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">New Page</h1>
        <p className="text-body text-sm mt-1">Create a content page — visible at /pages/{`{slug}`}.</p>
      </div>
      <PageForm mode="new" />
    </div>
  )
}
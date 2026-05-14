export default function AdminOrdersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Orders</h1>
        <p className="text-body text-sm mt-1">View and manage customer orders.</p>
      </div>

      <div className="bg-white border border-mist">
        <div className="p-12 text-center text-sm text-stone">
          No orders yet.
        </div>
      </div>
    </div>
  )
}

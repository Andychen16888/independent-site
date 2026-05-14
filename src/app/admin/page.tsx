export default function AdminDashboard() {
  const stats = [
    { label: "Total Revenue", value: "$0.00", change: "+0%", isPositive: true },
    { label: "Orders", value: "0", change: "+0", isPositive: true },
    { label: "Products", value: "0", change: "+0", isPositive: true },
    { label: "Customers", value: "0", change: "+0", isPositive: true },
    { label: "Affiliates", value: "0", change: "+0", isPositive: true },
    { label: "Conversion Rate", value: "0%", change: "0%", isPositive: true },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Dashboard</h1>
        <p className="text-body text-sm mt-1">Welcome to your store admin.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-mist p-4">
            <p className="text-xs text-stone tracking-wider uppercase mb-1">{stat.label}</p>
            <p className="text-xl font-serif">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.isPositive ? "text-sage" : "text-rosegold"}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">Recent Orders</h3>
          <div className="text-center py-8 text-sm text-stone">
            No orders yet
          </div>
        </div>
        <div className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">Top Products</h3>
          <div className="text-center py-8 text-sm text-stone">
            No products yet
          </div>
        </div>
      </div>
    </div>
  )
}

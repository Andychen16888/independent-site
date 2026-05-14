export default function AdminMarketingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Marketing</h1>
        <p className="text-body text-sm mt-1">Manage coupons, discounts, and campaigns.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">Coupons</h3>
          <div className="text-center py-8 text-sm text-stone">No coupons yet</div>
        </div>
        <div className="bg-white border border-mist p-6">
          <h3 className="font-serif text-base mb-4">Email Campaigns</h3>
          <div className="text-center py-8 text-sm text-stone">No campaigns yet</div>
        </div>
      </div>
    </div>
  )
}

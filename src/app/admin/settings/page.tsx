export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md">Settings</h1>
        <p className="text-body text-sm mt-1">Configure your store settings.</p>
      </div>

      <div className="bg-white border border-mist p-8 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm text-stone mb-2">Store Name</label>
          <input
            type="text"
            defaultValue="Oriental Beauty"
            className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-stone mb-2">Support Email</label>
          <input
            type="email"
            defaultValue="hello@orientalbeauty.com"
            className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-stone mb-2">Default Currency</label>
          <select className="w-full px-4 py-3 bg-transparent border border-mist focus:border-charcoal outline-none text-sm transition-colors">
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
            <option>AUD</option>
          </select>
        </div>
      </div>
    </div>
  )
}

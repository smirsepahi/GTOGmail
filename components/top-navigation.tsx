import ProfileDropdown from "@/components/profile/ProfileDropdown"

export function TopNavigation() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">GTO</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">GTOGmail</h1>
        </div>
      </div>

      <ProfileDropdown />
    </header>
  )
}

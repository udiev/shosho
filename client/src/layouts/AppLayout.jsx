import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar placeholder */}
      <aside className="w-64 bg-white border-l border-gray-200 p-4">
        <div className="text-2xl font-bold text-primary-600 mb-8">🌸 שושו</div>
        <nav className="space-y-1">
          {['דשבורד', 'יומן', 'לקוחות', 'שירותים', 'הגדרות'].map(item => (
            <div key={item} className="px-3 py-2 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-700 cursor-pointer">
              {item}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

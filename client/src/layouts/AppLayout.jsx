import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'דשבורד', icon: '📊' },
  { to: '/appointments', label: 'יומן', icon: '📅' },
  { to: '/clients', label: 'לקוחות', icon: '👥' },
  { to: '/services', label: 'שירותים', icon: '✂️' },
  { to: '/settings', label: 'הגדרות', icon: '⚙️' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="text-2xl font-bold text-primary-600">🌸 שושו</div>
          {user && <div className="text-sm text-gray-500 mt-1">{user.name}</div>}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm font-medium ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition"
          >
            התנתק
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

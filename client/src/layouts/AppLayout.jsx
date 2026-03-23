import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  UsersIcon,
  ScissorsIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'

// Desktop sidebar shows all nav items; mobile bottom nav shows 5 (services less needed on mobile)
const sidebarItems = [
  { to: '/dashboard',    label: 'בית',       Icon: Squares2X2Icon  },
  { to: '/appointments', label: 'יומן',      Icon: CalendarDaysIcon },
  { to: '/clients',      label: 'לקוחות',    Icon: UsersIcon        },
  { to: '/services',     label: 'שירותים',   Icon: ScissorsIcon     },
  { to: '/analytics',    label: 'אנליטיקס',  Icon: ChartBarIcon     },
  { to: '/settings',     label: 'הגדרות',    Icon: Cog6ToothIcon    },
]

const mobileNavItems = [
  { to: '/dashboard',    label: 'בית',       Icon: Squares2X2Icon  },
  { to: '/appointments', label: 'יומן',      Icon: CalendarDaysIcon },
  { to: '/clients',      label: 'לקוחות',    Icon: UsersIcon        },
  { to: '/analytics',    label: 'אנליטיקס',  Icon: ChartBarIcon     },
  { to: '/settings',     label: 'הגדרות',    Icon: Cog6ToothIcon    },
]

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-primary-50 border-l border-primary-100">

        {/* Brand */}
        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)', boxShadow: '0 4px 12px rgba(190,24,93,0.25)' }}
            >
              <span className="text-white font-black text-lg tracking-tighter">ש</span>
            </div>
            <div className="leading-tight">
              <p className="font-extrabold text-primary-900 text-[17px] tracking-tight">שושו</p>
              <p className="text-[11px] text-primary-300 font-medium mt-0.5">ניהול תורים</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {sidebarItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-700 bg-white border border-primary-100 shadow-sm'
                  : 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary-400 hover:text-primary-700 hover:bg-white/70 transition-all duration-150'
              }
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 pb-5">
          <div className="bg-white rounded-2xl border border-primary-100 p-3 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f9a8d4 0%, #be185d 100%)' }}
              >
                {user?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate leading-none">{user?.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all"
            >
              <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5" />
              <span>התנתק</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-gray-50/60">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 bg-white border-b border-primary-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)' }}
            >
              <span className="text-white font-black text-sm">ש</span>
            </div>
            <span className="font-extrabold text-primary-900 text-base tracking-tight">שושו</span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #f9a8d4 0%, #be185d 100%)' }}
          >
            {user?.name?.charAt(0) || '?'}
          </div>
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-50 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {mobileNavItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <Icon className={`w-[22px] h-[22px] transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}

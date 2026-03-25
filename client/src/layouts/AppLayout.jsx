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

const sidebarItems = [
  { to: '/dashboard',    label: 'בית',       Icon: Squares2X2Icon   },
  { to: '/appointments', label: 'יומן',      Icon: CalendarDaysIcon },
  { to: '/clients',      label: 'לקוחות',    Icon: UsersIcon        },
  { to: '/services',     label: 'שירותים',   Icon: ScissorsIcon     },
  { to: '/analytics',    label: 'אנליטיקס',  Icon: ChartBarIcon     },
  { to: '/settings',     label: 'הגדרות',    Icon: Cog6ToothIcon    },
]

const mobileNavItems = [
  { to: '/dashboard',    label: 'בית',       Icon: Squares2X2Icon   },
  { to: '/appointments', label: 'יומן',      Icon: CalendarDaysIcon },
  { to: '/clients',      label: 'לקוחות',    Icon: UsersIcon        },
  { to: '/analytics',    label: 'אנליטיקס',  Icon: ChartBarIcon     },
  { to: '/settings',     label: 'הגדרות',    Icon: Cog6ToothIcon    },
]

function BusinessBrand({ business, size = 'lg' }) {
  const isLg = size === 'lg'
  if (business?.logo_url) {
    return (
      <img
        src={business.logo_url}
        alt={business.name}
        className={isLg ? 'h-12 max-w-full object-contain' : 'h-7 max-w-[120px] object-contain'}
      />
    )
  }
  const initial = business?.name?.charAt(0) || '?'
  const color = business?.primary_color || '#C2185B'
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black ${isLg ? 'w-10 h-10 text-lg' : 'w-8 h-8 text-sm'}`}
        style={{ background: `linear-gradient(135deg, ${color}cc 0%, ${color} 100%)`, boxShadow: `0 4px 12px ${color}40` }}
      >
        {initial}
      </div>
      {isLg && (
        <div className="leading-tight min-w-0">
          <p className="font-extrabold text-slate-800 text-[17px] tracking-tight truncate">{business?.name || 'העסק שלי'}</p>
        </div>
      )}
      {!isLg && (
        <span className="font-bold text-slate-800 text-sm truncate max-w-[100px]">{business?.name || 'העסק שלי'}</span>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { user, business, logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-slate-50 border-l border-slate-100">

        {/* Business brand */}
        <div className="px-5 pt-6 pb-4 border-b border-slate-100">
          <BusinessBrand business={business} size="lg" />
          {business?.name && business?.logo_url && (
            <p className="text-xs text-slate-400 mt-1 font-medium truncate">{business.name}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {sidebarItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-700 bg-white border border-primary-100 shadow-sm'
                  : 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-white transition-all duration-150'
              }
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="px-3 pb-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${(business?.primary_color || '#C2185B')}88 0%, ${business?.primary_color || '#C2185B'} 100%)` }}
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
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
            >
              <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5" />
              <span>התנתק</span>
            </button>
          </div>
        </div>

        {/* Shosho branding — always visible */}
        <div className="px-5 pb-5 pt-1 flex items-center gap-2 border-t border-slate-100">
          <img src="/shosho-icon-circle.svg" alt="Shosho" className="w-5 h-5 opacity-60" />
          <img src="/shosho-wordmark-eng.svg" alt="Shosho" className="h-4 opacity-40" />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-gray-50/60">

        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
          <BusinessBrand business={business} size="sm" />
          <div className="flex items-center gap-2">
            <img src="/shosho-icon-circle.svg" alt="Shosho" className="w-6 h-6 opacity-50" />
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

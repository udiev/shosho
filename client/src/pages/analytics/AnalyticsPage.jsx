import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const MONTH_NAMES = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']

function BarChart({ data, valueKey, color = '#db2777', formatValue = v => v }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-t-md transition-all duration-300 min-h-[2px]"
              style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color }}
            />
            <span className="text-[9px] text-slate-400 font-medium">
              {MONTH_NAMES[(d.mo || 1) - 1]}
            </span>
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {formatValue(d[valueKey] || 0)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchAnalytics() }, [])

  async function fetchAnalytics() {
    try {
      const res = await api.get('/api/stats/analytics')
      setData(res.data)
    } catch {
      setError('שגיאה בטעינת נתונים')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-primary-100 border-t-primary-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm border border-red-100">{error}</div>
  }

  const monthly = data?.monthly || []
  const topServices = data?.top_services || []
  const newClients = data?.new_clients || []
  const m = data?.this_month || {}

  const totalAppts = (m.completed || 0) + (m.cancelled || 0) + (m.no_show || 0)
  const completionRate = totalAppts > 0 ? Math.round(((m.completed || 0) / totalAppts) * 100) : 0
  const noShowRate = totalAppts > 0 ? Math.round(((m.no_show || 0) / totalAppts) * 100) : 0

  const kpiCards = [
    {
      label: 'הכנסה החודש',
      value: `₪${Number(m.revenue || 0).toLocaleString()}`,
      Icon: CurrencyDollarIcon,
      bg: '#fdf2f8', iconBg: '#fce7f3', iconColor: '#be185d', valueColor: '#9d174d',
    },
    {
      label: 'תורים שהושלמו',
      value: m.completed || 0,
      Icon: CalendarDaysIcon,
      bg: '#f0fdf4', iconBg: '#dcfce7', iconColor: '#16a34a', valueColor: '#15803d',
    },
    {
      label: 'ממוצע לתור',
      value: m.avg_price ? `₪${Math.round(m.avg_price)}` : '—',
      Icon: ChartBarIcon,
      bg: '#faf5ff', iconBg: '#f3e8ff', iconColor: '#7c3aed', valueColor: '#6d28d9',
    },
    {
      label: 'לקוחות חדשים',
      value: newClients.reduce((s, r) => {
        const now = new Date()
        if (r.yr === now.getFullYear() && r.mo === now.getMonth() + 1) return s + (r.new_clients || 0)
        return s
      }, 0),
      Icon: UserPlusIcon,
      bg: '#fff7ed', iconBg: '#ffedd5', iconColor: '#ea580c', valueColor: '#c2410c',
    },
  ]

  const maxService = Math.max(...topServices.map(s => s.count), 1)

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">אנליטיקס</h1>
        <p className="text-xs text-slate-400 mt-0.5">סיכום ביצועים והכנסות</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map(card => (
          <div
            key={card.label}
            className="rounded-2xl p-4 border border-white"
            style={{ backgroundColor: card.bg, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: card.iconBg }}>
              <card.Icon className="w-4 h-4" style={{ color: card.iconColor }} />
            </div>
            <p className="text-xl md:text-2xl font-bold leading-none" style={{ color: card.valueColor }}>
              {card.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-1.5 font-medium leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Monthly revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">הכנסות חודשיות</h2>
          {monthly.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-sm text-slate-400">אין נתונים עדיין</div>
          ) : (
            <BarChart
              data={monthly}
              valueKey="revenue"
              color="#db2777"
              formatValue={v => `₪${Number(v).toLocaleString()}`}
            />
          )}
        </div>

        {/* Monthly appointments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">תורים לפי חודש</h2>
          {monthly.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-sm text-slate-400">אין נתונים עדיין</div>
          ) : (
            <BarChart
              data={monthly}
              valueKey="appointment_count"
              color="#8b5cf6"
              formatValue={v => `${v} תורים`}
            />
          )}
        </div>
      </div>

      {/* Status breakdown + top services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* This month status breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">סטטוס תורים — החודש</h2>
          <div className="space-y-3">
            {[
              { label: 'הושלמו', value: m.completed || 0, color: '#22c55e', bg: '#f0fdf4' },
              { label: 'בוטלו', value: m.cancelled || 0, color: '#f43f5e', bg: '#fff1f2' },
              { label: 'לא הגיעו', value: m.no_show || 0, color: '#f59e0b', bg: '#fffbeb' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-700">{row.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: totalAppts > 0 ? `${(row.value / totalAppts) * 100}%` : '0%',
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 flex gap-4 text-xs text-slate-400 border-t border-slate-50 mt-3">
              <span>השלמה: <strong className="text-emerald-600">{completionRate}%</strong></span>
              <span>אי הגעה: <strong className="text-amber-600">{noShowRate}%</strong></span>
            </div>
          </div>
        </div>

        {/* Top services */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">שירותים מובילים — השנה</h2>
          {topServices.length === 0 ? (
            <div className="flex items-center justify-center h-28 text-sm text-slate-400">אין נתונים עדיין</div>
          ) : (
            <div className="space-y-3">
              {topServices.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#db2777' }} />
                      <span className="font-medium text-slate-600 truncate max-w-[140px]">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-400">{s.count} תורים</span>
                      {s.revenue > 0 && <span className="font-semibold text-slate-700">₪{Number(s.revenue).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(s.count / maxService) * 100}%`,
                        backgroundColor: s.color || '#db2777',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New clients trend */}
      {newClients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">לקוחות חדשים לפי חודש</h2>
          <BarChart
            data={newClients}
            valueKey="new_clients"
            color="#f59e0b"
            formatValue={v => `${v} לקוחות`}
          />
        </div>
      )}
    </div>
  )
}

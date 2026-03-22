import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  CalendarDaysIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  scheduled: 'מתוזמן',
  confirmed: 'מאושר',
  completed: 'הושלם',
  cancelled: 'בוטל',
  no_show: 'לא הגיע',
}

const STATUS_COLORS = {
  scheduled:  { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  confirmed:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  completed:  { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' },
  cancelled:  { bg: '#fff1f2', text: '#be123c', dot: '#f43f5e' },
  no_show:    { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      const res = await api.get('/api/stats/dashboard')
      setData(res.data)
    } catch (err) {
      console.error(err)
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

  const stats       = data?.stats || {}
  const todayAppts  = data?.today_appointments || []

  const secondaryCards = [
    {
      label: 'תורים מחר',
      value: stats.tomorrow_count ?? 0,
      Icon: CalendarDaysIcon,
      bg: '#fdf2f8',
      iconBg: '#fce7f3',
      iconColor: '#be185d',
      valueColor: '#9d174d',
    },
    {
      label: 'סה"כ לקוחות',
      value: stats.total_clients ?? 0,
      Icon: UsersIcon,
      bg: '#faf5ff',
      iconBg: '#f3e8ff',
      iconColor: '#7c3aed',
      valueColor: '#6d28d9',
    },
    {
      label: 'הושלמו החודש',
      value: stats.month_completed ?? 0,
      Icon: CheckCircleIcon,
      bg: '#f0fdf4',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      valueColor: '#15803d',
    },
    {
      label: 'אי הגעות',
      value: stats.month_no_show ?? 0,
      Icon: ExclamationTriangleIcon,
      bg: '#fffbeb',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      valueColor: '#b45309',
    },
  ]

  return (
    <div className="max-w-5xl">

      {/* ── Hero banner ── */}
      <div
        className="relative rounded-3xl p-7 mb-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #be185d 0%, #db2777 45%, #f472b6 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 left-24 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute top-4 -left-2 w-14 h-14 rounded-full bg-white/5" />

        {/* Greeting */}
        <div className="relative z-10 mb-5">
          <p className="text-pink-200 text-sm font-medium">
            {new Date().toLocaleDateString('he-IL', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
          <h1 className="text-white text-2xl font-bold mt-1">
            שלום, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>

        {/* Embedded key stats */}
        <div className="relative z-10 flex gap-3 flex-wrap">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
            <p className="text-white font-bold text-2xl leading-none">{stats.today_count ?? 0}</p>
            <p className="text-pink-100 text-xs mt-1 font-medium">תורים היום</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
            <p className="text-white font-bold text-2xl leading-none">
              ₪{Number(stats.month_revenue ?? 0).toLocaleString()}
            </p>
            <p className="text-pink-100 text-xs mt-1 font-medium">הכנסה החודש</p>
          </div>
        </div>
      </div>

      {/* ── Secondary stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {secondaryCards.map(card => (
          <div
            key={card.label}
            className="rounded-2xl p-5 border border-white"
            style={{ backgroundColor: card.bg, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: card.iconBg }}
            >
              <card.Icon className="w-[18px] h-[18px]" style={{ color: card.iconColor }} />
            </div>
            <p className="text-2xl font-bold leading-none" style={{ color: card.valueColor }}>
              {card.value}
            </p>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Today's appointments ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-primary-500" />
            </div>
            <h2 className="font-semibold text-gray-800 text-sm">תורים להיום</h2>
          </div>
          <span className="text-[11px] font-semibold text-primary-500 bg-primary-50 px-2.5 py-1 rounded-full">
            {todayAppts.length} תורים
          </span>
        </div>

        {/* Empty state */}
        {todayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">אין תורים להיום</p>
              <p className="text-xs text-gray-300 mt-0.5">נפלא! יש זמן לנוח 🌸</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayAppts.map((appt, i) => {
              const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
                >
                  {/* Row number */}
                  <span className="text-xs text-gray-300 font-medium w-4 flex-shrink-0 text-center">
                    {i + 1}
                  </span>

                  {/* Service color bar */}
                  <div
                    className="w-1 h-9 rounded-full flex-shrink-0"
                    style={{ backgroundColor: appt.service_color || '#db2777' }}
                  />

                  {/* Time */}
                  <div className="w-14 flex-shrink-0">
                    <p className="text-sm font-bold text-gray-700 leading-none">{formatTime(appt.start_time)}</p>
                    <p className="text-[11px] text-gray-300 mt-1">{formatTime(appt.end_time)}</p>
                  </div>

                  {/* Client + service */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{appt.client_name || 'לקוח'}</p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{appt.service_name || 'שירות'}</p>
                  </div>

                  {/* Status badge */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sc.bg }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />
                    <span className="text-[11px] font-semibold" style={{ color: sc.text }}>
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

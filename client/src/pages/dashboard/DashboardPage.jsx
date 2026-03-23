import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  CalendarDaysIcon, UsersIcon, CheckCircleIcon,
  ExclamationTriangleIcon, CalendarIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  scheduled: 'מתוזמן',
  confirmed:  'מאושר',
  completed:  'הושלם',
  cancelled:  'בוטל',
  no_show:    'לא הגיע',
}
const STATUS_COLORS = {
  scheduled: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  confirmed:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  completed:  { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' },
  cancelled:  { bg: '#fff1f2', text: '#be123c', dot: '#f43f5e' },
  no_show:    { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(d) {
  const date = new Date(d)
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1)
  if (date >= today && date < tomorrow) return `היום`
  if (date >= tomorrow && date < new Date(tomorrow.getTime()+86400000)) return `מחר`
  return date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)   // appointment detail modal
  const [updating, setUpdating]   = useState(false)

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

  async function updateStatus(apptId, status) {
    setUpdating(true)
    try {
      await api.put(`/api/appointments/${apptId}`, { ...selected, status })
      await fetchStats()
      setSelected(prev => ({ ...prev, status }))
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full border-2 border-primary-100 border-t-primary-500 animate-spin" />
    </div>
  )

  const stats      = data?.stats || {}
  const upcoming   = data?.upcoming_appointments || []

  const secondaryCards = [
    { label: 'תורים מחר', value: stats.tomorrow_count ?? 0, Icon: CalendarDaysIcon,
      bg: '#fdf2f8', iconBg: '#fce7f3', iconColor: '#be185d', valueColor: '#9d174d' },
    { label: 'סה"כ לקוחות', value: stats.total_clients ?? 0, Icon: UsersIcon,
      bg: '#faf5ff', iconBg: '#f3e8ff', iconColor: '#7c3aed', valueColor: '#6d28d9' },
    { label: 'הושלמו החודש', value: stats.month_completed ?? 0, Icon: CheckCircleIcon,
      bg: '#f0fdf4', iconBg: '#dcfce7', iconColor: '#16a34a', valueColor: '#15803d' },
    { label: 'אי הגעות', value: stats.month_no_show ?? 0, Icon: ExclamationTriangleIcon,
      bg: '#fffbeb', iconBg: '#fef3c7', iconColor: '#d97706', valueColor: '#b45309' },
  ]

  return (
    <div className="max-w-5xl">

      {/* Hero banner */}
      <div className="relative rounded-2xl md:rounded-3xl p-5 md:p-7 mb-5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #be185d 0%, #db2777 45%, #f472b6 100%)' }}>
        <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 left-20 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10 mb-4">
          <p className="text-pink-200 text-xs font-medium">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-white text-xl md:text-2xl font-bold mt-0.5">
            שלום, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <div className="relative z-10 flex gap-2.5 flex-wrap">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
            <p className="text-white font-bold text-xl leading-none">{stats.today_count ?? 0}</p>
            <p className="text-pink-100 text-xs mt-1 font-medium">תורים היום</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
            <p className="text-white font-bold text-xl leading-none">
              ₪{Number(stats.month_revenue ?? 0).toLocaleString()}
            </p>
            <p className="text-pink-100 text-xs mt-1 font-medium">הכנסה החודש</p>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {secondaryCards.map(card => (
          <div key={card.label} className="rounded-2xl p-4 border border-white"
            style={{ backgroundColor: card.bg, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: card.iconBg }}>
              <card.Icon className="w-4 h-4" style={{ color: card.iconColor }} />
            </div>
            <p className="text-xl md:text-2xl font-bold leading-none" style={{ color: card.valueColor }}>
              {card.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-1.5 font-medium leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-primary-500" />
            </div>
            <h2 className="font-semibold text-gray-800 text-sm">תורים קרובים</h2>
          </div>
          <span className="text-[11px] font-semibold text-primary-500 bg-primary-50 px-2.5 py-1 rounded-full">
            {upcoming.length} תורים
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2.5">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">אין תורים קרובים</p>
              <p className="text-xs text-gray-300 mt-0.5">נפלא! יש זמן לנוח 🌸</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcoming.map(appt => {
              const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled
              return (
                <div key={appt.id}
                  className="flex items-center gap-3 px-4 md:px-6 py-3 hover:bg-gray-50/80 active:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelected(appt)}>
                  {/* Date/time column */}
                  <div className="w-14 flex-shrink-0 text-right">
                    <p className="text-[11px] font-bold text-primary-500 leading-none">{formatDate(appt.start_time)}</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5 leading-none">{formatTime(appt.start_time)}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{formatTime(appt.end_time)}</p>
                  </div>

                  {/* Service color bar */}
                  <div className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: appt.service_color || '#db2777' }} />

                  {/* Client + service */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-none">
                      {appt.client_name || 'לקוח'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{appt.service_name || 'שירות'}</p>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sc.bg }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                    <span className="text-[10px] font-semibold hidden sm:block" style={{ color: sc.text }}>
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Appointment detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl shadow-2xl">
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (selected.service_color || '#db2777') + '22' }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selected.service_color || '#db2777' }} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{selected.service_name || 'שירות'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(selected.start_time)} · {formatTime(selected.start_time)}–{formatTime(selected.end_time)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Client */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 border border-slate-100">
                <p className="text-xs text-slate-400 font-medium mb-0.5">לקוח</p>
                <p className="font-semibold text-slate-800 text-sm">{selected.client_name || 'לקוח'}</p>
                {selected.client_phone && (
                  <a href={`tel:${selected.client_phone}`}
                    className="text-xs text-primary-600 font-medium mt-0.5 block hover:text-primary-700">
                    {selected.client_phone}
                  </a>
                )}
              </div>

              {/* Status */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-medium mb-2">סטטוס</p>
                <div className="flex gap-2 flex-wrap">
                  {['scheduled','confirmed','completed','no_show','cancelled'].map(s => {
                    const sc = STATUS_COLORS[s]
                    const active = selected.status === s
                    return (
                      <button key={s} disabled={updating}
                        onClick={() => updateStatus(selected.id, s)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full transition border"
                        style={{
                          backgroundColor: active ? sc.bg : 'transparent',
                          color: active ? sc.text : '#94a3b8',
                          borderColor: active ? sc.dot + '60' : '#e2e8f0',
                        }}>
                        {STATUS_LABELS[s]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {selected.notes && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-2.5 mb-4 border border-slate-100">
                  {selected.notes}
                </p>
              )}

              <button
                onClick={() => { setSelected(null); navigate('/appointments') }}
                className="w-full text-center text-sm text-primary-600 font-medium py-2 hover:text-primary-700 transition">
                פתח ביומן ←
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

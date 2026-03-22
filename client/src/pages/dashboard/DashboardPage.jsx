import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABELS = {
  scheduled: 'מתוזמן',
  confirmed: 'מאושר',
  completed: 'הושלם',
  cancelled: 'בוטל',
  no_show: 'לא הגיע',
}

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-yellow-100 text-yellow-700',
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
      const res = await axios.get('http://localhost:3001/api/stats/dashboard')
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-12">טוען...</div>

  const stats = data?.stats || {}
  const todayAppts = data?.today_appointments || []

  const cards = [
    { label: 'תורים היום', value: stats.today_count ?? 0, icon: '📅', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'תורים מחר', value: stats.tomorrow_count ?? 0, icon: '🗓️', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'סה"כ לקוחות', value: stats.total_clients ?? 0, icon: '👥', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'הכנסה החודש', value: `₪${Number(stats.month_revenue ?? 0).toLocaleString()}`, icon: '💰', color: 'text-primary-600', bg: 'bg-primary-50' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          שלום, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl mb-3`}>
              {card.icon}
            </div>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">תורים שהושלמו החודש</p>
          <p className="text-3xl font-bold text-green-600">{stats.month_completed ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">אי הגעות החודש</p>
          <p className="text-3xl font-bold text-yellow-500">{stats.month_no_show ?? 0}</p>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">תורים להיום</h2>
          <span className="text-sm text-gray-400">{todayAppts.length} תורים</span>
        </div>

        {todayAppts.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-3xl mb-2">🎉</p>
            <p>אין תורים להיום</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayAppts.map(appt => (
              <div key={appt.id} className="flex items-center gap-4 px-6 py-4">
                <div
                  className="w-1 h-12 rounded-full flex-shrink-0"
                  style={{ backgroundColor: appt.service_color || '#C2185B' }}
                />
                <div className="w-16 flex-shrink-0 text-center">
                  <p className="font-bold text-gray-800 text-sm">{formatTime(appt.start_time)}</p>
                  <p className="text-xs text-gray-400">{formatTime(appt.end_time)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{appt.client_name || 'לקוח'}</p>
                  <p className="text-sm text-gray-500">{appt.service_name || 'שירות'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[appt.status]}`}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

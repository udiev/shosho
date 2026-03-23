import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  ArrowRightIcon, PencilIcon, CalendarDaysIcon,
  PhoneIcon, EnvelopeIcon, ExclamationTriangleIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  scheduled: 'מתוזמן', confirmed: 'מאושר', completed: 'הושלם',
  cancelled: 'בוטל',   no_show: 'לא הגיע',
}
const STATUS_COLORS = {
  scheduled: { bg: '#eff6ff', text: '#1d4ed8' },
  confirmed:  { bg: '#f0fdf4', text: '#15803d' },
  completed:  { bg: '#f8fafc', text: '#475569' },
  cancelled:  { bg: '#fff1f2', text: '#be123c' },
  no_show:    { bg: '#fffbeb', text: '#b45309' },
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700', 'bg-primary-100 text-primary-700',
]
const avatarColor = name => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

function formatDate(d) {
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchClient() }, [id])

  async function fetchClient() {
    try {
      const res = await api.get(`/api/clients/${id}`)
      setData(res.data)
      const c = res.data.client
      setForm({ name: c.name, phone: c.phone || '', email: c.email || '', notes: c.notes || '' })
    } catch {
      setError('שגיאה בטעינת לקוח')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/api/clients/${id}`, form)
      await fetchClient()
      setShowEdit(false)
    } catch {
      setError('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('למחוק את הלקוח?')) return
    await api.delete(`/api/clients/${id}`)
    navigate('/clients')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  if (error && !data) return (
    <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm border border-red-100">{error}</div>
  )

  const { client, history } = data
  const inputClass = "w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"

  return (
    <div className="max-w-2xl space-y-4">

      {/* Back */}
      <button onClick={() => navigate('/clients')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition font-medium">
        <ArrowRightIcon className="w-4 h-4" />
        חזרה ללקוחות
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${avatarColor(client.name)}`}>
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-800">{client.name}</h1>
                {client.at_risk && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    לא היה זמן
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition">
                    <PhoneIcon className="w-3.5 h-3.5" />{client.phone}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition">
                    <EnvelopeIcon className="w-3.5 h-3.5" />{client.email}
                  </a>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 border border-slate-200 hover:border-primary-300 px-3 py-1.5 rounded-xl transition">
            <PencilIcon className="w-3.5 h-3.5" />
            עריכה
          </button>
        </div>

        {client.notes && (
          <p className="mt-3 text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
            {client.notes}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'ביקורים', value: client.completed_count || 0, color: '#be185d' },
            { label: 'הכנסה', value: `₪${Number(client.total_revenue || 0).toLocaleString()}`, color: '#7c3aed' },
            { label: 'אי הגעה', value: client.no_show_count || 0, color: '#d97706' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Last visit / next appointment */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {client.last_visit && (
            <div className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">ביקור אחרון</p>
              <p className="text-sm font-semibold text-slate-700">{formatDate(client.last_visit)}</p>
            </div>
          )}
          {client.next_appointment ? (
            <div className="bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100">
              <p className="text-[10px] text-emerald-600 font-medium mb-0.5">תור הבא</p>
              <p className="text-sm font-semibold text-emerald-700">
                {formatDate(client.next_appointment)} {formatTime(client.next_appointment)}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">תור הבא</p>
              <p className="text-sm text-slate-400">אין תור קבוע</p>
            </div>
          )}
        </div>

        {/* Action */}
        <button
          onClick={() => navigate('/appointments')}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition text-sm">
          <CalendarDaysIcon className="w-4 h-4" />
          קבע תור חדש
        </button>
      </div>

      {/* Appointment history */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">היסטוריית טיפולים</h2>
          <span className="text-[11px] font-semibold text-primary-500 bg-primary-50 px-2.5 py-1 rounded-full">
            {history.length} תורים
          </span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <CheckCircleIcon className="w-8 h-8 text-slate-200" />
            <p className="text-sm text-slate-400">אין היסטוריית טיפולים</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {history.map(appt => {
              const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled
              const isFuture = new Date(appt.start_time) > new Date()
              return (
                <div key={appt.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: appt.service_color || '#db2777' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {appt.service_name || 'שירות'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(appt.start_time)} · {formatTime(appt.start_time)}
                    </p>
                    {appt.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate italic">{appt.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: sc.bg, color: sc.text }}>
                      {STATUS_LABELS[appt.status]}
                    </span>
                    {appt.price > 0 && (
                      <span className="text-xs font-semibold text-slate-600">₪{Number(appt.price).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-5">עריכת לקוח</h2>
              <form onSubmit={handleSave} className="space-y-3.5">
                {[
                  { name: 'name',  label: 'שם מלא',  type: 'text',  placeholder: 'ישראל ישראלי', required: true },
                  { name: 'phone', label: 'טלפון',   type: 'tel',   placeholder: '050-0000000' },
                  { name: 'email', label: 'אימייל',  type: 'email', placeholder: 'client@email.com' },
                  { name: 'notes', label: 'הערות',   type: 'text',  placeholder: 'הערות על הלקוח...' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                    <input type={f.type} value={form[f.name]} required={f.required}
                      onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      placeholder={f.placeholder} className={inputClass} />
                  </div>
                ))}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 text-sm">
                    {saving ? 'שומר...' : 'שמור'}
                  </button>
                  <button type="button" onClick={() => setShowEdit(false)}
                    className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50 transition text-sm">
                    ביטול
                  </button>
                </div>
                <button type="button" onClick={handleDelete}
                  className="w-full text-red-400 hover:text-red-600 text-sm py-2 transition font-medium">
                  מחיקת לקוח
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

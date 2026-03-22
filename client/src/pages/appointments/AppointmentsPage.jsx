import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../../services/api'
import { PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  scheduled: 'מתוזמן',
  confirmed: 'מאושר',
  completed: 'הושלם',
  cancelled: 'בוטל',
  no_show: 'לא הגיע',
}

const STATUS_COLORS = {
  scheduled: '#3B82F6',
  confirmed: '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
  no_show: '#F59E0B',
}

const isMobile = () => window.innerWidth < 768

export default function AppointmentsPage() {
  const calendarRef = useRef(null)
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [form, setForm] = useState({
    client_id: '', service_id: '', start_time: '', end_time: '', notes: '', status: 'scheduled'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mobile, setMobile] = useState(isMobile())

  useEffect(() => {
    fetchAppointments()
    fetchClients()
    fetchServices()
    const handler = () => setMobile(isMobile())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  async function fetchAppointments() {
    try {
      const res = await api.get('/api/appointments')
      setAppointments(res.data)
    } catch {
      setError('שגיאה בטעינת תורים')
    }
  }

  async function fetchClients() {
    const res = await api.get('/api/clients')
    setClients(res.data)
  }

  async function fetchServices() {
    const res = await api.get('/api/services')
    setServices(res.data.filter(s => s.is_active))
  }

  function openNew(startISO) {
    const start = startISO ? new Date(startISO) : new Date()
    const end = new Date(start.getTime() + 60 * 60000)
    setSelectedAppointment(null)
    setForm({
      client_id: '', service_id: '', notes: '', status: 'scheduled',
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
    })
    setShowForm(true)
  }

  function handleDateClick(info) {
    const start = new Date(info.dateStr + 'T09:00:00')
    openNew(start.toISOString())
  }

  function handleEventClick(info) {
    const appt = appointments.find(a => a.id === info.event.id)
    if (!appt) return
    setSelectedAppointment(appt)
    setForm({
      client_id: appt.client_id || '',
      service_id: appt.service_id || '',
      notes: appt.notes || '',
      status: appt.status,
      start_time: new Date(appt.start_time).toISOString().slice(0, 16),
      end_time: new Date(appt.end_time).toISOString().slice(0, 16),
    })
    setShowForm(true)
  }

  function handleServiceChange(serviceId) {
    const service = services.find(s => s.id === serviceId)
    if (service && form.start_time) {
      const start = new Date(form.start_time)
      const end = new Date(start.getTime() + service.duration_minutes * 60000)
      setForm(f => ({ ...f, service_id: serviceId, end_time: end.toISOString().slice(0, 16) }))
    } else {
      setForm(f => ({ ...f, service_id: serviceId }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        staff_id: null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      }
      if (selectedAppointment) {
        await api.put(`/api/appointments/${selectedAppointment.id}`, payload)
      } else {
        await api.post('/api/appointments', payload)
      }
      await fetchAppointments()
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedAppointment || !confirm('למחוק את התור?')) return
    try {
      await api.delete(`/api/appointments/${selectedAppointment.id}`)
      await fetchAppointments()
      setShowForm(false)
    } catch {
      setError('שגיאה במחיקה')
    }
  }

  const calendarEvents = appointments.map(a => ({
    id: a.id,
    title: `${a.client_name || 'לקוח'} — ${a.service_name || 'שירות'}`,
    start: a.start_time,
    end: a.end_time,
    backgroundColor: a.service_color || STATUS_COLORS[a.status] || '#db2777',
    borderColor: 'transparent',
    textColor: '#fff',
  }))

  const selectClass = "w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">יומן תורים</h1>
        <button
          onClick={() => openNew()}
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span>תור חדש</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 md:p-4 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={mobile ? 'timeGridDay' : 'timeGridWeek'}
          locale="he"
          direction="rtl"
          headerToolbar={mobile
            ? { right: 'prev,next', center: 'title', left: 'today' }
            : { right: 'prev,next today', center: 'title', left: 'dayGridMonth,timeGridWeek,timeGridDay' }
          }
          buttonText={{ today: 'היום', month: 'חודש', week: 'שבוע', day: 'יום' }}
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <CalendarDaysIcon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  {selectedAppointment ? 'עריכת תור' : 'תור חדש'}
                </h2>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">לקוח</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className={selectClass}>
                    <option value="">בחר לקוח</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">שירות</label>
                  <select value={form.service_id} onChange={e => handleServiceChange(e.target.value)} className={selectClass}>
                    <option value="">בחר שירות</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} דק')</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">התחלה</label>
                  <input type="datetime-local" value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className={selectClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">סיום</label>
                  <input type="datetime-local" value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className={selectClass} required />
                </div>
                {selectedAppointment && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">סטטוס</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={selectClass}>
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">הערות</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2} className={selectClass} placeholder="הערות לתור..." />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 text-sm">
                    {saving ? 'שומר...' : 'שמור'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50 transition text-sm">
                    ביטול
                  </button>
                </div>
                {selectedAppointment && (
                  <button type="button" onClick={handleDelete}
                    className="w-full text-red-400 hover:text-red-600 text-sm py-2 transition font-medium">
                    מחיקת תור
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

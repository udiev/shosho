import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import axios from 'axios'

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

  useEffect(() => {
    fetchAppointments()
    fetchClients()
    fetchServices()
  }, [])

  async function fetchAppointments() {
    try {
      const res = await axios.get('http://localhost:3001/api/appointments')
      setAppointments(res.data)
    } catch (err) {
      setError('שגיאה בטעינת תורים')
    }
  }

  async function fetchClients() {
    const res = await axios.get('http://localhost:3001/api/clients')
    setClients(res.data)
  }

  async function fetchServices() {
    const res = await axios.get('http://localhost:3001/api/services')
    setServices(res.data.filter(s => s.is_active))
  }

  function handleDateClick(info) {
    const start = new Date(info.dateStr + 'T09:00:00')
    const end = new Date(info.dateStr + 'T10:00:00')
    setSelectedAppointment(null)
    setForm({
      client_id: '', service_id: '', notes: '', status: 'scheduled',
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
    })
    setShowForm(true)
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
      setForm(f => ({
        ...f,
        service_id: serviceId,
        end_time: end.toISOString().slice(0, 16)
      }))
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
        await axios.put(`http://localhost:3001/api/appointments/${selectedAppointment.id}`, payload)
      } else {
        await axios.post('http://localhost:3001/api/appointments', payload)
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
    if (!selectedAppointment) return
    if (!confirm('למחוק את התור?')) return
    try {
      await axios.delete(`http://localhost:3001/api/appointments/${selectedAppointment.id}`)
      await fetchAppointments()
      setShowForm(false)
    } catch (err) {
      setError('שגיאה במחיקה')
    }
  }

  const calendarEvents = appointments.map(a => ({
    id: a.id,
    title: `${a.client_name || 'לקוח'} — ${a.service_name || 'שירות'}`,
    start: a.start_time,
    end: a.end_time,
    backgroundColor: a.service_color || STATUS_COLORS[a.status] || '#C2185B',
    borderColor: 'transparent',
    textColor: '#fff',
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">יומן תורים</h1>
        <button
          onClick={() => {
            const now = new Date()
            const end = new Date(now.getTime() + 60 * 60000)
            setSelectedAppointment(null)
            setForm({
              client_id: '', service_id: '', notes: '', status: 'scheduled',
              start_time: now.toISOString().slice(0, 16),
              end_time: end.toISOString().slice(0, 16),
            })
            setShowForm(true)
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition text-sm"
        >
          + תור חדש
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="he"
          direction="rtl"
          headerToolbar={{
            right: 'prev,next today',
            center: 'title',
            left: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {selectedAppointment ? 'עריכת תור' : 'תור חדש'}
            </h2>
            {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">לקוח</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">בחר לקוח</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שירות</label>
                <select
                  value={form.service_id}
                  onChange={e => handleServiceChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">בחר שירות</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} דק')</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">התחלה</label>
                <input type="datetime-local" value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיום</label>
                <input type="datetime-local" value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  required />
              </div>
              {selectedAppointment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  <select value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                <textarea value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="הערות לתור..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50">
                  {saving ? 'שומר...' : 'שמור'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl font-medium hover:bg-gray-50 transition">
                  ביטול
                </button>
              </div>
              {selectedAppointment && (
                <button type="button" onClick={handleDelete}
                  className="w-full text-red-400 hover:text-red-600 text-sm py-1 transition">
                  מחיקת תור
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

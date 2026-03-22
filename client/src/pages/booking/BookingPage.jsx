import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'

const API = import.meta.env.VITE_API_URL + '/api'

const STEPS = ['שירות', 'תאריך', 'שעה', 'פרטים', 'אישור']

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getNext14Days() {
  const days = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push({
      str: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })
    })
  }
  return days
}

export default function BookingPage() {
  const { slug } = useParams()
  const [business, setBusiness] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const days = getNext14Days()
  const primaryColor = business?.primary_color || '#C2185B'
  const secondaryColor = business?.secondary_color || '#FCE4EC'

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`${API}/book/${slug}`)
        setBusiness(res.data.business)
        setServices(res.data.services)
      } catch {
        setError('העסק לא נמצא')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  useEffect(() => {
    if (!selectedService || !selectedDate) return
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)
    api.get(`${API}/book/${slug}/slots`, {
      params: { date: selectedDate, service_id: selectedService.id }
    }).then(res => setSlots(res.data))
      .finally(() => setSlotsLoading(false))
  }, [selectedService, selectedDate])

  async function handleSubmit() {
    if (!form.name || !form.phone) return
    setSubmitting(true)
    try {
      await api.post(`${API}/book/${slug}/book`, {
        service_id: selectedService.id,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        client_name: form.name,
        client_phone: form.phone,
        client_email: form.email,
        notes: form.notes,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בקביעת התור')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">טוען...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: secondaryColor }}>
      <div className="bg-white rounded-3xl p-10 text-center max-w-sm w-full shadow-lg">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">התור נקבע!</h2>
        <p className="text-gray-500 mb-6">
          {selectedService.name}<br />
          {new Date(selectedSlot.start).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}<br />
          <strong>{selectedSlot.label}</strong>
        </p>
        <p className="text-sm text-gray-400">נשלח אישור בקרוב</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: secondaryColor }} dir="rtl">

      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <h1 className="text-3xl font-bold mb-1" style={{ color: primaryColor }}>🌸 {business.name}</h1>
        {business.description && <p className="text-gray-500 text-sm mt-1">{business.description}</p>}
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-2 mb-8 px-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: i <= step ? primaryColor : '#e0e0e0',
                color: i <= step ? 'white' : '#999'
              }}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl shadow-sm p-6">

          {/* Step 0 — Service */}
          {step === 0 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-4">איזה שירות תרצי?</h2>
              <div className="space-y-3">
                {services.map(s => (
                  <button key={s.id}
                    onClick={() => { setSelectedService(s); setStep(1) }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-right transition"
                    style={{ borderColor: selectedService?.id === s.id ? primaryColor : '#f0f0f0' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: s.color || primaryColor }} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{s.name}</p>
                      <p className="text-sm text-gray-400">
                        {s.duration_minutes} דקות
                        {s.price ? ` · ₪${s.price}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Date */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-4">באיזה תאריך?</h2>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {days.map(d => (
                  <button key={d.str}
                    onClick={() => setSelectedDate(d.str)}
                    className="py-3 px-2 rounded-xl text-sm font-medium border-2 transition"
                    style={{
                      borderColor: selectedDate === d.str ? primaryColor : '#f0f0f0',
                      backgroundColor: selectedDate === d.str ? primaryColor : 'white',
                      color: selectedDate === d.str ? 'white' : '#333'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl">
                  חזרה
                </button>
                <button onClick={() => setStep(2)}
                  className="flex-1 text-white py-3 rounded-xl font-medium"
                  style={{ backgroundColor: primaryColor }}>
                  המשך
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Time */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-4">באיזו שעה?</h2>
              {slotsLoading ? (
                <p className="text-center text-gray-400 py-8">טוען שעות...</p>
              ) : slots.length === 0 ? (
                <p className="text-center text-gray-400 py-8">אין שעות פנויות בתאריך זה</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {slots.map(slot => (
                    <button key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className="py-3 rounded-xl text-sm font-medium border-2 transition"
                      style={{
                        borderColor: selectedSlot?.start === slot.start ? primaryColor : '#f0f0f0',
                        backgroundColor: selectedSlot?.start === slot.start ? primaryColor : 'white',
                        color: selectedSlot?.start === slot.start ? 'white' : '#333'
                      }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl">
                  חזרה
                </button>
                <button onClick={() => setStep(3)} disabled={!selectedSlot}
                  className="flex-1 text-white py-3 rounded-xl font-medium disabled:opacity-40"
                  style={{ backgroundColor: primaryColor }}>
                  המשך
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Details */}
          {step === 3 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-4">הפרטים שלך</h2>
              <div className="space-y-3 mb-6">
                {[
                  { name: 'name', label: 'שם מלא *', type: 'text', placeholder: 'ישראל ישראלי' },
                  { name: 'phone', label: 'טלפון *', type: 'tel', placeholder: '050-0000000' },
                  { name: 'email', label: 'אימייל', type: 'email', placeholder: 'your@email.com' },
                  { name: 'notes', label: 'הערות', type: 'text', placeholder: 'משהו שחשוב שנדע...' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                    <input type={f.type} value={form[f.name]}
                      onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl">
                  חזרה
                </button>
                <button onClick={() => setStep(4)} disabled={!form.name || !form.phone}
                  className="flex-1 text-white py-3 rounded-xl font-medium disabled:opacity-40"
                  style={{ backgroundColor: primaryColor }}>
                  המשך
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-6">אישור התור</h2>
              <div className="rounded-2xl p-4 mb-6 space-y-3" style={{ backgroundColor: secondaryColor }}>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">שירות</span>
                  <span className="font-medium text-sm">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">תאריך</span>
                  <span className="font-medium text-sm">
                    {new Date(selectedDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">שעה</span>
                  <span className="font-medium text-sm">{selectedSlot.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">משך</span>
                  <span className="font-medium text-sm">{selectedService.duration_minutes} דקות</span>
                </div>
                {selectedService.price && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">מחיר</span>
                    <span className="font-medium text-sm">₪{selectedService.price}</span>
                  </div>
                )}
                <div className="border-t border-white pt-3 flex justify-between">
                  <span className="text-gray-500 text-sm">שם</span>
                  <span className="font-medium text-sm">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">טלפון</span>
                  <span className="font-medium text-sm">{form.phone}</span>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl">
                  חזרה
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}>
                  {submitting ? 'שומר...' : 'קבעי תור!'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

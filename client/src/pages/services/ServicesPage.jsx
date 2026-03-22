import { useState, useEffect } from 'react'
import axios from 'axios'

const COLORS = ['#C2185B', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#FF9800', '#795548']

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState({ name: '', duration_minutes: 60, price: '', color: '#C2185B' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    try {
      const res = await axios.get('http://localhost:3001/api/services')
      setServices(res.data)
    } catch (err) {
      setError('שגיאה בטעינת שירותים')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditingService(null)
    setForm({ name: '', duration_minutes: 60, price: '', color: '#C2185B' })
    setShowForm(true)
  }

  function openEdit(service) {
    setEditingService(service)
    setForm({
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price || '',
      color: service.color || '#C2185B'
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingService) {
        const res = await axios.put(`http://localhost:3001/api/services/${editingService.id}`, form)
        setServices(services.map(s => s.id === editingService.id ? res.data : s))
      } else {
        const res = await axios.post('http://localhost:3001/api/services', form)
        setServices([res.data, ...services])
      }
      setShowForm(false)
    } catch (err) {
      setError('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק את השירות?')) return
    try {
      await axios.delete(`http://localhost:3001/api/services/${id}`)
      setServices(services.filter(s => s.id !== id))
    } catch (err) {
      setError('שגיאה במחיקה')
    }
  }

  async function toggleActive(service) {
    try {
      const res = await axios.put(`http://localhost:3001/api/services/${service.id}`, {
        ...service,
        is_active: service.is_active ? 0 : 1
      })
      setServices(services.map(s => s.id === service.id ? res.data : s))
    } catch (err) {
      setError('שגיאה בעדכון')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">שירותים</h1>
        <button
          onClick={openNew}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition"
        >
          + שירות חדש
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingService ? 'עריכת שירות' : 'שירות חדש'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם השירות</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="עיצוב גבות"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">משך (דקות)</label>
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  min="5"
                  max="480"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (₪)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">צבע</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-full border-4 transition"
                      style={{
                        backgroundColor: c,
                        borderColor: form.color === c ? '#333' : 'transparent'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'שמור'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services list */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">טוען...</div>
      ) : services.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
          <p className="text-4xl mb-3">✂️</p>
          <p>אין שירותים עדיין</p>
          <p className="text-sm mt-1">לחץ על "שירות חדש" כדי להתחיל</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ backgroundColor: service.color || '#C2185B' }} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{service.name}</h3>
                  {!service.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">לא פעיל</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {service.duration_minutes} דקות
                  {service.price ? ` · ₪${service.price}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(service)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition px-2 py-1"
                >
                  {service.is_active ? 'השבת' : 'הפעל'}
                </button>
                <button
                  onClick={() => openEdit(service)}
                  className="text-sm text-primary-600 hover:text-primary-700 transition px-2 py-1"
                >
                  עריכה
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-sm text-red-400 hover:text-red-600 transition px-2 py-1"
                >
                  מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

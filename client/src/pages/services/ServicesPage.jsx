import { useState, useEffect } from 'react'
import api from '../../services/api'
import { PlusIcon, ScissorsIcon } from '@heroicons/react/24/outline'

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
      const res = await api.get('/api/services')
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
        const res = await api.put(`/api/services/${editingService.id}`, form)
        setServices(services.map(s => s.id === editingService.id ? res.data : s))
      } else {
        const res = await api.post('/api/services', form)
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
      await api.delete(`/api/services/${id}`)
      setServices(services.filter(s => s.id !== id))
    } catch (err) {
      setError('שגיאה במחיקה')
    }
  }

  async function toggleActive(service) {
    try {
      const res = await api.put(`/api/services/${service.id}`, {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">שירותים</h1>
          {!loading && <p className="text-sm text-slate-400 mt-0.5">{services.length} שירותים</p>}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          שירות חדש
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editingService ? 'עריכת שירות' : 'שירות חדש'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">שם השירות</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"
                  placeholder="עיצוב גבות"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">משך (דקות)</label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"
                    min="5"
                    max="480"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">מחיר (₪)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">צבע</label>
                <div className="flex gap-2.5 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        outline: form.color === c ? `3px solid ${c}` : 'none',
                        outlineOffset: '2px',
                        opacity: form.color === c ? 1 : 0.65,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 text-sm"
                >
                  {saving ? 'שומר...' : 'שמור'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition text-sm"
                >
                  ביטול
                </button>
              </div>
              {editingService && (
                <button
                  type="button"
                  onClick={() => { handleDelete(editingService.id); setShowForm(false) }}
                  className="w-full text-red-400 hover:text-red-600 text-sm py-1 transition"
                >
                  מחיקת שירות
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Services list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScissorsIcon className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">אין שירותים עדיין</p>
          <p className="text-sm text-slate-400 mt-1">לחץ על "שירות חדש" כדי להתחיל</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {services.map(service => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              {/* Color swatch */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 shadow-sm"
                style={{ backgroundColor: service.color || '#C2185B' }}
              />

              {/* Service info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{service.name}</h3>
                  {!service.is_active && (
                    <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                      לא פעיל
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">{service.duration_minutes} דקות</span>
                  {service.price ? (
                    <span className="text-xs text-slate-400">₪{service.price}</span>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(service)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  {service.is_active ? 'השבת' : 'הפעל'}
                </button>
                <button
                  onClick={() => openEdit(service)}
                  className="text-xs text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition font-medium"
                >
                  עריכה
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-xs text-slate-300 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium"
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

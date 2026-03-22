import { useState, useEffect } from 'react'
import axios from 'axios'

const THEMES = [
  { name: 'ורוד', primary: '#C2185B', secondary: '#F8BBD0' },
  { name: 'סגול', primary: '#7B1FA2', secondary: '#E1BEE7' },
  { name: 'כחול', primary: '#1565C0', secondary: '#BBDEFB' },
  { name: 'ירוק', primary: '#2E7D32', secondary: '#C8E6C9' },
  { name: 'כתום', primary: '#E65100', secondary: '#FFE0B2' },
  { name: 'טורקיז', primary: '#00695C', secondary: '#B2DFDB' },
]

export default function SettingsPage() {
  const [business, setBusiness] = useState(null)
  const [form, setForm] = useState({
    name: '', phone: '', address: '', description: '',
    primary_color: '#C2185B', secondary_color: '#F8BBD0'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchBusiness() }, [])

  async function fetchBusiness() {
    try {
      const res = await axios.get('http://localhost:3001/api/business')
      setBusiness(res.data)
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        description: res.data.description || '',
        primary_color: res.data.primary_color || '#C2185B',
        secondary_color: res.data.secondary_color || '#F8BBD0',
      })
    } catch (err) {
      setError('שגיאה בטעינת פרטי העסק')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await axios.put('http://localhost:3001/api/business', form)
      setBusiness(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-12">טוען...</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">הגדרות עסק</h1>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
      {saved && <div className="bg-green-50 text-green-600 rounded-lg px-4 py-3 mb-4 text-sm">✅ הפרטים נשמרו בהצלחה</div>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Business details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-700 mb-4">פרטי העסק</h2>
          <div className="space-y-4">
            {[
              { name: 'name', label: 'שם העסק', type: 'text', placeholder: 'סטודיו שחר' },
              { name: 'phone', label: 'טלפון', type: 'tel', placeholder: '050-0000000' },
              { name: 'address', label: 'כתובת', type: 'text', placeholder: 'רחוב הרצל 1, תל אביב' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.name]}
                  onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור העסק</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="ספרי קצת על העסק שלך..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-700 mb-4">מיתוג וצבעים</h2>

          {/* Theme presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">תבניות מוכנות</label>
            <div className="flex gap-3 flex-wrap">
              {THEMES.map(theme => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setForm({ ...form, primary_color: theme.primary, secondary_color: theme.secondary })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition text-sm"
                  style={{
                    borderColor: form.primary_color === theme.primary ? theme.primary : 'transparent',
                    backgroundColor: theme.secondary,
                  }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <span style={{ color: theme.primary }}>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">צבע ראשי</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm({ ...form, primary_color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{form.primary_color}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">צבע משני</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.secondary_color}
                  onChange={e => setForm({ ...form, secondary_color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{form.secondary_color}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 rounded-xl p-4 text-center" style={{ backgroundColor: form.secondary_color }}>
            <p className="font-bold text-lg" style={{ color: form.primary_color }}>🌸 {form.name || 'שם העסק'}</p>
            <p className="text-sm mt-1" style={{ color: form.primary_color + 'aa' }}>תצוגה מקדימה</p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: form.primary_color }}
            >
              קביעת תור
            </button>
          </div>
        </div>

        {/* Booking page link */}
        {business?.slug && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-700 mb-2">קישור לקביעת תור</h2>
            <p className="text-sm text-gray-500 mb-3">שתף את הקישור הזה עם לקוחות כדי שיוכלו לקבוע תור בעצמם</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600 flex-1 truncate">
                shosho.app/book/{business.slug}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`shosho.app/book/${business.slug}`)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex-shrink-0"
              >
                העתק
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50"
        >
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  )
}

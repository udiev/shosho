import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { MagnifyingGlassIcon, PlusIcon, ArrowUpTrayIcon, UsersIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchClients() }, [search])

  async function fetchClients() {
    try {
      const res = await api.get(`/api/clients?search=${search}`)
      setClients(res.data)
    } catch {
      setError('שגיאה בטעינת לקוחות')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditingClient(null)
    setForm({ name: '', phone: '', email: '', notes: '' })
    setShowForm(true)
  }

  function openEdit(client) {
    setEditingClient(client)
    setForm({ name: client.name, phone: client.phone || '', email: client.email || '', notes: client.notes || '' })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingClient) {
        const res = await api.put(`/api/clients/${editingClient.id}`, form)
        setClients(clients.map(c => c.id === editingClient.id ? res.data : c))
      } else {
        const res = await api.post('/api/clients', form)
        setClients([res.data, ...clients])
      }
      setShowForm(false)
    } catch {
      setError('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק את הלקוח?')) return
    try {
      await api.delete(`/api/clients/${id}`)
      setClients(clients.filter(c => c.id !== id))
      setShowForm(false)
    } catch {
      setError('שגיאה במחיקה')
    }
  }

  function handleCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const lines = ev.target.result.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const nameIdx = headers.findIndex(h => h.includes('שם') || h.includes('name'))
      const phoneIdx = headers.findIndex(h => h.includes('טלפון') || h.includes('phone'))
      const emailIdx = headers.findIndex(h => h.includes('מייל') || h.includes('email'))
      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim())
        const name = nameIdx >= 0 ? cols[nameIdx] : cols[0]
        if (!name) continue
        try {
          const res = await api.post('/api/clients', {
            name,
            phone: phoneIdx >= 0 ? cols[phoneIdx] : '',
            email: emailIdx >= 0 ? cols[emailIdx] : '',
          })
          setClients(prev => [res.data, ...prev])
          imported++
        } catch {}
      }
      alert(`יובאו ${imported} לקוחות`)
    }
    reader.readAsText(file)
  }

  const avatarColors = [
    'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-primary-100 text-primary-700',
  ]
  const avatarColor = name => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

  const inputClass = "w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">לקוחות</h1>
          {!loading && <p className="text-xs text-slate-400 mt-0.5">{clients.length} לקוחות</p>}
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-medium hover:bg-slate-50 transition cursor-pointer text-sm">
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">ייבוא CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          </label>
          <button onClick={openNew}
            className="flex items-center gap-1.5 bg-primary-600 text-white px-3 py-2 rounded-xl font-medium hover:bg-primary-700 transition text-sm">
            <PlusIcon className="w-4 h-4" />
            <span>לקוח חדש</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>}

      {/* Search */}
      <div className="mb-4 relative">
        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 end-4 pointer-events-none" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או אימייל..."
          className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 pe-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition"
        />
      </div>

      {/* Bottom-sheet modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-5">
                {editingClient ? 'עריכת לקוח' : 'לקוח חדש'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {[
                  { name: 'name', label: 'שם מלא', type: 'text', placeholder: 'ישראל ישראלי', required: true },
                  { name: 'phone', label: 'טלפון', type: 'tel', placeholder: '050-0000000' },
                  { name: 'email', label: 'אימייל', type: 'email', placeholder: 'client@email.com' },
                  { name: 'notes', label: 'הערות', type: 'text', placeholder: 'הערות על הלקוח...' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                    <input type={field.type} value={form[field.name]}
                      onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                      placeholder={field.placeholder} required={field.required}
                      className={inputClass} />
                  </div>
                ))}
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
                {editingClient && (
                  <button type="button" onClick={() => handleDelete(editingClient.id)}
                    className="w-full text-red-400 hover:text-red-600 text-sm py-2 transition font-medium">
                    מחיקת לקוח
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-sm">{search ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}</p>
          {!search && <p className="text-xs text-slate-400 mt-1">לחץ על "לקוח חדש" או ייבא מ-CSV</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {clients.map(client => (
              <div key={client.id}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors active:bg-slate-100 cursor-pointer"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${avatarColor(client.name)}`}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{client.name}</p>
                    {client.at_risk && (
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="לא היה זמן" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {[client.phone, client.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0 bg-slate-50 px-2 py-1 rounded-full font-medium">
                  {client.visit_count} ביקורים
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-slate-50 text-xs text-slate-400 border-t border-slate-100 font-medium">
            {clients.length} לקוחות
          </div>
        </div>
      )}
    </div>
  )
}

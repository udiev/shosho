import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ClientsPage() {
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
      const res = await axios.get(`http://localhost:3001/api/clients?search=${search}`)
      setClients(res.data)
    } catch (err) {
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
        const res = await axios.put(`http://localhost:3001/api/clients/${editingClient.id}`, form)
        setClients(clients.map(c => c.id === editingClient.id ? res.data : c))
      } else {
        const res = await axios.post('http://localhost:3001/api/clients', form)
        setClients([res.data, ...clients])
      }
      setShowForm(false)
    } catch (err) {
      setError('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק את הלקוח?')) return
    try {
      await axios.delete(`http://localhost:3001/api/clients/${id}`)
      setClients(clients.filter(c => c.id !== id))
    } catch (err) {
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
          const res = await axios.post('http://localhost:3001/api/clients', {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">לקוחות</h1>
        <div className="flex gap-2">
          <label className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 transition cursor-pointer text-sm">
            ייבוא CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          </label>
          <button
            onClick={openNew}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition text-sm"
          >
            + לקוח חדש
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או אימייל..."
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingClient ? 'עריכת לקוח' : 'לקוח חדש'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'name', label: 'שם מלא', type: 'text', placeholder: 'ישראל ישראלי', required: true },
                { name: 'phone', label: 'טלפון', type: 'tel', placeholder: '050-0000000' },
                { name: 'email', label: 'אימייל', type: 'email', placeholder: 'client@email.com' },
                { name: 'notes', label: 'הערות', type: 'text', placeholder: 'הערות על הלקוח...' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.name]}
                    onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              ))}
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
            </form>
          </div>
        </div>
      )}

      {/* Clients list */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">טוען...</div>
      ) : clients.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
          <p className="text-4xl mb-3">👥</p>
          <p>{search ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}</p>
          {!search && <p className="text-sm mt-1">לחץ על "לקוח חדש" או ייבא מ-CSV</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {clients.map(client => (
              <div key={client.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg flex-shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{client.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {[client.phone, client.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="text-sm text-gray-400 flex-shrink-0">
                  {client.visit_count} ביקורים
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(client)}
                    className="text-sm text-primary-600 hover:text-primary-700 px-2 py-1 transition">
                    עריכה
                  </button>
                  <button onClick={() => handleDelete(client.id)}
                    className="text-sm text-red-400 hover:text-red-600 px-2 py-1 transition">
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-400 border-t border-gray-100">
            {clients.length} לקוחות
          </div>
        </div>
      )}
    </div>
  )
}

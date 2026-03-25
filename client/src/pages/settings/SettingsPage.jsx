import { useState, useEffect } from 'react'
import api from '../../services/api'
import { LinkIcon, CheckIcon, PlusIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { PhotoIcon } from '@heroicons/react/24/outline'

const THEMES = [
  { name: 'ורוד', primary: '#C2185B', secondary: '#F8BBD0' },
  { name: 'סגול', primary: '#7B1FA2', secondary: '#E1BEE7' },
  { name: 'כחול', primary: '#1565C0', secondary: '#BBDEFB' },
  { name: 'ירוק', primary: '#2E7D32', secondary: '#C8E6C9' },
  { name: 'כתום', primary: '#E65100', secondary: '#FFE0B2' },
  { name: 'טורקיז', primary: '#00695C', secondary: '#B2DFDB' },
]

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const DEFAULT_HOURS = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  is_open: i < 5,
  open_time: '09:00',
  close_time: i === 5 ? '14:00' : '20:00',
}))

export default function SettingsPage() {
  const { user, business: bizCtx, updateBusiness: updateBizCtx } = useAuth()
  const isOwner = user?.role === 'owner'

  const [business, setBusiness] = useState(null)
  const [form, setForm] = useState({
    name: '', phone: '', address: '', description: '',
    primary_color: '#C2185B', secondary_color: '#F8BBD0',
    reminders_enabled: true, logo_url: '',
  })
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingHours, setSavingHours] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedHours, setSavedHours] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Team members
  const [team, setTeam] = useState([])
  const [teamForm, setTeamForm] = useState({ name: '', email: '' })
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)
  const [teamError, setTeamError] = useState('')
  const [teamSuccess, setTeamSuccess] = useState('')

  useEffect(() => {
    Promise.all([fetchBusiness(), fetchHours()]).finally(() => setLoading(false))
    if (isOwner) fetchTeam() // non-blocking — doesn't delay form rendering
  }, [])

  async function fetchBusiness() {
    try {
      const res = await api.get('/api/business')
      setBusiness(res.data)
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        description: res.data.description || '',
        primary_color: res.data.primary_color || '#C2185B',
        secondary_color: res.data.secondary_color || '#F8BBD0',
        reminders_enabled: res.data.reminders_enabled !== false,
        logo_url: res.data.logo_url || '',
      })
    } catch {
      setError('שגיאה בטעינת פרטי העסק')
    }
  }

  async function fetchHours() {
    try {
      const res = await api.get('/api/business/hours')
      setHours(res.data)
    } catch {
      // keep defaults
    }
  }

  async function fetchTeam() {
    try {
      const res = await api.get('/api/team')
      setTeam(res.data)
    } catch {}
  }

  async function handleAddTeamMember(e) {
    e.preventDefault()
    setSavingTeam(true)
    setTeamError('')
    setTeamSuccess('')
    try {
      const res = await api.post('/api/team', teamForm)
      setTeam(prev => [...prev, res.data])
      setTeamForm({ name: '', email: '' })
      setShowTeamForm(false)
      setTeamSuccess(`הזמנה נשלחה ל-${teamForm.email}`)
      setTimeout(() => setTeamSuccess(''), 5000)
    } catch (err) {
      setTeamError(err.response?.data?.error || 'שגיאה בהוספת חבר צוות')
    } finally {
      setSavingTeam(false)
    }
  }

  async function handleRemoveTeamMember(id, name) {
    if (!confirm(`להסיר את ${name} מהצוות?`)) return
    try {
      await api.delete(`/api/team/${id}`)
      setTeam(prev => prev.filter(m => m.id !== id))
    } catch {
      setTeamError('שגיאה בהסרת חבר צוות')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.put('/api/business', form)
      setBusiness(res.data)
      updateBizCtx(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveHours() {
    setSavingHours(true)
    try {
      await api.put('/api/business/hours', hours)
      setSavedHours(true)
      setTimeout(() => setSavedHours(false), 3000)
    } catch {
      setError('שגיאה בשמירת שעות')
    } finally {
      setSavingHours(false)
    }
  }

  function updateHour(dayIndex, field, value) {
    setHours(prev => prev.map((h, i) => i === dayIndex ? { ...h, [field]: value } : h))
  }

  function copyLink() {
    navigator.clipboard.writeText(`shosho.app/book/${business.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  const inputClass = "w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"
  const timeClass = "border border-slate-200 bg-slate-50 rounded-lg px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition w-24"

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">הגדרות עסק</h1>
        <p className="text-sm text-slate-400 mt-1">נהל את פרטי העסק והמיתוג שלך</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm border border-red-100">{error}</div>
      )}
      {saved && (
        <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 mb-5 text-sm border border-emerald-100 flex items-center gap-2">
          <CheckIcon className="w-4 h-4" />הפרטים נשמרו בהצלחה
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 text-sm">פרטי העסק</h2>
          </div>
          <div className="p-6 space-y-4">

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">לוגו העסק</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="לוגו" className="w-full h-full object-contain p-1" />
                    : <PhotoIcon className="w-6 h-6 text-slate-300" />
                  }
                </div>
                <div className="flex-1 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700 transition w-fit">
                    <PhotoIcon className="w-4 h-4" />
                    {form.logo_url ? 'החלף לוגו' : 'העלה לוגו'}
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files[0]
                        if (!file) return
                        if (file.size > 512 * 1024) { setError('הלוגו חייב להיות קטן מ-512KB'); return }
                        const reader = new FileReader()
                        reader.onload = ev => setForm(f => ({ ...f, logo_url: ev.target.result }))
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                  {form.logo_url && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, logo_url: '' }))}
                      className="text-xs text-slate-400 hover:text-red-400 transition">
                      הסר לוגו
                    </button>
                  )}
                  <p className="text-xs text-slate-400">PNG, JPG או SVG, עד 512KB</p>
                </div>
              </div>
            </div>

            {[
              { name: 'name', label: 'שם העסק', type: 'text', placeholder: 'סטודיו שחר' },
              { name: 'phone', label: 'טלפון', type: 'tel', placeholder: '050-0000000' },
              { name: 'address', label: 'כתובת', type: 'text', placeholder: 'רחוב הרצל 1, תל אביב' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.name]}
                  onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">תיאור העסק</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="ספרי קצת על העסק שלך..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 text-sm">מיתוג וצבעים</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2.5">תבניות מוכנות</label>
              <div className="flex gap-2.5 flex-wrap">
                {THEMES.map(theme => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => setForm({ ...form, primary_color: theme.primary, secondary_color: theme.secondary })}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium"
                    style={{
                      borderColor: form.primary_color === theme.primary ? theme.primary : 'transparent',
                      backgroundColor: theme.secondary + '33',
                    }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: theme.primary }} />
                    <span style={{ color: theme.primary }}>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">צבע ראשי</label>
                <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5">
                  <input type="color" value={form.primary_color}
                    onChange={e => setForm({ ...form, primary_color: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent" />
                  <span className="text-sm text-slate-500 font-mono">{form.primary_color}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">צבע משני</label>
                <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5">
                  <input type="color" value={form.secondary_color}
                    onChange={e => setForm({ ...form, secondary_color: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent" />
                  <span className="text-sm text-slate-500 font-mono">{form.secondary_color}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 text-center border" style={{ backgroundColor: form.secondary_color + '40', borderColor: form.secondary_color + '80' }}>
              <p className="font-bold text-base mb-1" style={{ color: form.primary_color }}>{form.name || 'שם העסק'}</p>
              <p className="text-xs mb-3" style={{ color: form.primary_color + 'aa' }}>תצוגה מקדימה של עמוד ההזמנה</p>
              <button type="button" className="px-5 py-2 rounded-xl text-sm font-medium text-white shadow-sm" style={{ backgroundColor: form.primary_color }}>
                קביעת תור
              </button>
            </div>
          </div>
        </div>

        {/* Booking link */}
        {business?.slug && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700 text-sm">קישור לקביעת תור</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-3">שתף את הקישור הזה עם לקוחות כדי שיוכלו לקבוע תור בעצמם</p>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-600 flex-1 truncate font-mono">shosho.app/book/{business.slug}</span>
                <button type="button" onClick={copyLink}
                  className="text-sm font-medium flex-shrink-0 transition-colors"
                  style={{ color: copied ? '#2E7D32' : form.primary_color }}>
                  {copied ? 'הועתק!' : 'העתק'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminders */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 text-sm">תזכורות ללקוחות</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">שלח תזכורת SMS/WhatsApp</p>
                <p className="text-xs text-slate-400 mt-0.5">24 שעות לפני כל תור — אוטומטי</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, reminders_enabled: !f.reminders_enabled }))}
                className="relative flex-shrink-0 rounded-full transition-colors"
                style={{ width: 44, height: 24, backgroundColor: form.reminders_enabled ? '#db2777' : '#e2e8f0' }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                  style={{ width: 20, height: 20, right: form.reminders_enabled ? 2 : 22 }}
                />
              </button>
            </div>
            {form.reminders_enabled && (
              <div className="mt-4 bg-primary-50 rounded-xl px-4 py-3 text-xs text-primary-700 leading-relaxed">
                <strong>להפעלה:</strong> הגדר את משתני הסביבה בשרת:<br />
                <code className="font-mono">TWILIO_ACCOUNT_SID</code>, <code className="font-mono">TWILIO_AUTH_TOKEN</code>, <code className="font-mono">TWILIO_FROM</code><br />
                לWhatsApp: הגדר <code className="font-mono">TWILIO_FROM=whatsapp:+14155238886</code>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 text-sm">
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </form>

      {/* Business hours — separate section, separate save */}
      <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">שעות פעילות</h2>
          {savedHours && (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckIcon className="w-3.5 h-3.5" />נשמר
            </span>
          )}
        </div>
        <div className="p-4 space-y-1">
          {hours.map((h, i) => (
            <div key={i} className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors ${h.is_open ? '' : 'opacity-50'}`}>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => updateHour(i, 'is_open', !h.is_open)}
                className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${h.is_open ? 'bg-primary-500' : 'bg-slate-200'}`}
                style={{ width: 40, height: 22 }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                  style={{ width: 18, height: 18, right: h.is_open ? 2 : 20 }}
                />
              </button>

              {/* Day name */}
              <span className="text-sm font-medium text-slate-700 w-12 flex-shrink-0">{DAY_NAMES[i]}</span>

              {h.is_open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={h.open_time}
                    onChange={e => updateHour(i, 'open_time', e.target.value)}
                    className={timeClass} />
                  <span className="text-slate-400 text-xs">עד</span>
                  <input type="time" value={h.close_time}
                    onChange={e => updateHour(i, 'close_time', e.target.value)}
                    className={timeClass} />
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">סגור</span>
              )}
            </div>
          ))}
        </div>
        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={handleSaveHours}
            disabled={savingHours}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 text-sm"
          >
            {savingHours ? 'שומר...' : 'שמור שעות פעילות'}
          </button>
        </div>
      </div>

      {/* Team members — owner only */}
      {isOwner && (
        <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-700 text-sm">חברי צוות</h2>
            </div>
            <button
              onClick={() => { setShowTeamForm(f => !f); setTeamError('') }}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              הוסף
            </button>
          </div>

          {(teamError || teamSuccess) && (
            <div className={`mx-6 mt-4 rounded-xl px-4 py-2.5 text-sm border ${teamError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
              {teamError || teamSuccess}
            </div>
          )}

          {showTeamForm && (
            <form onSubmit={handleAddTeamMember} className="px-6 pt-4 pb-2 border-b border-slate-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">שם מלא</label>
                  <input
                    type="text" required value={teamForm.name}
                    onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="ישראל ישראלי"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">אימייל</label>
                  <input
                    type="email" required value={teamForm.email}
                    onChange={e => setTeamForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="staff@email.com"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-2 pb-2">
                <button type="submit" disabled={savingTeam}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50">
                  {savingTeam ? 'שולח הזמנה...' : 'שלח הזמנה'}
                </button>
                <button type="button" onClick={() => setShowTeamForm(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                  ביטול
                </button>
              </div>
            </form>
          )}

          {team.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center">
              <UsersIcon className="w-8 h-8 text-slate-200" />
              <p className="text-sm text-slate-400">אין חברי צוות עדיין</p>
              <p className="text-xs text-slate-300">הזמן פקידה או שותף לעבוד על המערכת</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {team.map(member => (
                <div key={member.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center font-bold text-primary-600 text-sm flex-shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveTeamMember(member.id, member.name)}
                    className="text-slate-300 hover:text-red-400 transition p-1"
                    title="הסר מהצוות"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="px-6 py-3 text-xs text-slate-400 border-t border-slate-50">
            חברי הצוות רואים ומנהלים את הנתונים של העסק שלך. לא ניתן להם גישה להגדרות או ניהול צוות.
          </p>
        </div>
      )}
    </div>
  )
}

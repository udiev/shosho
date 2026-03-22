import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ businessName: '', name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.businessName, form.name, form.email, form.password, form.phone)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהרשמה')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">ש</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">יצירת חשבון</h1>
          <p className="text-slate-400 mt-1 text-sm">התחל לנהל את התורים שלך בחינם</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'businessName', label: 'שם העסק', type: 'text', placeholder: 'סטודיו שחר' },
              { name: 'name', label: 'שם מלא', type: 'text', placeholder: 'שחר אבן-עזרא' },
              { name: 'email', label: 'אימייל', type: 'email', placeholder: 'you@example.com' },
              { name: 'phone', label: 'טלפון', type: 'tel', placeholder: '050-0000000' },
              { name: 'password', label: 'סיסמה', type: 'password', placeholder: '••••••••' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={inputClass}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'יוצר חשבון...' : 'צור חשבון'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            כבר יש לך חשבון?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 transition">
              התחבר
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('שגיאה בשליחת המייל, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">ש</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">שכחת סיסמה?</h1>
          <p className="text-slate-400 mt-1 text-sm">נשלח לך קישור לאיפוס במייל</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-800 mb-2">בדוק את האימייל שלך</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                שלחנו קישור לאיפוס הסיסמה לכתובת <strong className="text-slate-600">{email}</strong>.
                הקישור בתוקף לשעה אחת.
              </p>
              <Link to="/login" className="inline-block mt-6 text-sm text-primary-600 font-medium hover:text-primary-700 transition">
                חזרה להתחברות
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm border border-red-100">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">כתובת אימייל</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
                </button>
              </form>
              <p className="text-center text-sm text-slate-400 mt-6">
                <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 transition">
                  חזרה להתחברות
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

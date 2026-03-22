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

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary-600 mb-2 text-center">🌸 שושו</h1>
        <p className="text-gray-500 text-center mb-8">יצירת חשבון חדש</p>

        {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'businessName', label: 'שם העסק', type: 'text', placeholder: 'סטודיו שחר' },
            { name: 'name', label: 'שם מלא', type: 'text', placeholder: 'שחר אבן-עזרא' },
            { name: 'email', label: 'אימייל', type: 'email', placeholder: 'you@example.com' },
            { name: 'phone', label: 'טלפון', type: 'tel', placeholder: '050-0000000' },
            { name: 'password', label: 'סיסמה', type: 'password', placeholder: '••••••••' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'נרשם...' : 'צור חשבון'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          כבר יש לך חשבון?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">התחבר</Link>
        </p>
      </div>
    </div>
  )
}

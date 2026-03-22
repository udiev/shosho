import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-primary-600 mb-4">🌸 שושו</h1>
      <p className="text-xl text-gray-500 mb-8">פלטפורמת ניהול תורים לעסקים קטנים</p>
      <button
        onClick={() => navigate('/register')}
        className="bg-primary-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-primary-700 transition"
      >
        התחל עכשיו
      </button>
    </div>
  )
}

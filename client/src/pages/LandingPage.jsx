import { useNavigate } from 'react-router-dom'

const features = [
  { icon: '📅', title: 'יומן חכם', desc: 'נהל את כל התורים שלך במקום אחד. תצוגת יום, שבוע וחודש.' },
  { icon: '💬', title: 'תזכורות אוטומטיות', desc: 'וואטסאפ, SMS ואימייל — הלקוחות מקבלים תזכורת יום לפני.' },
  { icon: '👥', title: 'ניהול לקוחות', desc: 'רשימת לקוחות מלאה עם היסטוריה, הערות וייבוא מ-Excel.' },
  { icon: '📊', title: 'סטטיסטיקות', desc: 'הכנסות, תורים שהושלמו, אי-הגעות — הכל במקום אחד.' },
  { icon: '🎨', title: 'מיתוג אישי', desc: 'צבעים, לוגו ותבניות — האפליקציה נראית כמו שלך.' },
  { icon: '🔗', title: 'קביעה עצמאית', desc: 'קישור ייחודי ללקוחות לקביעת תור בלי להתקשר.' },
]

const steps = [
  { num: '01', title: 'הגדר את העסק', desc: 'צור חשבון, הוסף את השירותים שלך ושעות הפעילות.' },
  { num: '02', title: 'שתף את הקישור', desc: 'לקוחות מקבלים קישור ייחודי לקביעת תור בעצמם.' },
  { num: '03', title: 'נהל הכל', desc: 'תורים, לקוחות, תזכורות וסטטיסטיקות — הכל במסך אחד.' },
]

const testimonials = [
  {
    name: 'שחר אבן-עזרא',
    business: 'סטודיו לעיצוב גבות',
    text: 'לפני שושו הייתי מנהלת הכל בוואטסאפ. עכשיו הלקוחות קובעות לבד והתזכורות יוצאות אוטומטית. חסכתי שעה כל יום.',
    avatar: 'ש',
    bg: '#C2185B',
  },
  {
    name: 'מיכל כהן',
    business: "סטודיו ליק ג'ל ומניקור",
    text: 'הכי אהבתי שאפשר לעצב את האפליקציה בצבעים שלי. הלקוחות שלי אומרות שזה נראה מקצועי ומהודר.',
    avatar: 'מ',
    bg: '#7B1FA2',
  },
  {
    name: 'רונית לוי',
    business: 'מספרה ועיצוב שיער',
    text: 'הסטטיסטיקות עזרו לי להבין אילו שעות הכי עמוסות. עכשיו אני מתמחרת נכון.',
    avatar: 'ר',
    bg: '#1565C0',
  },
]

const faqs = [
  { q: 'האם שושו בחינם?', a: 'יש תקופת ניסיון חינמית. לאחר מכן תוכנית בסיסית במחיר נגיש לעסקים קטנים.' },
  { q: 'איך הלקוחות קובעים תור?', a: 'כל עסק מקבל קישור ייחודי. הלקוחות בוחרים שירות ושעה — בלי אפליקציה ובלי הרשמה.' },
  { q: 'האם התזכורות עובדות בוואטסאפ?', a: 'כן. שושו שולחת תזכורות אוטומטיות דרך וואטסאפ, SMS ואימייל — יום לפני התור.' },
  { q: 'האם אפשר לנהל כמה עובדים?', a: 'כן. אפשר להוסיף עובדים או מזכירה עם גישה ליומן ולניהול תורים.' },
  { q: 'האם הנתונים שלי מאובטחים?', a: 'הנתונים מאוחסנים בענן Microsoft Azure עם הצפנה מלאה ואימות דו-שלבי.' },
]

const PINK = '#C2185B'
const PINK_LIGHT = '#FCE4EC'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white font-sans" dir="rtl">

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #f0f0f0' }} className="fixed top-0 right-0 left-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold" style={{ color: PINK }}>🌸 שושו</div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-gray-800">
              התחברות
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-white text-sm font-medium px-5 py-2 rounded-xl"
              style={{ backgroundColor: PINK }}
            >
              התחל בחינם
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6" style={{ background: `linear-gradient(to bottom, ${PINK_LIGHT}, white)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block text-sm font-medium px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: PINK_LIGHT, color: PINK }}>
            🌸 פלטפורמת ניהול תורים לעסקים קטנים
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.2' }}>
            נהל את התורים שלך<br />
            <span style={{ color: PINK }}>בלי לאבד את השפיות</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto" style={{ lineHeight: '1.7' }}>
            שושו היא מערכת ניהול תורים לקוסמטיקאיות, ספרים ובעלי עסקי שירות.
            תורים, תזכורות, לקוחות וסטטיסטיקות — הכל במקום אחד.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="text-white px-8 py-4 rounded-2xl text-lg font-semibold"
              style={{ backgroundColor: PINK }}
            >
              התחל בחינם ←
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="border text-gray-600 px-8 py-4 rounded-2xl text-lg font-medium hover:bg-gray-50"
              style={{ borderColor: '#e0e0e0' }}
            >
              איך זה עובד?
            </button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400 flex-wrap">
            <span>⭐⭐⭐⭐⭐ מדורג 5/5</span>
            <span>·</span>
            <span>+50 עסקים פעילים</span>
            <span>·</span>
            <span>ללא כרטיס אשראי</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">איך זה עובד?</h2>
            <p className="text-gray-500 text-lg">שלושה צעדים פשוטים להתחיל</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map(step => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                  style={{ backgroundColor: PINK_LIGHT, color: PINK }}>
                  {step.num}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">כל מה שצריך לנהל עסק</h2>
            <p className="text-gray-500 text-lg">מיומן תורים ועד סטטיסטיקות — הכל כלול</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#f0f0f0' }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">מה אומרות בעלות העסקים?</h2>
            <p className="text-gray-500 text-lg">עסקים אמיתיים, תוצאות אמיתיות</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="rounded-2xl p-6 border" style={{ backgroundColor: '#fafafa', borderColor: '#f0f0f0' }}>
                <p className="text-gray-600 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: t.bg }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">שאלות נפוצות</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.q} className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#f0f0f0' }}>
                <h3 className="font-bold text-gray-800 mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" style={{ backgroundColor: PINK }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">מוכנה להתחיל?</h2>
          <p className="text-lg mb-10" style={{ color: '#fce4ec' }}>
            הצטרפי לעסקים שכבר חוסכים זמן עם שושו
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white px-10 py-4 rounded-2xl text-lg font-bold hover:bg-gray-50 transition"
            style={{ color: PINK }}
          >
            התחילי בחינם ←
          </button>
          <p className="text-sm mt-4" style={{ color: '#f48fb1' }}>ללא כרטיס אשראי · ביטול בכל עת</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-2xl font-bold text-white">🌸 שושו</div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition">מדיניות פרטיות</a>
              <a href="#" className="hover:text-white transition">תנאי שימוש</a>
              <a href="#" className="hover:text-white transition">צור קשר</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2026 שושו. כל הזכויות שמורות.
          </div>
        </div>
      </footer>

    </div>
  )
}

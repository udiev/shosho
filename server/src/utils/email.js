const nodemailer = require('nodemailer')

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: parseInt(SMTP_PORT || '587') === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

async function sendPasswordReset(toEmail, resetLink) {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@shosho.app'

  if (!transporter) {
    // No SMTP configured — log link so it's still usable in dev/testing
    console.log(`\n📧 Password reset link for ${toEmail}:\n${resetLink}\n`)
    return
  }

  await transporter.sendMail({
    from: `"שושו" <${from}>`,
    to: toEmail,
    subject: 'איפוס סיסמה — שושו',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 56px; height: 56px; border-radius: 16px;
            background: linear-gradient(135deg, #f472b6, #be185d); text-align: center;
            line-height: 56px; font-size: 24px; font-weight: 900; color: white;">ש</div>
          <h1 style="color: #1e293b; font-size: 20px; margin: 16px 0 4px;">איפוס סיסמה</h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">קיבלנו בקשה לאיפוס הסיסמה שלך</p>
        </div>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          לחץ על הכפתור הבא כדי לאפס את הסיסמה שלך. הקישור בתוקף למשך <strong>שעה אחת</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #db2777, #be185d);
            color: white; text-decoration: none; padding: 14px 36px; border-radius: 12px;
            font-size: 15px; font-weight: 600;">איפוס סיסמה</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם מהמייל הזה.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #cbd5e1; font-size: 12px; text-align: center;">שושו — ניהול תורים</p>
      </div>
    `,
  })
}

module.exports = { sendPasswordReset }

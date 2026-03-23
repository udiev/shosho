// Normalizes an Israeli phone number to E.164 format (+972...)
function normalizePhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('972')) return '+' + digits
  if (digits.startsWith('0')) return '+972' + digits.slice(1)
  return '+972' + digits
}

async function sendSMS(to, body) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    console.log(`📱 [SMS] To: ${to}\n${body}`)
    return
  }
  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  const toNumber = normalizePhone(to)
  if (!toNumber) return

  // WhatsApp if TWILIO_FROM starts with "whatsapp:"
  const from = TWILIO_FROM.startsWith('whatsapp:') ? TWILIO_FROM : TWILIO_FROM
  const toFormatted = TWILIO_FROM.startsWith('whatsapp:') ? `whatsapp:${toNumber}` : toNumber

  await twilio.messages.create({ from, to: toFormatted, body })
}

module.exports = { sendSMS, normalizePhone }

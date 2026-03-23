const cron = require('node-cron')
const { getPool, sql } = require('../config/db')
const { sendSMS } = require('../services/sms')

async function ensureReminderColumn(pool) {
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.columns
      WHERE object_id = OBJECT_ID('appointments') AND name = 'reminder_sent'
    )
    ALTER TABLE appointments ADD reminder_sent BIT NOT NULL DEFAULT 0
  `)
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

async function sendPendingReminders() {
  try {
    const pool = await getPool()
    await ensureReminderColumn(pool)

    // Find appointments starting in 23–25 hours from now, not yet reminded, not cancelled
    const now = new Date()
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const result = await pool.request()
      .input('from', sql.DateTime2, windowStart)
      .input('to',   sql.DateTime2, windowEnd)
      .query(`
        SELECT
          a.id, a.start_time, a.end_time,
          c.name  AS client_name,  c.phone AS client_phone,
          s.name  AS service_name,
          b.name  AS business_name, b.phone AS business_phone,
          b.reminders_enabled
        FROM appointments a
        JOIN clients  c ON a.client_id   = c.id
        JOIN services s ON a.service_id  = s.id
        JOIN businesses b ON a.business_id = b.id
        WHERE a.start_time >= @from
          AND a.start_time <  @to
          AND a.status NOT IN ('cancelled', 'completed')
          AND a.reminder_sent = 0
          AND c.phone IS NOT NULL
          AND (b.reminders_enabled IS NULL OR b.reminders_enabled = 1)
      `)

    for (const appt of result.recordset) {
      const message =
        `שלום ${appt.client_name}! 👋\n` +
        `תזכורת לתור שלך:\n` +
        `📅 ${formatDate(appt.start_time)}\n` +
        `🕐 ${formatTime(appt.start_time)}\n` +
        `✂️ ${appt.service_name}\n` +
        `📍 ${appt.business_name}` +
        (appt.business_phone ? `\n📞 ${appt.business_phone}` : '')

      try {
        await sendSMS(appt.client_phone, message)
        await pool.request()
          .input('id', sql.UniqueIdentifier, appt.id)
          .query('UPDATE appointments SET reminder_sent = 1 WHERE id = @id')
        console.log(`✅ Reminder sent for appointment ${appt.id} to ${appt.client_name}`)
      } catch (err) {
        console.error(`❌ Failed to send reminder for ${appt.id}:`, err.message)
      }
    }

    if (result.recordset.length > 0) {
      console.log(`📱 Reminders run: ${result.recordset.length} sent`)
    }
  } catch (err) {
    console.error('Reminders job error:', err)
  }
}

function startRemindersJob() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', sendPendingReminders)
  console.log('📱 Reminders job started (every 30 min)')
  // Also run once on startup to catch any missed reminders
  sendPendingReminders()
}

module.exports = { startRemindersJob, sendPendingReminders }

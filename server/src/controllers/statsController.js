const { getPool, sql } = require('../config/db')

async function getDashboardStats(req, res) {
  try {
    const pool = await getPool()
    const businessId = req.user.businessId

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('today', sql.DateTime2, today)
      .input('tomorrow', sql.DateTime2, tomorrow)
      .input('dayAfter', sql.DateTime2, dayAfter)
      .input('monthStart', sql.DateTime2, monthStart)
      .input('monthEnd', sql.DateTime2, monthEnd)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM appointments
           WHERE business_id = @businessId
           AND start_time >= @today AND start_time < @tomorrow
           AND status != 'cancelled') as today_count,

          (SELECT COUNT(*) FROM appointments
           WHERE business_id = @businessId
           AND start_time >= @tomorrow AND start_time < @dayAfter
           AND status != 'cancelled') as tomorrow_count,

          (SELECT COUNT(*) FROM clients
           WHERE business_id = @businessId) as total_clients,

          (SELECT ISNULL(SUM(s.price), 0)
           FROM appointments a
           JOIN services s ON a.service_id = s.id
           WHERE a.business_id = @businessId
           AND a.start_time >= @monthStart AND a.start_time < @monthEnd
           AND a.status = 'completed') as month_revenue,

          (SELECT COUNT(*) FROM appointments
           WHERE business_id = @businessId
           AND start_time >= @monthStart AND start_time < @monthEnd
           AND status = 'completed') as month_completed,

          (SELECT COUNT(*) FROM appointments
           WHERE business_id = @businessId
           AND start_time >= @monthStart AND start_time < @monthEnd
           AND status = 'no_show') as month_no_show
      `)

    const now = new Date()
    const upcomingAppts = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('now', sql.DateTime2, now)
      .query(`
        SELECT TOP 10
          a.id, a.start_time, a.end_time, a.status, a.notes,
          c.name as client_name, c.phone as client_phone, c.id as client_id,
          s.name as service_name, s.color as service_color, s.price
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.business_id = @businessId
          AND a.start_time >= @now
          AND a.status IN ('scheduled', 'confirmed')
        ORDER BY a.start_time ASC
      `)

    res.json({
      stats: result.recordset[0],
      upcoming_appointments: upcomingAppts.recordset,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getDashboardStats }

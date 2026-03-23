const { getPool, sql } = require('../config/db')

async function getAnalytics(req, res) {
  try {
    const pool = await getPool()
    const businessId = req.user.businessId

    const now = new Date()
    // Start of 6 months ago
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // Revenue + appointments per month (last 6 months)
    const monthlyResult = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('since', sql.DateTime2, sixMonthsAgo)
      .query(`
        SELECT
          YEAR(a.start_time) as yr,
          MONTH(a.start_time) as mo,
          COUNT(*) as appointment_count,
          SUM(CASE WHEN a.status = 'completed' THEN ISNULL(s.price, 0) ELSE 0 END) as revenue,
          SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) as no_show
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.business_id = @businessId
          AND a.start_time >= @since
        GROUP BY YEAR(a.start_time), MONTH(a.start_time)
        ORDER BY yr ASC, mo ASC
      `)

    // Top services by completed appointments (this year)
    const topServicesResult = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('yearStart', sql.DateTime2, yearStart)
      .query(`
        SELECT TOP 5
          s.name,
          s.color,
          COUNT(*) as count,
          ISNULL(SUM(s.price), 0) as revenue
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.business_id = @businessId
          AND a.status = 'completed'
          AND a.start_time >= @yearStart
        GROUP BY s.name, s.color
        ORDER BY count DESC
      `)

    // New clients per month (last 6 months)
    const newClientsResult = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('since', sql.DateTime2, sixMonthsAgo)
      .query(`
        SELECT
          YEAR(created_at) as yr,
          MONTH(created_at) as mo,
          COUNT(*) as new_clients
        FROM clients
        WHERE business_id = @businessId
          AND created_at >= @since
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY yr ASC, mo ASC
      `)

    // This month summary
    const thisMonthResult = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('monthStart', sql.DateTime2, monthStart)
      .input('monthEnd', sql.DateTime2, monthEnd)
      .query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN a.status = 'completed' THEN ISNULL(s.price, 0) ELSE 0 END) as revenue,
          SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) as no_show,
          AVG(CASE WHEN a.status = 'completed' THEN CAST(s.price AS FLOAT) ELSE NULL END) as avg_price
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.business_id = @businessId
          AND a.start_time >= @monthStart AND a.start_time < @monthEnd
      `)

    res.json({
      monthly: monthlyResult.recordset,
      top_services: topServicesResult.recordset,
      new_clients: newClientsResult.recordset,
      this_month: thisMonthResult.recordset[0],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getAnalytics }

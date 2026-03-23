const { getPool, sql } = require('../config/db')

const DEFAULTS = [
  { day_of_week: 0, is_open: true,  open_time: '09:00', close_time: '20:00' }, // ראשון
  { day_of_week: 1, is_open: true,  open_time: '09:00', close_time: '20:00' }, // שני
  { day_of_week: 2, is_open: true,  open_time: '09:00', close_time: '20:00' }, // שלישי
  { day_of_week: 3, is_open: true,  open_time: '09:00', close_time: '20:00' }, // רביעי
  { day_of_week: 4, is_open: true,  open_time: '09:00', close_time: '20:00' }, // חמישי
  { day_of_week: 5, is_open: true,  open_time: '09:00', close_time: '14:00' }, // שישי
  { day_of_week: 6, is_open: false, open_time: '09:00', close_time: '14:00' }, // שבת
]

async function ensureTable(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'business_hours')
    CREATE TABLE business_hours (
      id INT IDENTITY PRIMARY KEY,
      business_id UNIQUEIDENTIFIER NOT NULL,
      day_of_week TINYINT NOT NULL,
      is_open BIT NOT NULL DEFAULT 1,
      open_time VARCHAR(5) NOT NULL DEFAULT '09:00',
      close_time VARCHAR(5) NOT NULL DEFAULT '20:00',
      CONSTRAINT uq_biz_day UNIQUE (business_id, day_of_week)
    )
  `)
}

async function getHours(req, res) {
  try {
    const pool = await getPool()
    await ensureTable(pool)
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query('SELECT day_of_week, is_open, open_time, close_time FROM business_hours WHERE business_id = @businessId ORDER BY day_of_week')

    // Merge saved rows with defaults for any missing days
    const saved = result.recordset
    const hours = DEFAULTS.map(def => {
      const row = saved.find(r => r.day_of_week === def.day_of_week)
      return row ? { ...row, is_open: !!row.is_open } : { ...def }
    })
    res.json(hours)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function updateHours(req, res) {
  const hours = req.body // array of 7 days
  if (!Array.isArray(hours) || hours.length !== 7) {
    return res.status(400).json({ error: 'נדרשות 7 שורות' })
  }
  try {
    const pool = await getPool()
    await ensureTable(pool)
    for (const h of hours) {
      await pool.request()
        .input('businessId', sql.UniqueIdentifier, req.user.businessId)
        .input('day', sql.TinyInt, h.day_of_week)
        .input('isOpen', sql.Bit, h.is_open ? 1 : 0)
        .input('openTime', sql.VarChar(5), h.open_time)
        .input('closeTime', sql.VarChar(5), h.close_time)
        .query(`
          MERGE business_hours AS target
          USING (SELECT @businessId AS business_id, @day AS day_of_week) AS source
            ON target.business_id = source.business_id AND target.day_of_week = source.day_of_week
          WHEN MATCHED THEN
            UPDATE SET is_open = @isOpen, open_time = @openTime, close_time = @closeTime
          WHEN NOT MATCHED THEN
            INSERT (business_id, day_of_week, is_open, open_time, close_time)
            VALUES (@businessId, @day, @isOpen, @openTime, @closeTime);
        `)
    }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

// Used by booking controller (public, by businessId)
async function getHoursForBusiness(pool, businessId) {
  await ensureTable(pool)
  const result = await pool.request()
    .input('businessId', sql.UniqueIdentifier, businessId)
    .query('SELECT day_of_week, is_open, open_time, close_time FROM business_hours WHERE business_id = @businessId ORDER BY day_of_week')
  const saved = result.recordset
  return DEFAULTS.map(def => {
    const row = saved.find(r => r.day_of_week === def.day_of_week)
    return row ? { ...row, is_open: !!row.is_open } : { ...def }
  })
}

module.exports = { getHours, updateHours, getHoursForBusiness }

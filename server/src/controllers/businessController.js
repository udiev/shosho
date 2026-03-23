const { getPool, sql } = require('../config/db')

async function ensureRemindersColumn(pool) {
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.columns
      WHERE object_id = OBJECT_ID('businesses') AND name = 'reminders_enabled'
    )
    ALTER TABLE businesses ADD reminders_enabled BIT NOT NULL DEFAULT 1
  `)
}

async function getBusiness(req, res) {
  try {
    const pool = await getPool()
    await ensureRemindersColumn(pool)
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.user.businessId)
      .query('SELECT * FROM businesses WHERE id = @id')
    if (result.recordset.length === 0) return res.status(404).json({ error: 'עסק לא נמצא' })
    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function updateBusiness(req, res) {
  const { name, phone, address, description, primary_color, secondary_color, reminders_enabled } = req.body
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.user.businessId)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('description', sql.NVarChar, description || null)
      .input('primaryColor', sql.NVarChar, primary_color || '#C2185B')
      .input('secondaryColor', sql.NVarChar, secondary_color || '#F8BBD0')
      .input('remindersEnabled', sql.Bit, reminders_enabled !== false ? 1 : 0)
      .query(`
        UPDATE businesses
        SET name=@name, phone=@phone, address=@address, description=@description,
            primary_color=@primaryColor, secondary_color=@secondaryColor,
            reminders_enabled=@remindersEnabled
        OUTPUT INSERTED.*
        WHERE id=@id
      `)
    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getBusiness, updateBusiness }

const { getPool, sql } = require('../config/db')

async function getBusiness(req, res) {
  try {
    const pool = await getPool()
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
  const { name, phone, address, description, primary_color, secondary_color } = req.body
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
      .query(`
        UPDATE businesses
        SET name=@name, phone=@phone, address=@address, description=@description,
            primary_color=@primaryColor, secondary_color=@secondaryColor
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

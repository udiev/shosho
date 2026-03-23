const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { getPool, sql } = require('../config/db')
const { sendInvite } = require('../utils/email')

async function getTeam(req, res) {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query(`
        SELECT id, name, email, created_at
        FROM users
        WHERE business_id = @businessId AND role = 'staff'
        ORDER BY created_at ASC
      `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function createTeamMember(req, res) {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ error: 'שם ואימייל נדרשים' })

  try {
    const pool = await getPool()

    const exists = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT id FROM users WHERE email = @email')
    if (exists.recordset.length) return res.status(409).json({ error: 'אימייל כבר קיים במערכת' })

    // Create user with random unusable password — they'll set it via invite link
    const tempPassword = crypto.randomBytes(32).toString('hex')
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    const userId = crypto.randomUUID()

    await pool.request()
      .input('id', sql.UniqueIdentifier, userId)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query(`
        INSERT INTO users (id, business_id, name, email, password_hash, role)
        VALUES (@id, @businessId, @name, @email, @passwordHash, 'staff')
      `)

    // Generate invite token (reuses password_reset_tokens table, 7-day expiry)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
      CREATE TABLE password_reset_tokens (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        token_hash NVARCHAR(255) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used BIT DEFAULT 0
      )
    `)

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('tokenHash', sql.NVarChar, tokenHash)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
        VALUES (@userId, @tokenHash, @expiresAt, 0)
      `)

    const frontendUrl = process.env.FRONTEND_URL || 'https://polite-ground-07bc5cf03.2.azurestaticapps.net'
    const inviteLink = `${frontendUrl}/reset-password?token=${rawToken}`
    await sendInvite(email, name, inviteLink)

    res.status(201).json({ id: userId, name, email, role: 'staff' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function removeTeamMember(req, res) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query(`DELETE FROM users WHERE id = @id AND business_id = @businessId AND role = 'staff'`)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getTeam, createTeamMember, removeTeamMember }

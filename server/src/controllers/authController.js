const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { getPool, sql } = require('../config/db')
const { sendPasswordReset } = require('../utils/email')

async function register(req, res) {
  const { businessName, name, email, password, phone } = req.body
  if (!businessName || !name || !email || !password) {
    return res.status(400).json({ error: 'כל השדות הם חובה' })
  }
  try {
    const pool = await getPool()
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email')
    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'אימייל כבר קיים במערכת' })
    }
    const slug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4)
    const businessResult = await pool.request()
      .input('name', sql.NVarChar, businessName)
      .input('slug', sql.NVarChar, slug)
      .input('phone', sql.NVarChar, phone || null)
      .query('INSERT INTO businesses (name, slug, phone) OUTPUT INSERTED.id VALUES (@name, @slug, @phone)')
    const businessId = businessResult.recordset[0].id
    const passwordHash = await bcrypt.hash(password, 12)
    const userResult = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone || null)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('INSERT INTO users (business_id, name, email, phone, password_hash, role) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role VALUES (@businessId, @name, @email, @phone, @passwordHash, \'owner\')')
    const user = userResult.recordset[0]
    const token = jwt.sign(
      { userId: user.id, businessId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, business: { id: businessId, name: businessName, slug } })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'אימייל וסיסמה הם חובה' })
  }
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT u.id, u.name, u.email, u.role, u.password_hash, u.business_id FROM users u WHERE u.email = @email')
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' })
    }
    const user = result.recordset[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' })
    }
    const token = jwt.sign(
      { userId: user.id, businessId: user.business_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, businessId: user.business_id })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function ensureResetTable(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
    CREATE TABLE password_reset_tokens (
      id INT IDENTITY PRIMARY KEY,
      user_id UNIQUEIDENTIFIER NOT NULL,
      token_hash NVARCHAR(64) NOT NULL,
      expires_at DATETIME2 NOT NULL,
      used BIT NOT NULL DEFAULT 0
    )
  `)
}

async function forgotPassword(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'אימייל הוא חובה' })
  try {
    const pool = await getPool()
    await ensureResetTable(pool)
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email')

    // Always respond with success to prevent email enumeration
    if (result.recordset.length === 0) {
      return res.json({ success: true })
    }
    const userId = result.recordset[0].id
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('tokenHash', sql.NVarChar, tokenHash)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (@userId, @tokenHash, @expiresAt)')

    const frontendUrl = process.env.FRONTEND_URL || 'https://polite-ground-07bc5cf03.2.azurestaticapps.net'
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`
    await sendPasswordReset(email, resetLink)

    res.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function resetPassword(req, res) {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'חסרים פרטים' })
  if (password.length < 6) return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' })
  try {
    const pool = await getPool()
    await ensureResetTable(pool)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const result = await pool.request()
      .input('tokenHash', sql.NVarChar, tokenHash)
      .input('now', sql.DateTime2, new Date())
      .query(`
        SELECT id, user_id FROM password_reset_tokens
        WHERE token_hash = @tokenHash AND used = 0 AND expires_at > @now
      `)

    if (result.recordset.length === 0) {
      return res.status(400).json({ error: 'הקישור לא תקין או פג תוקף' })
    }
    const { id: tokenId, user_id: userId } = result.recordset[0]
    const passwordHash = await bcrypt.hash(password, 12)

    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('hash', sql.NVarChar, passwordHash)
      .query('UPDATE users SET password_hash = @hash WHERE id = @userId')

    await pool.request()
      .input('tokenId', sql.Int, tokenId)
      .query('UPDATE password_reset_tokens SET used = 1 WHERE id = @tokenId')

    res.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { register, login, forgotPassword, resetPassword }

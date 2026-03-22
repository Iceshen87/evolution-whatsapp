import { query } from '../db/index.js'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export const userModel = {
  async createUser(username, email, password) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    )
    return result.rows[0]
  },

  async findByUsername(username) {
    const result = await query(
      `SELECT id, username, email, password_hash, role, created_at, last_login_at
       FROM users WHERE username = $1`,
      [username]
    )
    return result.rows[0] || null
  },

  async findByEmail(email) {
    const result = await query(
      `SELECT id, username, email, password_hash, role, created_at, last_login_at
       FROM users WHERE email = $1`,
      [email]
    )
    return result.rows[0] || null
  },

  async findById(id) {
    const result = await query(
      `SELECT id, username, email, role, created_at, last_login_at
       FROM users WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
  },

  async updateLastLogin(id) {
    await query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    )
  },

  async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, id]
    )
  },

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
  },

  async findAll(options = {}) {
    const { limit = 50, offset = 0, role = null } = options
    let sql = `SELECT id, username, email, role, created_at, last_login_at FROM users`
    const params = []

    if (role) {
      sql += ` WHERE role = $1`
      params.push(role)
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await query(sql, params)
    return result.rows
  },

  async count(role = null) {
    let sql = `SELECT COUNT(*) as count FROM users`
    const params = []

    if (role) {
      sql += ` WHERE role = $1`
      params.push(role)
    }

    const result = await query(sql, params)
    return parseInt(result.rows[0].count)
  },

  async updateRole(id, role) {
    const result = await query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role`,
      [role, id]
    )
    return result.rows[0] || null
  },

  async deleteById(id) {
    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id])
    return result.rowCount > 0
  }
}

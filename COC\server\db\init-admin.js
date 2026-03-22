import bcrypt from 'bcryptjs'
import { query } from './index.js'

async function createAdmin() {
  try {
    const username = 'admin'
    const email = 'admin@example.com'
    const password = 'admin123'

    const passwordHash = await bcrypt.hash(password, 10)

    await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (username) DO NOTHING`,
      [username, email, passwordHash]
    )

    console.log('✓ Admin user created successfully')
    console.log('  Username: admin')
    console.log('  Password: admin123')
    console.log('  Please change this password after first login')
  } catch (err) {
    console.error('✗ Failed to create admin user:', err.message)
    process.exit(1)
  }
}

createAdmin()

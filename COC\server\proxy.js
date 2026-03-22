import express from 'express'
import cors from 'cors'
import { createRequire } from 'module'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
const axios = require('axios').default

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const VISITORS_FILE = join(DATA_DIR, 'visitors.json')
const MESSAGES_FILE = join(DATA_DIR, 'messages.json')

function readJSON(file) {
  try {
    if (!existsSync(file)) return []
    return JSON.parse(readFileSync(file, 'utf-8'))
  } catch { return [] }
}

function writeJSON(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

const app = express()
const PORT = process.env.PROXY_PORT || 3001
let apiKey = process.env.COC_API_KEY
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin' // Fixed: username and password are both 'admin'
const BASE_URL = 'https://api.clashofclans.com/v1'

// IP Country cache
const ipCountryCache = new Map()
async function getCountryFromIP(ip) {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local'
  }
  if (ipCountryCache.has(ip)) {
    return ipCountryCache.get(ip)
  }
  try {
    const resp = await axios.get(`https://ipapi.co/${ip}/json/`)
    const country = resp.data?.country_name || resp.data?.country || 'Unknown'
    ipCountryCache.set(ip, country)
    return country
  } catch {
    return 'Unknown'
  }
}

app.use(cors())
app.use(express.json())

// ========== Visitor Tracking ==========

// Record a visit (called by frontend on page load)
app.post('/site/visitors/track', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  const { sessionId, page, duration } = req.body
  const visitors = readJSON(VISITORS_FILE)

  // Get country for new IPs
  let country = 'Unknown'
  const cleanIp = typeof ip === 'string' ? ip.split(',')[0].trim() : ip

  // Find existing session or create new
  const existing = visitors.find(v => v.sessionId === sessionId)
  if (existing) {
    existing.lastSeen = new Date().toISOString()
    existing.duration = duration || existing.duration
    existing.pages = [...new Set([...(existing.pages || []), page])]
  } else {
    country = await getCountryFromIP(cleanIp)
    visitors.push({
      sessionId,
      ip: cleanIp,
      country,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      duration: duration || 0,
      pages: page ? [page] : [],
      userAgent: req.headers['user-agent'] || '',
    })
  }

  // Keep last 10000 records
  const trimmed = visitors.slice(-10000)
  writeJSON(VISITORS_FILE, trimmed)
  res.json({ ok: true })
})

// Get visitor logs (admin)
app.get('/site/admin/visitors', async (req, res) => {
  const { startDate, endDate } = req.query

  let visitors = readJSON(VISITORS_FILE)
  const allVisitors = [...visitors] // Keep copy for cumulative stats

  if (startDate) {
    visitors = visitors.filter(v => v.firstSeen >= startDate)
  }
  if (endDate) {
    visitors = visitors.filter(v => v.firstSeen <= endDate)
  }

  // Sort newest first
  visitors.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen))

  // Compute stats for filtered range
  const total = visitors.length
  const uniqueIps = new Set(visitors.map(v => v.ip)).size
  const avgDuration = total > 0
    ? Math.round(visitors.reduce((s, v) => s + (v.duration || 0), 0) / total)
    : 0

  // Count unique IPs per day (same IP on same day = 1 visit)
  const uniqueDailyVisits = new Set()
  visitors.forEach(v => {
    const day = v.firstSeen.slice(0, 10)
    uniqueDailyVisits.add(`${day}-${v.ip}`)
  })

  // Get country stats
  const countryStats = {}
  visitors.forEach(v => {
    const country = v.country || 'Unknown'
    countryStats[country] = (countryStats[country] || 0) + 1
  })

  // Compute cumulative stats (all time)
  const cumulativeTotal = allVisitors.length
  const cumulativeUniqueIps = new Set(allVisitors.map(v => v.ip)).size
  const cumulativeUniqueDailyVisits = new Set()
  allVisitors.forEach(v => {
    const day = v.firstSeen.slice(0, 10)
    cumulativeUniqueDailyVisits.add(`${day}-${v.ip}`)
  })

  // Add country to each visitor
  const visitorsWithCountry = await Promise.all(
    visitors.map(async (v) => ({
      ...v,
      country: v.country || await getCountryFromIP(v.ip)
    }))
  )

  res.json({
    visitors: visitorsWithCountry,
    stats: { 
      total, 
      uniqueIps, 
      avgDuration, 
      uniqueDailyVisits: uniqueDailyVisits.size, 
      countryStats,
      // Cumulative stats
      cumulativeTotal,
      cumulativeUniqueIps,
      cumulativeUniqueDailyVisits: cumulativeUniqueDailyVisits.size
    }
  })
})

// ========== Guestbook / Messages ==========

// Submit a message (one per IP)
app.post('/site/messages', (req, res) => {
  const { nickname, content } = req.body
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required' })
  }

  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp
  const messages = readJSON(MESSAGES_FILE)

  // Check if this IP already left a message
  if (messages.some(m => m.ip === ip)) {
    return res.status(409).json({ message: 'Already submitted', code: 'DUPLICATE_IP' })
  }

  messages.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nickname: (nickname || '').trim() || 'Anonymous',
    content: content.trim().slice(0, 1000),
    ip,
    createdAt: new Date().toISOString(),
  })

  // Keep last 5000 messages
  const trimmed = messages.slice(-5000)
  writeJSON(MESSAGES_FILE, trimmed)
  res.json({ ok: true })
})

// Get messages (include IP for table display)
app.get('/site/messages', (_req, res) => {
  const messages = readJSON(MESSAGES_FILE)
  // Return newest first, include IP
  const result = messages
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ id, nickname, content, ip, createdAt }) => ({ id, nickname, content, ip, createdAt }))
  res.json({ messages: result })
})

// ========== Admin: Server Info & API Key ==========

let cachedIp = null
let ipCacheTime = 0

app.get('/site/admin/server-info', async (req, res) => {
  // Get public IP (cache for 5 min)
  let ip = cachedIp
  if (!ip || Date.now() - ipCacheTime > 5 * 60 * 1000) {
    try {
      const resp = await axios.get('https://api.ipify.org?format=json')
      ip = resp.data.ip
      cachedIp = ip
      ipCacheTime = Date.now()
    } catch {
      ip = 'N/A'
    }
  }

  // Mask API key: show first 20 chars + ***
  const masked = apiKey ? apiKey.slice(0, 20) + '***' : 'Not set'

  res.json({ ip, apiKey: masked })
})

app.post('/site/admin/update-apikey', (req, res) => {
  const { apiKey: newKey } = req.body
  if (!newKey || !newKey.trim()) {
    return res.status(400).json({ message: 'API Key is required' })
  }

  try {
    // Update .env file
    const envPath = join(__dirname, '..', '.env')
    let envContent = readFileSync(envPath, 'utf-8')
    if (/^COC_API_KEY=.*$/m.test(envContent)) {
      envContent = envContent.replace(/^COC_API_KEY=.*$/m, `COC_API_KEY=${newKey.trim()}`)
    } else {
      envContent += `\nCOC_API_KEY=${newKey.trim()}\n`
    }
    writeFileSync(envPath, envContent, 'utf-8')

    // Hot reload in memory
    apiKey = newKey.trim()
    process.env.COC_API_KEY = newKey.trim()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update API Key', error: err.message })
  }
})

// ========== War Challenge Routes (must be before COC API Proxy) ==========
import warChallengeRoutes from './routes/warChallenge.js'
app.use('/site/war-challenges', warChallengeRoutes)

// ========== COC API Proxy ==========
app.use('/api/coc', async (req, res) => {
  try {
    const url = `${BASE_URL}${req.url}`
    const response = await axios({
      method: req.method,
      url,
      headers: { Authorization: `Bearer ${apiKey}` },
      params: req.query,
    })
    res.json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data = err.response?.data || { message: 'Proxy error' }
    res.status(status).json(data)
  }
})

// ========== Auth Routes ==========
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)

app.listen(PORT, () => {
  console.log(`COC API Proxy running on http://localhost:${PORT}`)
  console.log(`War challenges API: http://localhost:${PORT}/site/war-challenges`)
})

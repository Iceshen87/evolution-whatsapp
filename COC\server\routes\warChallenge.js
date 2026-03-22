import express from 'express'
import { body, param, validationResult } from 'express-validator'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const CHALLENGES_FILE = join(DATA_DIR, 'war-challenges.json')

const router = express.Router()

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  import('fs').then(fs => fs.mkdirSync(DATA_DIR, { recursive: true }))
}

function readChallenges() {
  try {
    if (!existsSync(CHALLENGES_FILE)) return []
    return JSON.parse(readFileSync(CHALLENGES_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeChallenges(data) {
  writeFileSync(CHALLENGES_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Get all challenges
router.get('/', (req, res) => {
  const challenges = readChallenges()
  // Filter out expired challenges (older than 7 days)
  const now = new Date()
  const activeChallenges = challenges.filter(c => {
    const created = new Date(c.createdAt)
    const daysDiff = (now - created) / (1000 * 60 * 60 * 24)
    return daysDiff < 7
  })
  res.json({ challenges: activeChallenges })
})

// Create new challenge
router.post('/', [
  body('clanName').trim().notEmpty().withMessage('Clan name is required'),
  body('leaderName').trim().notEmpty().withMessage('Leader name is required'),
  body('contactType').isIn(['email', 'telegram', 'wechat', 'x']).withMessage('Invalid contact type'),
  body('contactValue').trim().notEmpty().withMessage('Contact value is required'),
  body('server').isIn(['international', 'china']).withMessage('Invalid server'),
  body('teamSize').optional().isIn(['5v5', '']).withMessage('Invalid team size'),
  body('thLevel').optional().isIn(['th18', 'th17', 'th16', 'th15', 'th14', 'th13', '']).withMessage('Invalid TH level'),
  body('difficulty').optional().isIn(['esports', 'diamond', 'normal']).withMessage('Invalid difficulty'),
  body('matchDuration').optional().isIn(['45min', 'custom']).withMessage('Invalid duration'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
  }

  const { 
    clanName, clanTag, leaderName, contactType, contactValue, 
    preferredDate, preferredTime, teamSize, thLevel, difficulty,
    matchDuration, customDuration, officialSchedule, bannedTroops,
    notes, rules, server 
  } = req.body

  const challenges = readChallenges()
  
  // Check if same clan already has an active challenge
  const existing = challenges.find(c => 
    c.clanName.toLowerCase() === clanName.toLowerCase() && 
    c.status === 'active'
  )
  if (existing) {
    return res.status(409).json({ message: 'Your clan already has an active challenge', code: 'DUPLICATE_CHALLENGE' })
  }

  const newChallenge = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    clanName: clanName.trim(),
    clanTag: (clanTag || '').trim(),
    leaderName: leaderName.trim(),
    contactType,
    contactValue: contactValue.trim(),
    preferredDate: preferredDate || '',
    preferredTime: (preferredTime || '').trim(),
    teamSize: teamSize || '',
    thLevel: thLevel || '',
    difficulty: difficulty || 'normal',
    matchDuration: matchDuration || '45min',
    customDuration: (customDuration || '').trim(),
    officialSchedule: officialSchedule !== false,
    bannedTroops: (bannedTroops || '').trim(),
    notes: (notes || '').trim(),
    rules: rules || [],
    server,
    createdAt: new Date().toISOString(),
    status: 'active',
  }

  challenges.push(newChallenge)
  
  // Keep only last 100 challenges
  const trimmed = challenges.slice(-100)
  writeChallenges(trimmed)

  res.json({ success: true, challenge: newChallenge })
})

// Delete challenge
router.delete('/:id', [
  param('id').notEmpty().withMessage('Challenge ID is required'),
], (req, res) => {
  const { id } = req.params
  const challenges = readChallenges()
  
  const index = challenges.findIndex(c => c.id === id)
  if (index === -1) {
    return res.status(404).json({ message: 'Challenge not found' })
  }

  challenges[index].status = 'cancelled'
  writeChallenges(challenges)

  res.json({ success: true })
})

export default router

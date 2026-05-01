const path = require('path')
// Optional server/.env first; repo root .env last so it wins (avoids empty keys in server/.env wiping root).
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true })
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true, quiet: true })

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const { Readable } = require('stream')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = process.env.PORT || 5000
const TRACKER_INSTALLER_PATH = path.join(__dirname, '../downloads/tracker-setup.exe')
const TRACKER_DOWNLOADS_DIR = path.dirname(TRACKER_INSTALLER_PATH)
const TRACKER_BUILD_OUTPUT_DIR = path.join(__dirname, '../../desktop-tracker/dist')
const TRACKER_INSTALLER_DIRS = [TRACKER_DOWNLOADS_DIR, TRACKER_BUILD_OUTPUT_DIR]

/** Split CORS_ORIGIN: exact URLs vs https://*.example.com (one subdomain label before the suffix). */
function parseCorsOriginEnv(value) {
  const exact = []
  const patterns = []
  if (!value || typeof value !== 'string') return { exact, patterns }
  for (const part of value.split(',')) {
    const s = part.trim()
    if (!s) continue
    const wild = s.match(/^https:\/\/\*\.(.+)$/i)
    if (wild) {
      const escaped = wild[1].replace(/\./g, '\\.')
      patterns.push(new RegExp(`^https:\\/\\/[^/]+\\.${escaped}$`, 'i'))
      continue
    }
    exact.push(s)
  }
  return { exact, patterns }
}

const vercelTrackdeskRegex = /^https:\/\/trackdesk(-[a-z0-9-]+)?\.vercel\.app$/i
const envCors = parseCorsOriginEnv(process.env.CORS_ORIGIN)
const corsExactOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://trackdesk.vercel.app',
  'https://trackdesk-f1uj.onrender.com',
  ...envCors.exact,
])
const corsOriginPatterns = [vercelTrackdeskRegex, ...envCors.patterns]

const corsOptions = {
  origin: function (origin, callback) {
    const allowed =
      !origin ||
      corsExactOrigins.has(origin) ||
      corsOriginPatterns.some((re) => re.test(origin))

    if (allowed) {
      callback(null, true)
    } else {
      console.log(`[CORS Blocked] Origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());

const { createSupabaseClient, loadAppState, createSaveDb } = require('./db-supabase')

let systems = []
let projects = []
let tasks = []
let employees = []
let activityLogs = []
let trackerSessions = []
let activeTrackerTimers = []
let notifications = []

let nextId = 1
let nextProjectId = 1
let nextTaskId = 1
let nextEmployeeId = 1
let nextNotificationId = 1
let nextTrackerTimerId = 1

/** @type {() => Promise<unknown>} */
let saveDb = () => Promise.resolve()

let bootstrapPromise = null

async function bootstrapPersistence() {
  const supabase = createSupabaseClient()
  const state = await loadAppState(supabase)
  systems = state.systems
  projects = state.projects
  tasks = state.tasks
  employees = state.employees
  activityLogs = state.activityLogs
  trackerSessions = state.trackerSessions
  activeTrackerTimers = state.activeTrackerTimers
  notifications = state.notifications
  nextId = state.nextId
  nextProjectId = state.nextProjectId
  nextTaskId = state.nextTaskId
  nextEmployeeId = state.nextEmployeeId
  nextNotificationId = state.nextNotificationId
  nextTrackerTimerId = state.nextTrackerTimerId
  saveDb = createSaveDb(supabase, () => ({
    systems,
    projects,
    tasks,
    employees,
    activityLogs,
    trackerSessions,
    activeTrackerTimers,
    notifications,
    nextId,
    nextProjectId,
    nextTaskId,
    nextEmployeeId,
    nextNotificationId,
    nextTrackerTimerId,
  }))
}

async function ensureBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapPersistence().catch((err) => {
      bootstrapPromise = null
      throw err
    })
  }
  return bootstrapPromise
}

function getLatestTrackerInstaller() {
  const candidates = []

  for (const dirPath of TRACKER_INSTALLER_DIRS) {
    if (!fs.existsSync(dirPath)) continue
    const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true }).filter((entry) => entry.isFile())
    for (const entry of dirEntries) {
      const fullPath = path.join(dirPath, entry.name)
      const ext = path.extname(entry.name).toLowerCase()
      if (!['.exe', '.msi'].includes(ext)) continue
      const stats = fs.statSync(fullPath)
      candidates.push({
        name: entry.name,
        fullPath,
        ext,
        mtimeMs: stats.mtimeMs,
      })
    }
  }

  if (candidates.length === 0) return null

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return candidates[0]
}

function toIsoDate(v) {
  if (!v) return ''
  const raw = String(v).trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dmy) {
    const [, dd, mm, yyyy] = dmy
    return `${yyyy}-${mm}-${dd}`
  }
  return raw.slice(0, 10)
}

function isIsoDate(v) {
  if (!v) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v))
}

function employeeNameSet() {
  return new Set(
    employees.map((e) => String(e.name || '').trim()).filter(Boolean),
  )
}

function sanitizeProjectMembers(rawMembers) {
  const available = employeeNameSet()
  const uniq = []
  for (const item of Array.isArray(rawMembers) ? rawMembers : []) {
    const name = String(item || '').trim()
    if (!name) continue
    if (!available.has(name)) continue
    if (!uniq.includes(name)) uniq.push(name)
  }
  return uniq
}

function findProjectByName(projectName) {
  const normalized = String(projectName || '').trim().toLowerCase()
  if (!normalized) return null
  return projects.find((p) => String(p.name || '').trim().toLowerCase() === normalized) || null
}

function validateProjectDateRange(startDate, endDate) {
  if (startDate && !isIsoDate(startDate)) return 'startDate must be YYYY-MM-DD'
  if (endDate && !isIsoDate(endDate)) return 'endDate must be YYYY-MM-DD'
  if (startDate && endDate && startDate > endDate) return 'startDate cannot be after endDate'
  return ''
}

function allowedAssignee(project, assignee) {
  const name = String(assignee || '').trim()
  if (!name) return true
  const members = Array.isArray(project?.members) ? project.members : []
  return members.includes(name)
}

function writeActivity(action, details = {}) {
  activityLogs.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    action,
    details,
    timestamp: new Date().toISOString(),
  })
  if (activityLogs.length > 250) activityLogs.length = 250
  createNotificationFromActivity(action, details)
}

function createNotification(title, message) {
  notifications.unshift({
    id: nextNotificationId++,
    title: String(title || 'System update'),
    message: String(message || ''),
    read: false,
    createdAt: new Date().toISOString(),
  })
  if (notifications.length > 500) notifications.length = 500
}

function createNotificationFromActivity(action, details = {}) {
  const label = String(action || '').trim()
  if (!label) return

  const titleMap = {
    'project.created': 'Project created',
    'project.updated': 'Project updated',
    'project.deleted': 'Project deleted',
    'task.created': 'Task created',
    'task.updated': 'Task updated',
    'task.deleted': 'Task deleted',
    'task.status.updated': 'Task status changed',
    'employee.created': 'Employee added',
    'employee.updated': 'Employee updated',
    'employee.deleted': 'Employee removed',
    'system.created': 'System added',
    'system.status.updated': 'System status updated',
    'tracker.timer.started': 'Timer started',
    'tracker.session.synced': 'Timer synced',
  }
  const title = titleMap[label] || 'System activity'
  const detailText = Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' | ')
  createNotification(title, detailText || `${label} completed`)
}

function findTaskById(taskId) {
  const id = Number(taskId)
  if (!Number.isFinite(id) || id <= 0) return null
  return tasks.find((t) => t.id === id) || null
}

function ensureTaskTimeTrackingShape(task) {
  if (!task || typeof task !== 'object') return
  if (!Array.isArray(task.timeEntries)) task.timeEntries = []
  if (!Number.isFinite(Number(task.totalTrackedSeconds))) task.totalTrackedSeconds = 0
}

function applyTrackedTimeToTask(task, session) {
  if (!task || !session) return
  ensureTaskTimeTrackingShape(task)
  const durationSeconds = Math.max(0, Number(session.durationSeconds) || 0)
  task.timeEntries.unshift({
    id: session.id,
    userId: session.userId,
    userName: session.userName,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds,
    source: session.source || 'desktop',
  })
  if (task.timeEntries.length > 400) task.timeEntries.length = 400
  task.totalTrackedSeconds = Math.max(0, Number(task.totalTrackedSeconds) || 0) + durationSeconds
  const totalHours = Math.round((task.totalTrackedSeconds / 3600) * 100) / 100
  task.loggedHours = totalHours
  task.loggedDate = String(session.endedAt || new Date().toISOString()).slice(0, 10)
}

function sanitizeTaskAttachments(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const item of raw) {
    const id = String(item?.id || '').trim()
    const url = String(item?.url || '').trim()
    if (!id || !url) continue
    const name = String(item?.name || 'image').trim() || 'image'
    const type = String(item?.type || 'image/*').trim() || 'image/*'
    const size = Number(item?.size || 0)
    out.push({
      id,
      url,
      name,
      type,
      size: Number.isFinite(size) && size >= 0 ? size : 0,
    })
  }
  return out
}

function createPasswordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex')
  return { salt, hash }
}

function verifyPassword(password, salt, hash) {
  if (!password || !salt || !hash) return false
  const derived = crypto.pbkdf2Sync(String(password), String(salt), 100000, 64, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(String(hash), 'hex'))
}

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  let out = ''
  for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function sanitizeEmployeeForClient(employee) {
  if (!employee || typeof employee !== 'object') return employee
  const { passwordHash, passwordSalt, ...safe } = employee
  return safe
}

let smtpTransport = null
function getMailTransport() {
  if (smtpTransport) return smtpTransport
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass || !Number.isFinite(port)) return null
  smtpTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return smtpTransport
}

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveSmtpFromAddress() {
  const raw = String(process.env.SMTP_FROM || '').replace(/^\uFEFF/, '').trim()
  const angle = raw.match(/<([^>\s@]+@[^>\s]+)>/)
  const configured = angle ? angle[1].trim() : raw
  if (configured && SIMPLE_EMAIL_RE.test(configured)) return configured
  const rawUser = String(process.env.SMTP_USER || '').trim()
  if (rawUser && rawUser.toLowerCase() !== 'apikey' && SIMPLE_EMAIL_RE.test(rawUser)) return rawUser
  return ''
}

async function sendEmployeeWelcomeEmail({ toEmail, fullName, role, tempPassword }) {
  const transport = getMailTransport()
  if (!transport) return { sent: false, message: 'SMTP is not configured on server.' }
  const from = resolveSmtpFromAddress()
  if (!from) {
    return {
      sent: false,
      message:
        'Set SMTP_FROM in .env to a verified sender address (e.g. no-reply@yourdomain.com). With SendGrid, SMTP_USER must stay "apikey" and cannot be used as the From header.',
    }
  }
  const loginUrl = process.env.APP_LOGIN_URL || 'http://localhost:5173'
  const fromName = String(process.env.SMTP_FROM_NAME || 'TrackDesk').trim() || 'TrackDesk'
  const fromHeader = `"${fromName.replace(/"/g, '\\"')}" <${from}>`
  const supportEmail = String(process.env.SMTP_REPLY_TO || from).trim()

  const info = await transport.sendMail({
    from: fromHeader,
    replyTo: supportEmail,
    to: toEmail,
    subject: 'TrackDesk account details',
    text: [
      `Hi ${fullName},`,
      '',
      'Your TrackDesk account has been created.',
      `Role: ${role}`,
      `Username: ${toEmail}`,
      `Temporary password: ${tempPassword}`,
      '',
      `Login URL: ${loginUrl}`,
      'Please sign in and change your password.',
      '',
      'If you did not expect this email, contact your administrator.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55">
        <p>Hi ${escapeHtml(fullName)},</p>
        <p>Your TrackDesk account has been created.</p>
        <table style="border-collapse:collapse;margin:12px 0">
          <tr><td style="padding:6px 10px 6px 0;font-weight:700">Role</td><td style="padding:6px 0">${escapeHtml(role)}</td></tr>
          <tr><td style="padding:6px 10px 6px 0;font-weight:700">Username</td><td style="padding:6px 0">${escapeHtml(toEmail)}</td></tr>
          <tr><td style="padding:6px 10px 6px 0;font-weight:700">Temporary password</td><td style="padding:6px 0"><code style="background:#f8fafc;border:1px solid #e2e8f0;padding:2px 6px;border-radius:6px">${escapeHtml(tempPassword)}</code></td></tr>
        </table>
        <p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:9px 14px;border-radius:8px;font-weight:700">Open TrackDesk</a></p>
        <p>Please sign in and change your password.</p>
        <p style="font-size:12px;color:#64748b">If you did not expect this email, contact your administrator.</p>
      </div>
    `,
  })
  const accepted = Array.isArray(info?.accepted) ? info.accepted : []
  const rejected = Array.isArray(info?.rejected) ? info.rejected : []
  if (accepted.length === 0 && rejected.length > 0) {
    return { sent: false, message: `Email rejected by SMTP provider for ${toEmail}` }
  }
  return { sent: true, message: `Welcome email sent to ${toEmail}` }
}

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@system.local'
let adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'System Admin'
const JWT_SECRET = String(process.env.JWT_SECRET || 'dev-only-change-me')
const JWT_EXPIRES_IN = String(process.env.JWT_EXPIRES_IN || '7d')

function createAuthToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function requireBearerAuth(req, res, next) {
  const header = String(req.headers.authorization || '')
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' })
  }
  const token = header.slice('Bearer '.length).trim()
  if (!token) return res.status(401).json({ message: 'Missing bearer token' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.auth = decoded
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email || !password) return res.status(400).json({ message: 'email and password are required' })

  if (email === String(DEFAULT_ADMIN_EMAIL).trim().toLowerCase()) {
    if (password !== adminPassword) return res.status(401).json({ message: 'Invalid credentials' })
    const token = createAuthToken({
      sub: 'admin',
      email: DEFAULT_ADMIN_EMAIL,
      role: 'Admin',
      displayName: DEFAULT_ADMIN_NAME,
    })
    return res.json({
      token,
      role: 'Admin',
      displayName: DEFAULT_ADMIN_NAME,
      email: DEFAULT_ADMIN_EMAIL,
      userId: 'admin',
      passwordResetRequired: false,
    })
  }

  const employee = employees.find((e) => String(e.email || '').trim().toLowerCase() === email)
  if (!employee || employee.active === false) return res.status(401).json({ message: 'Invalid credentials' })
  if (!verifyPassword(password, employee.passwordSalt, employee.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = createAuthToken({
    sub: String(employee.id),
    email: employee.email,
    role: employee.role || 'Employee',
    displayName: employee.name,
  })
  return res.json({
    token,
    role: employee.role || 'Employee',
    displayName: employee.name,
    email: employee.email,
    userId: employee.id,
    passwordResetRequired: Boolean(employee.passwordResetRequired),
  })
})

app.post('/api/auth/change-password', requireBearerAuth, async (req, res) => {
  const tokenEmail = String(req.auth?.email || '').trim().toLowerCase()
  const email = tokenEmail || String(req.body?.email || '').trim().toLowerCase()
  const currentPassword = String(req.body?.currentPassword || '')
  const nextPassword = String(req.body?.newPassword || '')

  if (!email || !currentPassword || !nextPassword) {
    return res.status(400).json({ message: 'email, currentPassword and newPassword are required' })
  }
  if (nextPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' })
  }
  if (currentPassword === nextPassword) {
    return res.status(400).json({ message: 'New password must be different from current password' })
  }

  const adminEmail = String(DEFAULT_ADMIN_EMAIL).trim().toLowerCase()
  if (email === adminEmail) {
    if (currentPassword !== adminPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }
    adminPassword = nextPassword
    return res.json({ ok: true, message: 'Password changed successfully' })
  }

  const employee = employees.find((e) => String(e.email || '').trim().toLowerCase() === email)
  if (!employee || employee.active === false) {
    return res.status(404).json({ message: 'Account not found' })
  }
  if (!verifyPassword(currentPassword, employee.passwordSalt, employee.passwordHash)) {
    return res.status(401).json({ message: 'Current password is incorrect' })
  }

  const passwordMeta = createPasswordHash(nextPassword)
  employee.passwordSalt = passwordMeta.salt
  employee.passwordHash = passwordMeta.hash
  employee.passwordResetRequired = false
  employee.updatedAt = new Date().toISOString()
  writeActivity('auth.password.changed', {
    employeeId: employee.id,
    employeeName: employee.name,
    email: employee.email,
  })
  await saveDb()
  return res.json({ ok: true, message: 'Password changed successfully' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/health') return next()
  return requireBearerAuth(req, res, next)
})

app.get('/api/tracker/download', async (req, res) => {
  const latestInstaller = getLatestTrackerInstaller()
  if (latestInstaller) {
    return res.download(latestInstaller.fullPath, latestInstaller.name)
  }

  const remoteUrl = String(process.env.TRACKER_INSTALLER_URL || '').trim()
  if (!remoteUrl) {
    return res.status(404).json({
      message:
        'Tracker installer not found. Build the desktop app and add .exe/.msi under server/downloads (local), or set TRACKER_INSTALLER_URL on the server to a direct download link (e.g. GitHub Release asset).',
    })
  }

  try {
    const upstream = await fetch(remoteUrl, { redirect: 'follow' })
    if (!upstream.ok) {
      console.error('[tracker/download] upstream HTTP', upstream.status, remoteUrl)
      return res.status(502).json({ message: 'Could not fetch tracker installer from configured URL.' })
    }

    const fallbackName = 'tracker-setup.exe'
    const disp = upstream.headers.get('content-disposition')
    if (disp) {
      res.setHeader('Content-Disposition', disp)
    } else {
      try {
        const base = path.basename(new URL(remoteUrl).pathname) || fallbackName
        res.setHeader('Content-Disposition', `attachment; filename="${base}"`)
      } catch {
        res.setHeader('Content-Disposition', `attachment; filename="${fallbackName}"`)
      }
    }

    const ct = upstream.headers.get('content-type')
    if (ct) res.setHeader('Content-Type', ct)
    else res.setHeader('Content-Type', 'application/octet-stream')

    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body)
      nodeStream.on('error', (err) => {
        console.error('[tracker/download] stream error', err)
        if (!res.headersSent) res.sendStatus(502)
        else res.destroy(err)
      })
      nodeStream.pipe(res)
      return
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    return res.send(buf)
  } catch (err) {
    console.error('[tracker/download] remote fetch error', err)
    return res.status(502).json({ message: 'Could not fetch tracker installer.' })
  }
})

app.post('/api/tracker/timer/start', async (req, res) => {
  const { userId, userName, projectName, taskId, taskTitle, source = 'desktop' } = req.body || {}
  if (!userId || !userName || !projectName || !taskId) {
    return res.status(400).json({ message: 'userId, userName, projectName and taskId are required' })
  }

  const task = findTaskById(taskId)
  if (!task) return res.status(404).json({ message: 'task not found' })
  if (String(task.project || '').trim().toLowerCase() !== String(projectName || '').trim().toLowerCase()) {
    return res.status(400).json({ message: 'task does not belong to selected project' })
  }

  const already = activeTrackerTimers.find((item) => Number(item.taskId) === Number(task.id))
  if (already) return res.status(409).json({ message: 'timer already running for this task', timer: already })

  const timer = {
    id: nextTrackerTimerId++,
    userId: String(userId),
    userName: String(userName),
    projectName: String(projectName),
    taskId: Number(task.id),
    taskTitle: String(taskTitle || task.title || ''),
    source: String(source || 'desktop'),
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  activeTrackerTimers.unshift(timer)
  task.activeTimer = {
    timerId: timer.id,
    userId: timer.userId,
    userName: timer.userName,
    startedAt: timer.startedAt,
    source: timer.source,
  }
  writeActivity('tracker.timer.started', {
    taskId: task.id,
    title: task.title,
    userId: timer.userId,
    userName: timer.userName,
  })
  await saveDb()
  res.status(201).json(timer)
})

app.post('/api/tracker/timer/stop', async (req, res) => {
  const { sessionId, userId, taskId, source = 'desktop' } = req.body || {}
  const idx = activeTrackerTimers.findIndex((item) => {
    if (sessionId != null && Number(item.id) === Number(sessionId)) return true
    if (taskId != null && userId != null) return Number(item.taskId) === Number(taskId) && String(item.userId) === String(userId)
    return false
  })
  if (idx === -1) return res.status(404).json({ message: 'active timer not found' })

  const timer = activeTrackerTimers[idx]
  const endedAt = new Date()
  const startedDate = new Date(timer.startedAt)
  const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - startedDate.getTime()) / 1000))
  const record = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    timerId: timer.id,
    userId: timer.userId,
    userName: timer.userName,
    projectName: timer.projectName,
    taskId: timer.taskId,
    taskTitle: timer.taskTitle,
    startedAt: startedDate.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSeconds,
    source: String(source || timer.source || 'desktop'),
    createdAt: new Date().toISOString(),
  }

  trackerSessions.unshift(record)
  if (trackerSessions.length > 10000) trackerSessions.length = 10000
  activeTrackerTimers.splice(idx, 1)

  const task = findTaskById(timer.taskId)
  if (task) {
    applyTrackedTimeToTask(task, record)
    delete task.activeTimer
    if (!task.assignee && record.userName) task.assignee = record.userName
  }

  writeActivity('tracker.session.synced', {
    userId: record.userId,
    userName: record.userName,
    taskId: record.taskId,
    projectName: record.projectName,
    durationSeconds: record.durationSeconds,
    source: record.source,
  })
  await saveDb()
  return res.status(201).json(record)
})

app.post('/api/tracker/sessions', async (req, res) => {
  const { userId, userName, projectName, taskId, taskTitle, startedAt, endedAt, durationSeconds, source = 'desktop' } = req.body || {}
  if (!userId || !userName || !projectName || !startedAt || !endedAt || !Number.isFinite(Number(durationSeconds))) {
    return res.status(400).json({
      message: 'userId, userName, projectName, startedAt, endedAt and numeric durationSeconds are required',
    })
  }
  const startedDate = new Date(startedAt)
  const endedDate = new Date(endedAt)
  if (Number.isNaN(startedDate.getTime()) || Number.isNaN(endedDate.getTime())) {
    return res.status(400).json({ message: 'startedAt and endedAt must be valid datetime values' })
  }

  const record = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    userId: String(userId),
    userName: String(userName),
    projectName: String(projectName),
    taskId: taskId != null && taskId !== '' ? Number(taskId) : null,
    taskTitle: taskTitle != null ? String(taskTitle) : '',
    startedAt: startedDate.toISOString(),
    endedAt: endedDate.toISOString(),
    durationSeconds: Math.max(0, Number(durationSeconds)),
    source: String(source || 'desktop'),
    createdAt: new Date().toISOString(),
  }

  trackerSessions.unshift(record)
  if (trackerSessions.length > 10000) trackerSessions.length = 10000

  if (record.taskId) {
    const task = findTaskById(record.taskId)
    if (task) {
      applyTrackedTimeToTask(task, record)
      if (!task.assignee && record.userName) task.assignee = record.userName
    }
  }
  writeActivity('tracker.session.synced', {
    userId: record.userId,
    userName: record.userName,
    taskId: record.taskId,
    projectName: record.projectName,
    durationSeconds: record.durationSeconds,
    source: record.source,
  })
  await saveDb()
  return res.status(201).json(record)
})

app.get('/api/tracker/sessions', (req, res) => {
  res.json(trackerSessions)
})

app.get('/api/systems', (req, res) => {
  res.json(systems)
})

app.get('/api/projects', (req, res) => {
  res.json(projects)
})

app.post('/api/projects', async (req, res) => {
  const {
    name,
    owner,
    description = '',
    priority = 'medium',
    startDate = '',
    endDate = '',
    totalTasks = 0,
    completedTasks = 0,
    status = 'active',
    members = [],
  } = req.body
  if (!name || !owner) return res.status(400).json({ message: 'name and owner are required' })
  if (projects.some((p) => String(p.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase())) {
    return res.status(400).json({ message: 'project name must be unique' })
  }
  const normalizedStart = toIsoDate(startDate)
  const normalizedEnd = toIsoDate(endDate)
  const dateError = validateProjectDateRange(normalizedStart, normalizedEnd)
  if (dateError) return res.status(400).json({ message: dateError })

  const cleanMembers = sanitizeProjectMembers(members)
  if (cleanMembers.length === 0) {
    return res.status(400).json({ message: 'at least one assigned project member is required' })
  }

  const project = {
    id: nextProjectId++,
    name,
    owner,
    description,
    priority,
    startDate: normalizedStart,
    endDate: normalizedEnd,
    totalTasks,
    completedTasks,
    status,
    members: cleanMembers,
  }
  projects.unshift(project)
  writeActivity('project.created', { projectId: project.id, name: project.name, memberCount: cleanMembers.length })
  await saveDb()
  res.status(201).json(project)
})

app.patch('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id)
  const {
    name,
    owner,
    description,
    priority,
    startDate,
    endDate,
    totalTasks,
    completedTasks,
    status,
    members,
  } = req.body || {}

  const project = projects.find((p) => p.id === id)
  if (!project) return res.status(404).json({ message: 'project not found' })
  const prevName = project.name
  if (
    name !== undefined
    && projects.some((p) => p.id !== id && String(p.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase())
  ) {
    return res.status(400).json({ message: 'project name must be unique' })
  }

  const nextStart = startDate !== undefined ? toIsoDate(startDate) : toIsoDate(project.startDate)
  const nextEnd = endDate !== undefined ? toIsoDate(endDate) : toIsoDate(project.endDate)
  const dateError = validateProjectDateRange(nextStart, nextEnd)
  if (dateError) return res.status(400).json({ message: dateError })

  if (name !== undefined) project.name = name
  if (owner !== undefined) project.owner = owner
  if (description !== undefined) project.description = description
  if (priority !== undefined) project.priority = priority
  if (startDate !== undefined) project.startDate = nextStart
  if (endDate !== undefined) project.endDate = nextEnd
  if (totalTasks !== undefined) project.totalTasks = totalTasks
  if (completedTasks !== undefined) project.completedTasks = completedTasks
  if (status !== undefined) project.status = status
  if (members !== undefined) {
    const cleanMembers = sanitizeProjectMembers(members)
    if (cleanMembers.length === 0) {
      return res.status(400).json({ message: 'at least one assigned project member is required' })
    }
    project.members = cleanMembers
    for (const task of tasks) {
      if (String(task.project || '').trim().toLowerCase() !== String(project.name || '').trim().toLowerCase()) continue
      if (!allowedAssignee(project, task.assignee)) task.assignee = null
    }
  }

  if (name !== undefined && String(prevName || '').trim() && String(prevName || '').trim() !== String(project.name || '').trim()) {
    for (const task of tasks) {
      if (String(task.project || '').trim().toLowerCase() === String(prevName || '').trim().toLowerCase()) {
        task.project = project.name
      }
    }
  }

  writeActivity('project.updated', { projectId: project.id, name: project.name })
  await saveDb()
  return res.json(project)
})

app.delete('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id)
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) return res.status(404).json({ message: 'project not found' })

  const [removed] = projects.splice(idx, 1)
  for (let i = tasks.length - 1; i >= 0; i--) {
    if (String(tasks[i].project || '').trim().toLowerCase() === String(removed.name || '').trim().toLowerCase()) {
      tasks.splice(i, 1)
    }
  }
  writeActivity('project.deleted', { projectId: id, name: removed?.name || '' })
  await saveDb()
  return res.json({ success: true })
})

app.get('/api/tasks', (req, res) => {
  res.json(tasks)
})

app.post('/api/tasks', async (req, res) => {
  const {
    title,
    project,
    priority = 'medium',
    status = 'backlog',
    description = '',
    assignee,
    loggedHours,
    loggedDate,
    deadline,
    attachments,
  } = req.body || {}
  if (!title || !project) return res.status(400).json({ message: 'title and project are required' })
  const linkedProject = findProjectByName(project)
  if (!linkedProject) return res.status(400).json({ message: 'task must belong to an existing project' })
  if (!allowedAssignee(linkedProject, assignee)) {
    return res.status(400).json({ message: 'task assignee must be a member of the selected project' })
  }
  const normalizedDeadline = deadline ? toIsoDate(deadline) : ''
  if (normalizedDeadline && !isIsoDate(normalizedDeadline)) {
    return res.status(400).json({ message: 'deadline must be YYYY-MM-DD' })
  }
  const cleanAttachments = sanitizeTaskAttachments(attachments)

  const task = {
    id: nextTaskId++,
    title,
    project: linkedProject.name,
    priority,
    status,
    description: description || '',
    createdAt: new Date().toISOString(),
  }
  if (assignee) task.assignee = assignee
  if (loggedDate) task.loggedDate = String(loggedDate).slice(0, 10)
  if (normalizedDeadline) task.deadline = normalizedDeadline
  if (cleanAttachments.length) task.attachments = cleanAttachments
  if (loggedHours != null && loggedHours !== '') {
    const h = Number(loggedHours)
    if (Number.isFinite(h) && h >= 0) task.loggedHours = h
  }
  tasks.unshift(task)
  writeActivity('task.created', { taskId: task.id, title: task.title, project: task.project, assignee: task.assignee || null })
  await saveDb()
  res.status(201).json(task)
})

app.patch('/api/tasks/:id/status', async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body
  if (!status) return res.status(400).json({ message: 'status is required' })

  const task = tasks.find((item) => item.id === id)
  if (!task) return res.status(404).json({ message: 'task not found' })

  task.status = status
  await saveDb()
  res.json(task)
})

app.patch('/api/tasks/:id', async (req, res) => {
  const id = Number(req.params.id)
  const task = tasks.find((item) => item.id === id)
  if (!task) return res.status(404).json({ message: 'task not found' })

  const { title, project, priority, status, description, assignee, loggedHours, loggedDate, deadline, attachments } = req.body || {}
  const nextProject = project !== undefined ? findProjectByName(project) : findProjectByName(task.project)
  if (!nextProject) return res.status(400).json({ message: 'task must belong to an existing project' })
  const nextAssignee = assignee !== undefined ? assignee : task.assignee
  if (!allowedAssignee(nextProject, nextAssignee)) {
    return res.status(400).json({ message: 'task assignee must be a member of the selected project' })
  }
  const normalizedDeadline = deadline !== undefined ? toIsoDate(deadline) : task.deadline
  if (normalizedDeadline && !isIsoDate(normalizedDeadline)) {
    return res.status(400).json({ message: 'deadline must be YYYY-MM-DD' })
  }

  if (title !== undefined) task.title = title
  if (project !== undefined) task.project = nextProject.name
  if (priority !== undefined) task.priority = priority
  if (status !== undefined) task.status = status
  if (description !== undefined) task.description = description
  if (attachments !== undefined) task.attachments = sanitizeTaskAttachments(attachments)
  if (assignee !== undefined) task.assignee = assignee || null
  if (loggedDate !== undefined) task.loggedDate = loggedDate ? String(loggedDate).slice(0, 10) : null
  if (deadline !== undefined) task.deadline = normalizedDeadline || null
  if (loggedHours !== undefined) {
    if (loggedHours === null || loggedHours === '') delete task.loggedHours
    else {
      const h = Number(loggedHours)
      if (Number.isFinite(h) && h >= 0) task.loggedHours = h
    }
  }
  writeActivity('task.updated', { taskId: task.id, title: task.title, project: task.project })
  await saveDb()
  res.json(task)
})

app.delete('/api/tasks/:id', async (req, res) => {
  const id = Number(req.params.id)
  const idx = tasks.findIndex((item) => item.id === id)
  if (idx === -1) return res.status(404).json({ message: 'task not found' })

  const [removed] = tasks.splice(idx, 1)
  writeActivity('task.deleted', { taskId: id, title: removed?.title || '' })
  await saveDb()
  res.json({ success: true })
})

app.get('/api/employees', (req, res) => {
  res.json(employees.map(sanitizeEmployeeForClient))
})

app.post('/api/employees', async (req, res) => {
  const {
    name,
    email,
    role = 'Employee',
    assignedTasks = 0,
    completedTasks = 0,
    active = true,
    hours = '0h 00m',
  } = req.body
  if (!name) return res.status(400).json({ message: 'name is required' })
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return res.status(400).json({ message: 'email is required' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: 'valid email is required' })
  const normalizedRole = ['Admin', 'Manager', 'Employee'].includes(role) ? role : 'Employee'
  if (employees.some((e) => String(e.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase())) {
    return res.status(400).json({ message: 'employee name must be unique' })
  }
  if (employees.some((e) => String(e.email || '').trim().toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ message: 'employee email must be unique' })
  }

  const tempPassword = generateTemporaryPassword()
  const passwordMeta = createPasswordHash(tempPassword)
  const employee = {
    id: nextEmployeeId++,
    name,
    email: normalizedEmail,
    role: normalizedRole,
    assignedTasks,
    completedTasks,
    active,
    hours,
    passwordHash: passwordMeta.hash,
    passwordSalt: passwordMeta.salt,
    passwordResetRequired: true,
  }
  employees.unshift(employee)
  let emailDelivery = { sent: false, message: 'Email not sent' }
  try {
    emailDelivery = await sendEmployeeWelcomeEmail({
      toEmail: normalizedEmail,
      fullName: name,
      role: normalizedRole,
      tempPassword,
    })
  } catch (error) {
    emailDelivery = { sent: false, message: `Email send failed: ${error.message || 'unknown error'}` }
  }
  writeActivity('employee.created', {
    employeeId: employee.id,
    name: employee.name,
    role: employee.role,
    email: employee.email,
    emailSent: emailDelivery.sent,
  })
  await saveDb()
  res.status(201).json({
    ...sanitizeEmployeeForClient(employee),
    tempPassword: emailDelivery.sent ? undefined : tempPassword,
    emailDelivery,
  })
})

app.patch('/api/employees/:id', async (req, res) => {
  const id = Number(req.params.id)
  const employee = employees.find((e) => e.id === id)
  if (!employee) return res.status(404).json({ message: 'employee not found' })

  const { name, email, role, assignedTasks, completedTasks, active, hours } = req.body || {}
  const prevName = employee.name
  if (name !== undefined) {
    const normalizedName = String(name || '').trim()
    if (!normalizedName) return res.status(400).json({ message: 'name is required' })
    const duplicate = employees.some(
      (e) => e.id !== id && String(e.name || '').trim().toLowerCase() === normalizedName.toLowerCase(),
    )
    if (duplicate) return res.status(400).json({ message: 'employee name must be unique' })
    employee.name = normalizedName
  }
  if (email !== undefined) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) return res.status(400).json({ message: 'email is required' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: 'valid email is required' })
    const duplicateEmail = employees.some(
      (e) => e.id !== id && String(e.email || '').trim().toLowerCase() === normalizedEmail,
    )
    if (duplicateEmail) return res.status(400).json({ message: 'employee email must be unique' })
    employee.email = normalizedEmail
  }
  if (role !== undefined) employee.role = ['Admin', 'Manager', 'Employee'].includes(role) ? role : 'Employee'
  if (assignedTasks !== undefined) employee.assignedTasks = assignedTasks
  if (completedTasks !== undefined) employee.completedTasks = completedTasks
  if (active !== undefined) employee.active = active
  if (hours !== undefined) employee.hours = hours

  if (name !== undefined && String(prevName || '').trim() !== String(employee.name || '').trim()) {
    for (const p of projects) {
      if (!Array.isArray(p.members)) p.members = []
      p.members = p.members.map((memberName) => (memberName === prevName ? employee.name : memberName))
    }
    for (const t of tasks) {
      if (t.assignee === prevName) t.assignee = employee.name
    }
  }
  writeActivity('employee.updated', { employeeId: employee.id, name: employee.name, role: employee.role })
  await saveDb()
  res.json(sanitizeEmployeeForClient(employee))
})

app.delete('/api/employees/:id', async (req, res) => {
  const id = Number(req.params.id)
  const idx = employees.findIndex((e) => e.id === id)
  if (idx === -1) return res.status(404).json({ message: 'employee not found' })

  const [removed] = employees.splice(idx, 1)
  for (const p of projects) {
    if (!Array.isArray(p.members)) p.members = []
    p.members = p.members.filter((memberName) => memberName !== removed.name)
  }
  for (const t of tasks) {
    if (t.assignee === removed.name) t.assignee = null
  }
  writeActivity('employee.deleted', { employeeId: id, name: removed?.name || '' })
  await saveDb()
  res.json({ success: true })
})

app.get('/api/activity', (req, res) => {
  res.json(activityLogs)
})

app.get('/api/notifications', (req, res) => {
  const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true'
  const limitRaw = Number(req.query.limit)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 100
  const rows = unreadOnly ? notifications.filter((item) => !item.read) : notifications
  res.json(rows.slice(0, limit))
})

app.patch('/api/notifications/:id/read', async (req, res) => {
  const id = Number(req.params.id)
  const item = notifications.find((n) => n.id === id)
  if (!item) return res.status(404).json({ message: 'notification not found' })
  item.read = true
  await saveDb()
  return res.json(item)
})

app.patch('/api/notifications/read-all', async (req, res) => {
  let changed = 0
  for (const item of notifications) {
    if (!item.read) {
      item.read = true
      changed += 1
    }
  }
  await saveDb()
  res.json({ success: true, updated: changed })
})

app.patch('/api/notifications/read-many', async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => Number(v)).filter(Number.isFinite) : []
  if (ids.length === 0) return res.status(400).json({ message: 'ids are required' })
  const idSet = new Set(ids)
  let changed = 0
  for (const item of notifications) {
    if (idSet.has(item.id) && !item.read) {
      item.read = true
      changed += 1
    }
  }
  await saveDb()
  res.json({ success: true, updated: changed })
})

app.delete('/api/notifications/:id', async (req, res) => {
  const id = Number(req.params.id)
  const idx = notifications.findIndex((n) => n.id === id)
  if (idx === -1) return res.status(404).json({ message: 'notification not found' })
  notifications.splice(idx, 1)
  await saveDb()
  res.json({ success: true, deleted: 1 })
})

app.delete('/api/notifications', async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => Number(v)).filter(Number.isFinite) : []
  if (ids.length === 0) return res.status(400).json({ message: 'ids are required' })
  const idSet = new Set(ids)
  const before = notifications.length
  for (let i = notifications.length - 1; i >= 0; i -= 1) {
    if (idSet.has(notifications[i].id)) notifications.splice(i, 1)
  }
  const deleted = before - notifications.length
  await saveDb()
  res.json({ success: true, deleted })
})

function reportTaskBucket(status) {
  const s = String(status || '').toLowerCase().trim().replace(/_/g, ' ')
  if (s === 'completed' || s === 'in review') return 'done'
  if (s === 'in progress' || s === 'in_progress' || s === 'doing') return 'inprogress'
  return 'pending'
}

app.get('/api/reports/timesheet', (req, res) => {
  const employeeIdRaw = req.query.employeeId
  const projectIdRaw = req.query.projectId
  const from = req.query.from ? String(req.query.from).slice(0, 10) : ''
  const to = req.query.to ? String(req.query.to).slice(0, 10) : ''

  let empNameFilter = null
  if (employeeIdRaw && employeeIdRaw !== 'all') {
    const id = Number(employeeIdRaw)
    const emp = employees.find((e) => e.id === id)
    if (!emp) return res.status(400).json({ message: 'invalid employee' })
    empNameFilter = emp.name
  }

  let projectNameFilter = null
  if (projectIdRaw && projectIdRaw !== 'all') {
    const id = Number(projectIdRaw)
    const p = projects.find((pr) => pr.id === id)
    if (!p) return res.status(400).json({ message: 'invalid project' })
    projectNameFilter = String(p.name || '').trim()
  }

  function inDateRange(dateValue) {
    if (!from && !to) return true
    const eff = dateValue ? String(dateValue).slice(0, 10) : null
    if (!eff) return false
    if (from && eff < from) return false
    if (to && eff > to) return false
    return true
  }

  const rows = []
  for (const s of trackerSessions) {
    const employeeName = String(s.userName || '').trim() || '—'
    if (empNameFilter && employeeName !== empNameFilter) continue
    if (projectNameFilter && String(s.projectName || '').trim() !== projectNameFilter) continue
    if (!inDateRange(s.endedAt || s.startedAt || s.createdAt)) continue
    rows.push({
      date: String(s.endedAt || s.startedAt || s.createdAt || '').slice(0, 10),
      employee: employeeName,
      project: s.projectName || '—',
      task: s.taskTitle || (s.taskId ? `Task #${s.taskId}` : 'Tracked task'),
      status: 'tracked',
      hours: Math.round(((Number(s.durationSeconds) || 0) / 3600) * 100) / 100,
    })
  }

  if (rows.length === 0) {
    for (const t of tasks) {
      if (empNameFilter && String(t.assignee || '') !== empNameFilter) continue
      if (projectNameFilter && String(t.project || '').trim() !== projectNameFilter) continue
      const effDate = t.loggedDate || (t.createdAt ? String(t.createdAt).slice(0, 10) : null)
      if (!inDateRange(effDate)) continue
      const hasLogged = t.loggedHours != null && t.loggedHours !== ''
      const hoursRaw = Number(t.loggedHours)
      const hours = hasLogged && Number.isFinite(hoursRaw) ? hoursRaw : 1
      rows.push({
        date: effDate,
        employee: t.assignee || '—',
        project: t.project,
        task: t.title,
        status: t.status,
        hours,
      })
    }
  }

  rows.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.task).localeCompare(String(b.task)))
  const totalHours = Math.round(rows.reduce((s, r) => s + r.hours, 0) * 100) / 100

  res.json({
    rows,
    totalHours,
    generatedAt: new Date().toISOString(),
    filters: { employeeId: employeeIdRaw || 'all', projectId: projectIdRaw || 'all', from, to },
  })
})

app.get('/api/reports', (req, res) => {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => reportTaskBucket(t.status) === 'done').length
  const inProgressTasks = tasks.filter((t) => reportTaskBucket(t.status) === 'inprogress').length
  const pendingTasks = tasks.filter((t) => reportTaskBucket(t.status) === 'pending').length
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  res.json([
    { key: 'Total Systems', value: systems.length },
    { key: 'Total Projects', value: projects.length },
    { key: 'Total Tasks', value: totalTasks },
    { key: 'Completed Tasks', value: completedTasks },
    { key: 'In Progress Tasks', value: inProgressTasks },
    { key: 'Pending Tasks', value: pendingTasks },
    { key: 'Completion Rate', value: `${completionRate}%` },
  ])
})

app.post('/api/systems', async (req, res) => {
  const { name, owner, location, status } = req.body

  if (!name || !owner || !location) {
    return res.status(400).json({ message: 'name, owner and location are required' })
  }

  const now = new Date().toISOString()

  const newSystem = {
    id: nextId++,
    name,
    owner,
    location,
    status: status || 'Online',
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: status || 'Online', timestamp: now }],
  }

  systems.unshift(newSystem)
  writeActivity('system.created', { systemId: newSystem.id, name: newSystem.name, status: newSystem.status })
  await saveDb()
  return res.status(201).json(newSystem)
})

app.patch('/api/systems/:id/status', async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body

  if (!status) {
    return res.status(400).json({ message: 'status is required' })
  }

  const system = systems.find((item) => item.id === id)
  if (!system) {
    return res.status(404).json({ message: 'system not found' })
  }

  const now = new Date().toISOString()
  system.status = status
  system.updatedAt = now
  system.statusHistory.unshift({ status, timestamp: now })

  writeActivity('system.status.updated', { systemId: id, name: system.name, status })
  await saveDb()
  return res.json(system)
})

async function start() {
  try {
    await ensureBootstrapped()
  } catch (err) {
    console.error('Failed to connect to Supabase or load data:', err.message || err)
    process.exit(1)
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

if (require.main === module) {
  start()
}

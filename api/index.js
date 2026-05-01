const serverless = require('serverless-http')
const { app, ensureBootstrapped, ensureLoginBootstrap } = require('../server/src/index.js')

const binaryMimeTypes = [
  'application/octet-stream',
  'application/x-msdownload',
  'application/vnd.microsoft.portable-executable',
]

let handler

function requestPath(req) {
  const raw = req.url || req.originalUrl || ''
  return String(raw).split('?')[0] || ''
}

function isHealthPath(req) {
  if (String(req.method || '').toUpperCase() !== 'GET') return false
  const p = requestPath(req)
  return p === '/api/health' || p.endsWith('/api/health') || p === '/health'
}

function isAuthLoginPost(req) {
  if (String(req.method || '').toUpperCase() !== 'POST') return false
  const p = requestPath(req)
  return (
    p === '/api/auth/login' ||
    p.endsWith('/api/auth/login') ||
    p === '/auth/login' ||
    p.endsWith('/auth/login')
  )
}

module.exports = async (req, res) => {
  // Hobby: 10s max — avoid loading all Supabase tables just for uptime checks.
  if (isHealthPath(req)) {
    res.status(200).json({ status: 'ok' })
    return
  }

  try {
    if (isAuthLoginPost(req)) await ensureLoginBootstrap()
    else await ensureBootstrapped()
  } catch (err) {
    console.error('[vercel] Bootstrap failed:', err)
    if (!res.headersSent) {
      res.status(503).json({ message: 'Service unavailable', detail: String(err?.message || err) })
    }
    return
  }
  if (!handler) {
    handler = serverless(app, { binary: binaryMimeTypes })
  }
  const out = handler(req, res)
  if (out && typeof out.then === 'function') await out
  return out
}

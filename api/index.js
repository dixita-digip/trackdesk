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

function isAuthPrecacheGet(req) {
  if (String(req.method || '').toUpperCase() !== 'GET') return false
  const p = requestPath(req)
  return (
    p === '/api/auth/precache' ||
    p.endsWith('/api/auth/precache') ||
    p === '/auth/precache' ||
    p.endsWith('/auth/precache')
  )
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

function isOptions(req) {
  return String(req.method || '').toUpperCase() === 'OPTIONS'
}

async function runHandler(req, res) {
  if (!handler) {
    handler = serverless(app, { binary: binaryMimeTypes })
  }
  const out = handler(req, res)
  if (out && typeof out.then === 'function') await out
  return out
}

module.exports = async (req, res) => {
  if (isHealthPath(req)) {
    res.status(200).json({ status: 'ok' })
    return
  }

  // Warm employees in the background while the user types credentials (overlap with cold start).
  if (isAuthPrecacheGet(req)) {
    try {
      await ensureLoginBootstrap()
    } catch (err) {
      console.error('[vercel] auth precache failed:', err)
    }
    res.status(204).end()
    return
  }

  // CORS preflight must NOT load the entire DB (was causing multi-second / pending POSTs).
  if (isOptions(req)) {
    await runHandler(req, res)
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

  await runHandler(req, res)
}

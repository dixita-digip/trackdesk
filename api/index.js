const serverless = require('serverless-http')
const { app, ensureBootstrapped } = require('../server/src/index.js')

const binaryMimeTypes = [
  'application/octet-stream',
  'application/x-msdownload',
  'application/vnd.microsoft.portable-executable',
]

let handler

function isHealthPath(req) {
  if (String(req.method || '').toUpperCase() !== 'GET') return false
  const path = String(req.url || '').split('?')[0]
  return path === '/api/health' || path.endsWith('/api/health') || path === '/health'
}

module.exports = async (req, res) => {
  // Hobby: 10s max — avoid loading all Supabase tables just for uptime checks.
  if (isHealthPath(req)) {
    res.status(200).json({ status: 'ok' })
    return
  }

  try {
    await ensureBootstrapped()
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
  return handler(req, res)
}

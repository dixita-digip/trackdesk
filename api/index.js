const serverless = require('serverless-http')
const { app, ensureBootstrapped } = require('../server/src/index.js')

const binaryMimeTypes = [
  'application/octet-stream',
  'application/x-msdownload',
  'application/vnd.microsoft.portable-executable',
]

let handler

module.exports = async (req, res) => {
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

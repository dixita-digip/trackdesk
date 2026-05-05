const { BrowserWindow, app, desktopCapturer, screen, ipcMain, powerMonitor } = require('electron')
const { execFile } = require('child_process')
const { existsSync } = require('fs')
const fs = require('fs/promises')
const path = require('path')

// Repo root .env (e.g. d:/Projects/trackdesk/.env), then desktop-tracker/.env, then cwd — later wins
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true })
require('dotenv').config({ path: path.join(process.cwd(), '.env'), override: true })

// Match system-tracking: reduces GPU / capture quirks on Windows
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

/** Rolling window: this many captures, at random times within each hour (not a fixed cadence). */
const HOUR_MS = 60 * 60 * 1000
const MIN_SCREENSHOTS_PER_HOUR = 5
const MAX_SCREENSHOTS_PER_HOUR = 10
const FIRST_CAPTURE_DELAY_MS = 2500
const UPLOAD_PREVIEW_MAX_WIDTH = 1280
let screenshotScheduleTimeoutIds = []
let screenshotInFlight = false
let screenshotsStarted = false
let firstCaptureTimeoutId = null
let syncApiBase = ''
let syncToken = ''
/** BrowserWindow reference for idle alerts */
let mainWindow = null
/** Separate top-level window so the idle alert appears above other apps */
let idleOverlayWindow = null

let rendererTimerRunning = false
let idleWarningLatch = false
let idleSnoozeUntil = 0
let idleCheckIntervalId = null

function getIdleWarningSeconds() {
  const raw = Number(process.env.TRACKER_IDLE_WARNING_SECONDS)
  if (Number.isFinite(raw) && raw >= 15) return Math.min(raw, 3600)
  return 60
}

function getIdleSnoozeMs() {
  const raw = Number(process.env.TRACKER_IDLE_SNOOZE_MS)
  if (Number.isFinite(raw) && raw >= 60000) return Math.min(raw, 3_600_000)
  return 300_000
}

function getIdlePollIntervalMs() {
  const raw = Number(process.env.TRACKER_IDLE_POLL_MS)
  if (Number.isFinite(raw) && raw >= 5000) return Math.min(raw, 120_000)
  return 15_000
}

function getPowerShellExe() {
  if (process.platform !== 'win32') return 'powershell.exe'
  const base = process.env.windir || process.env.SystemRoot || 'C:\\Windows'
  const candidate = path.join(base, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  return existsSync(candidate) ? candidate : 'powershell.exe'
}

/** Packaged apps live in app.asar; spawn must read the script from app.asar.unpacked */
function getWinIdleScriptPath() {
  const inAsar = __dirname.includes('app.asar') && !__dirname.includes('app.asar.unpacked')
  const dir = inAsar ? __dirname.replace('app.asar', 'app.asar.unpacked') : __dirname
  return path.join(dir, 'win-idle.ps1')
}

function getSystemIdleSeconds() {
  try {
    if (typeof powerMonitor.getSystemIdleTime === 'function') {
      let n = powerMonitor.getSystemIdleTime()
      if (!Number.isFinite(n) || n < 0) return 0
      if (n > 100000) n = Math.floor(n / 1000)
      return n
    }
  } catch (e) {
    console.warn('[TrackDesk] Idle detection unavailable:', e?.message || e)
  }
  return 0
}

function getWindowsIdleSecondsPowerShell() {
  return new Promise((resolve) => {
    const scriptPath = getWinIdleScriptPath()
    if (!existsSync(scriptPath)) {
      console.warn('[TrackDesk] Missing win-idle.ps1 at', scriptPath)
      resolve(-1)
      return
    }
    execFile(
      getPowerShellExe(),
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      { windowsHide: true, timeout: 12_000, maxBuffer: 256 },
      (err, stdout) => {
        if (err) {
          if (process.env.TRACKER_IDLE_DEBUG === '1') {
            console.warn('[TrackDesk] win-idle.ps1 failed:', err.message || err)
          }
          resolve(-1)
          return
        }
        const text = String(stdout || '').replace(/^\uFEFF/, '').trim()
        const line = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .pop()
        const m = line && line.match(/-?\d+/)
        const n = m ? parseInt(m[0], 10) : NaN
        if (!Number.isFinite(n) || n < 0) {
          resolve(-1)
          return
        }
        resolve(n)
      },
    )
  })
}

async function getEffectiveIdleSeconds() {
  if (process.platform === 'win32') {
    const winIdle = await getWindowsIdleSecondsPowerShell()
    if (winIdle >= 0) return winIdle
  }
  return getSystemIdleSeconds()
}

function tickIdleMonitor() {
  void tickIdleMonitorAsync()
}

function getIdleResumeSnoozeMs() {
  const n = Number(process.env.TRACKER_IDLE_RESUME_SNOOZE_MS)
  if (Number.isFinite(n) && n >= 60_000) return Math.min(n, 3_600_000)
  return 90_000
}

function applyIdleSnooze(ms) {
  const n = Number(ms)
  const duration = Number.isFinite(n) && n >= 60_000 ? Math.min(n, 3_600_000) : getIdleSnoozeMs()
  idleSnoozeUntil = Date.now() + duration
  idleWarningLatch = false
}

function closeIdleOverlayWindow() {
  if (idleOverlayWindow && !idleOverlayWindow.isDestroyed()) {
    idleOverlayWindow.removeAllListeners('closed')
    idleOverlayWindow.close()
  }
  idleOverlayWindow = null
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(false)
  }
}

function openIdleOverlayWindow(detail) {
  closeIdleOverlayWindow()
  const width = 420
  const height = 300
  idleOverlayWindow = new BrowserWindow({
    width,
    height,
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#ffffff',
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'idle-overlay-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  try {
    idleOverlayWindow.setAlwaysOnTop(true, 'screen-saver')
  } catch {
    idleOverlayWindow.setAlwaysOnTop(true)
  }

  if (process.platform === 'darwin') {
    try {
      idleOverlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    } catch {
      /* ignore */
    }
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    const bounds = mainWindow.getBounds()
    const display = screen.getDisplayMatching(bounds)
    const wa = display.workArea
    const x = wa.x + Math.floor((wa.width - width) / 2)
    const y = wa.y + Math.floor((wa.height - height) / 2)
    idleOverlayWindow.setPosition(x, y)
  }

  idleOverlayWindow.loadFile(path.join(__dirname, 'idle-overlay.html'))

  idleOverlayWindow.once('ready-to-show', () => {
    if (idleOverlayWindow && !idleOverlayWindow.isDestroyed()) {
      idleOverlayWindow.show()
      idleOverlayWindow.focus()
    }
  })

  idleOverlayWindow.webContents.once('did-finish-load', () => {
    if (idleOverlayWindow && !idleOverlayWindow.isDestroyed()) {
      idleOverlayWindow.webContents.send('idle-overlay:payload', detail || {})
    }
  })

  idleOverlayWindow.on('closed', () => {
    idleOverlayWindow = null
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(false)
    }
  })
}

async function tickIdleMonitorAsync() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (!rendererTimerRunning) {
    idleWarningLatch = false
    return
  }
  if (Date.now() < idleSnoozeUntil) return

  let idleSec = 0
  try {
    idleSec = await getEffectiveIdleSeconds()
  } catch {
    return
  }

  if (idleSec < 3) idleWarningLatch = false

  const threshold = getIdleWarningSeconds()
  if (idleSec < threshold) return
  if (idleWarningLatch) return

  idleWarningLatch = true
  if (!mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('tracker:system-idle', {
      idleSeconds: idleSec,
      thresholdSeconds: threshold,
    })
    openIdleOverlayWindow({
      idleSeconds: idleSec,
      thresholdSeconds: threshold,
    })
  }
}

function startIdleMonitor() {
  if (idleCheckIntervalId) return
  tickIdleMonitor()
  idleCheckIntervalId = setInterval(tickIdleMonitor, getIdlePollIntervalMs())
}

function stopIdleMonitor() {
  if (idleCheckIntervalId) {
    clearInterval(idleCheckIntervalId)
    idleCheckIntervalId = null
  }
  idleWarningLatch = false
}


function getScreenshotsDir() {
  return path.join(app.getPath('userData'), 'screenshots')
}

function resizeForUpload(img) {
  if (!img || img.isEmpty()) return img
  const { width, height } = img.getSize()
  if (width <= UPLOAD_PREVIEW_MAX_WIDTH) return img
  const nextW = UPLOAD_PREVIEW_MAX_WIDTH
  const nextH = Math.max(1, Math.round((UPLOAD_PREVIEW_MAX_WIDTH / width) * height))
  return img.resize({ width: nextW, height: nextH, quality: 'good' })
}

function isCloudinaryConfigured() {
  return Boolean(
    String(process.env.CLOUDINARY_CLOUD_NAME || '').trim() &&
      String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim(),
  )
}

/** Default folder unless CLOUDINARY_FOLDER is explicitly empty (omit param for preset-only folder). */
function getCloudinaryFolder() {
  if (!Object.prototype.hasOwnProperty.call(process.env, 'CLOUDINARY_FOLDER')) {
    return 'trackdesk/screenshots'
  }
  const v = String(process.env.CLOUDINARY_FOLDER ?? '').trim()
  return v || null
}

function sanitizeCloudinaryPublicId(raw) {
  const s = String(raw || 'capture')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return (s || 'capture').slice(0, 100)
}

/**
 * Unsigned upload (same pattern as system-tracking). Create an upload preset in Cloudinary
 * (Settings → Upload → Upload presets) with signing mode "Unsigned".
 */
async function uploadPngToCloudinary(pngBuffer, publicIdBase) {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim()
  const uploadPreset = String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim()
  if (!cloudName || !uploadPreset) return null

  const folder = getCloudinaryFolder()
  const publicId = sanitizeCloudinaryPublicId(publicIdBase)
  const form = new FormData()
  // Multipart binary upload (Buffer is a valid BlobPart in Node / Electron)
  const blob = new Blob([pngBuffer], { type: 'image/png' })
  form.append('file', blob, 'trackdesk-capture.png')
  form.append('upload_preset', uploadPreset)
  if (folder) form.append('folder', folder)
  form.append('public_id', publicId)

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    })
    const text = await res.text()
    if (!res.ok) {
      console.warn('[TrackDesk] Cloudinary HTTP', res.status, text.slice(0, 500))
      try {
        const errJson = JSON.parse(text)
        if (errJson?.error?.message) console.warn('[TrackDesk] Cloudinary:', errJson.error.message)
      } catch {
        /* not JSON */
      }
      return null
    }
    const json = JSON.parse(text)
    const url = json?.secure_url || null
    if (!url) console.warn('[TrackDesk] Cloudinary: missing secure_url in response')
    return url
  } catch (e) {
    console.warn('[TrackDesk] Cloudinary upload failed:', e?.message || e)
    return null
  }
}

/** Same sizing strategy as system-tracking/src/main/services/screenshotService.js */
function getThumbnailSizeForPrimaryCapture() {
  const primary = screen.getPrimaryDisplay()
  const { width, height } = primary.size
  const scale = primary.scaleFactor || 1
  const w = Math.min(Math.max(320, Math.ceil(width * scale)), 3840)
  const h = Math.min(Math.max(240, Math.ceil(height * scale)), 2160)
  return { width: w, height: h }
}

async function fetchScreenSources(thumbnailSize) {
  return desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize,
    fetchWindowIcons: false,
  })
}

function preferSourceForDisplay(sources, display) {
  const idStr = String(display.id)
  const exact = sources.find((s) => String(s.display_id) === idStr)
  if (exact) return exact
  return (
    sources.find((s) => s.display_id && idStr.includes(String(s.display_id))) ||
    sources.find((s) => s.display_id && String(s.display_id).includes(idStr)) ||
    null
  )
}

function firstNonEmptyThumbnail(sourcesOrdered) {
  for (const s of sourcesOrdered) {
    if (s.thumbnail && !s.thumbnail.isEmpty()) return s
  }
  return null
}

/**
 * For one logical display, pick a source with a non-empty thumbnail — retries smaller
 * thumbnailSize values when Windows returns empty buffers (common without fallbacks).
 */
async function resolveSourceForDisplay(display) {
  const thumbPrimary = getThumbnailSizeForPrimaryCapture()
  const trySizes = [thumbPrimary, { width: 1920, height: 1080 }, { width: 1280, height: 720 }, { width: 800, height: 600 }]

  for (const size of trySizes) {
    const sources = await fetchScreenSources(size)
    if (!sources.length) continue

    const preferred = preferSourceForDisplay(sources, display)
    const ordered = preferred ? [preferred, ...sources.filter((s) => s.id !== preferred.id)] : [...sources]

    const picked = firstNonEmptyThumbnail(ordered)
    if (picked) return picked
  }

  return null
}

async function uploadScreenCapturesToApi(captures, capturedAt) {
  const base = String(syncApiBase || '')
    .trim()
    .replace(/\/+$/, '')
  const token = String(syncToken || '').trim()
  if (!base || !token || !captures?.length) {
    if (captures?.length && (!base || !token)) {
      console.warn('[TrackDesk] Screen captures saved locally; sign in to the tracker to sync previews to the server.')
    }
    return
  }
  try {
    const res = await fetch(`${base}/tracker/screenshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        captures: captures.map((c) => ({ ...c, capturedAt })),
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[TrackDesk] Screenshot upload failed:', res.status, err?.message || '')
    }
  } catch (e) {
    console.warn('[TrackDesk] Screenshot upload error:', e?.message || e)
  }
}

async function captureAllDisplaysToFilesAndSync() {
  const displays = screen.getAllDisplays()
  if (!displays.length) {
    console.warn('[TrackDesk] No displays found for capture')
    return
  }

  const dir = getScreenshotsDir()
  await fs.mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const capturedAt = new Date().toISOString()
  const uploadPayload = []
  const usedSourceIds = new Set()

  for (let di = 0; di < displays.length; di += 1) {
    const display = displays[di]
    const source = await resolveSourceForDisplay(display)
    if (!source) {
      console.warn(
        `[TrackDesk] No capture for display ${di} — if thumbnails stay empty, check Windows Settings → Privacy → Captures for this app`
      )
      continue
    }
    if (usedSourceIds.has(source.id)) continue
    usedSourceIds.add(source.id)

    const fullPng = source.thumbnail.toPNG()
    const name = `screen-${stamp}-display${di}.png`
    await fs.writeFile(path.join(dir, name), fullPng)

    const forUpload = resizeForUpload(source.thumbnail)
    const png = forUpload && !forUpload.isEmpty() ? forUpload.toPNG() : fullPng
    const idBase = `td-${stamp}-d${di}`
    let apiEntry = null
    if (isCloudinaryConfigured()) {
      const imageUrl = await uploadPngToCloudinary(png, idBase)
      if (imageUrl) apiEntry = { displayIndex: di, imageUrl }
      else console.warn('[TrackDesk] Cloudinary failed for display', di, '— using base64 to API.')
    }
    if (!apiEntry) {
      apiEntry = { displayIndex: di, imageBase64: png.toString('base64') }
    }
    uploadPayload.push(apiEntry)
  }

  if (uploadPayload.length) {
    console.log(`[TrackDesk] Saved ${uploadPayload.length} screen capture(s) →`, getScreenshotsDir())
  } else {
    console.warn(
      '[TrackDesk] No screen captures produced — thumbnails were empty. On Windows 11: Settings → Privacy & security → Captures (and screen recording if listed).'
    )
  }

  await uploadScreenCapturesToApi(uploadPayload, capturedAt)
}

async function runScreenshotTick() {
  if (screenshotInFlight) return
  screenshotInFlight = true
  try {
    await captureAllDisplaysToFilesAndSync()
  } catch (err) {
    console.error('[TrackDesk] Screenshot failed:', err)
  } finally {
    screenshotInFlight = false
  }
}

function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function clearScreenshotScheduleTimeouts() {
  for (const id of screenshotScheduleTimeoutIds) {
    clearTimeout(id)
  }
  screenshotScheduleTimeoutIds = []
}

/**
 * Schedule MIN..MAX captures at uniformly random offsets within the next hour, then repeat.
 * Times are not evenly spaced — only the count per hour is bounded.
 */
function scheduleRandomCapturesWithinHour() {
  const n = randomIntInclusive(MIN_SCREENSHOTS_PER_HOUR, MAX_SCREENSHOTS_PER_HOUR)
  const offsets = []
  for (let i = 0; i < n; i += 1) {
    offsets.push(Math.random() * HOUR_MS)
  }
  offsets.sort((a, b) => a - b)

  for (const offsetMs of offsets) {
    const id = setTimeout(() => {
      screenshotScheduleTimeoutIds = screenshotScheduleTimeoutIds.filter((t) => t !== id)
      void runScreenshotTick()
    }, offsetMs)
    screenshotScheduleTimeoutIds.push(id)
  }

  const chainId = setTimeout(() => {
    screenshotScheduleTimeoutIds = screenshotScheduleTimeoutIds.filter((t) => t !== chainId)
    scheduleRandomCapturesWithinHour()
  }, HOUR_MS)
  screenshotScheduleTimeoutIds.push(chainId)

  console.log(
    `[TrackDesk] Scheduled ${n} random screen capture(s) over the next ~60 minutes (then a new random plan).`,
  )
}

function setPeriodicScreenshots(enabled) {
  if (firstCaptureTimeoutId) {
    clearTimeout(firstCaptureTimeoutId)
    firstCaptureTimeoutId = null
  }
  clearScreenshotScheduleTimeouts()
  if (!enabled) return
  firstCaptureTimeoutId = setTimeout(() => {
    firstCaptureTimeoutId = null
    scheduleRandomCapturesWithinHour()
  }, FIRST_CAPTURE_DELAY_MS)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 538,
    minWidth: 380,
    minHeight: 560,
    title: 'TrackDesk Tracker',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  mainWindow.on('closed', () => {
    closeIdleOverlayWindow()
  })
  mainWindow.webContents.once('did-finish-load', () => {
    if (screenshotsStarted) return
    screenshotsStarted = true
    setPeriodicScreenshots(true)
  })
}

app.whenReady().then(() => {
  if (isCloudinaryConfigured()) {
    const fd = getCloudinaryFolder()
    const cloud = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim()
    console.log(
      '[TrackDesk] Cloudinary OK — cloud:',
      cloud.slice(0, 6) + (cloud.length > 6 ? '…' : ''),
      'folder:',
      fd || '(preset default only)',
    )
  } else {
    console.log(
      '[TrackDesk] Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in',
      path.join(__dirname, '..', '.env'),
      'or',
      path.join(__dirname, '.env'),
    )
  }

  ipcMain.handle('tracker:set-sync-credentials', (_event, payload) => {
    syncApiBase = String(payload?.apiBase || '')
      .trim()
      .replace(/\/+$/, '')
    syncToken = String(payload?.token || '').trim()
    return { ok: true }
  })

  ipcMain.on('tracker:timer-running', (_event, running) => {
    rendererTimerRunning = Boolean(running)
    if (!rendererTimerRunning) idleWarningLatch = false
  })

  ipcMain.on('tracker:idle-modal-closed', () => {
    closeIdleOverlayWindow()
  })

  ipcMain.on('tracker:idle-snooze', (_event, ms) => {
    applyIdleSnooze(ms)
  })

  ipcMain.on('idle-overlay:dismiss', () => {
    closeIdleOverlayWindow()
  })

  ipcMain.on('idle-overlay:resume', () => {
    closeIdleOverlayWindow()
    applyIdleSnooze(getIdleResumeSnoozeMs())
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tracker:idle-overlay-resume')
    }
  })

  createWindow()
  startIdleMonitor()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  closeIdleOverlayWindow()
  stopIdleMonitor()
  setPeriodicScreenshots(false)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

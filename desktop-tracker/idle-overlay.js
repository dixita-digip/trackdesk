const messageEl = document.getElementById('idleMessage')
const resumeBtn = document.getElementById('resumeBtn')
const dismissBtn = document.getElementById('dismissBtn')

function formatActivityPhrase(thresholdSeconds) {
  const th = Math.max(1, Math.floor(Number(thresholdSeconds) || 60))
  if (th < 90) return 'one minute'
  if (th < 3600) {
    const m = Math.round(th / 60)
    return `${m} minutes`
  }
  const h = Math.round(th / 3600)
  return `${h} hour${h === 1 ? '' : 's'}`
}

function applyPayload(detail) {
  if (!messageEl) return
  const phrase = formatActivityPhrase(detail?.thresholdSeconds)
  messageEl.textContent = `No keyboard or mouse activity was detected for ${phrase}. Your running timer has been stopped automatically.`
}

if (window.idleOverlay?.onPayload) {
  window.idleOverlay.onPayload((detail) => {
    applyPayload(detail || {})
  })
}

resumeBtn?.addEventListener('click', () => {
  window.idleOverlay?.resume()
})

dismissBtn?.addEventListener('click', () => {
  window.idleOverlay?.dismiss()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    window.idleOverlay?.dismiss()
  }
})

resumeBtn?.focus()

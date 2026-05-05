const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('trackerApp', {
  version: '1.0.0',
  setSyncCredentials(payload) {
    return ipcRenderer.invoke('tracker:set-sync-credentials', payload)
  },
  setTimerRunningForIdle(running) {
    ipcRenderer.send('tracker:timer-running', Boolean(running))
  },
  notifyIdleModalClosed() {
    ipcRenderer.send('tracker:idle-modal-closed')
  },
  idleSnooze(ms) {
    ipcRenderer.send('tracker:idle-snooze', ms)
  },
  onSystemIdle(callback) {
    const handler = (_event, detail) => {
      try {
        callback(detail || {})
      } catch {
        /* ignore */
      }
    }
    ipcRenderer.on('tracker:system-idle', handler)
    return () => ipcRenderer.removeListener('tracker:system-idle', handler)
  },
  onIdleOverlayResume(callback) {
    const handler = () => {
      try {
        callback()
      } catch {
        /* ignore */
      }
    }
    ipcRenderer.on('tracker:idle-overlay-resume', handler)
    return () => ipcRenderer.removeListener('tracker:idle-overlay-resume', handler)
  },
})

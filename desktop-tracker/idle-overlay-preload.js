const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('idleOverlay', {
  dismiss() {
    ipcRenderer.send('idle-overlay:dismiss')
  },
  resume() {
    ipcRenderer.send('idle-overlay:resume')
  },
  onPayload(callback) {
    const handler = (_event, payload) => {
      try {
        callback(payload || {})
      } catch {
        /* ignore */
      }
    }
    ipcRenderer.on('idle-overlay:payload', handler)
    return () => ipcRenderer.removeListener('idle-overlay:payload', handler)
  },
})

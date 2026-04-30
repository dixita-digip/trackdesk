const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('trackerApp', {
  version: '1.0.0',
})

import { app, BrowserWindow, ipcMain, Notification } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'BoardCraft',
    icon: path.join(process.env.APP_ROOT, 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
  })

  // Set Content Security Policy for safety in production
  if (!VITE_DEV_SERVER_URL) {
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://accounts.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.gstatic.com"]
        }
      })
    })
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`RENDERER: ${message} (at ${sourceId}:${line})`)
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(() => {
  createWindow()
  
  // Set app to run at startup
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe')
  })
})

// Sample IPC handler if needed later
ipcMain.handle('ping', () => 'pong')

// Handle native notifications
ipcMain.on('show-notification', (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
})

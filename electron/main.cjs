const { app, BrowserWindow, protocol, net, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

// O build do Vite usa caminhos absolutos ("/assets/..."), que não funcionam em file://.
// Servimos o dist/ por um protocolo próprio (app://game/), que também conta como origem segura.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
])

const DIST = path.join(__dirname, '..', 'dist')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  win.setMenuBarVisibility(false)
  // links externos (ex.: player de música) abrem no navegador, não numa janela do Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_DEV_URL) win.loadURL(process.env.ELECTRON_DEV_URL)
  else win.loadURL('app://game/index.html')
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url)
    const file = path.join(DIST, pathname === '/' ? 'index.html' : decodeURIComponent(pathname))
    if (!file.startsWith(DIST)) return new Response('forbidden', { status: 403 })
    return net.fetch(pathToFileURL(file).toString())
  })
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

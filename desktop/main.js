const http = require('http');
const path = require('path');
const { app, BrowserWindow, shell } = require('electron');
const handler = require('serve-handler');

let server = null;
let mainWindow = null;

const PORT = 8081;
const HOST = '127.0.0.1';

// 1. Loopback Static Server for compiled Expo web bundle (dist/)
function startLocalServer() {
  return new Promise((resolve) => {
    const distPath = path.join(__dirname, '../dist');

    server = http.createServer((request, response) => {
      return handler(request, response, {
        public: distPath,
        rewrites: [{ source: '**', destination: '/index.html' }],
        cleanUrls: true,
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Desktop] Port ${PORT} already active, connecting to existing instance.`);
        resolve(true);
      } else {
        console.error('[Desktop] Server error:', err);
        resolve(false);
      }
    });

    server.listen(PORT, HOST, () => {
      console.log(`[Desktop] AMG OTP Hub local origin active at http://${HOST}:${PORT}`);
      resolve(true);
    });
  });
}

// 2. Main Application Window
function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 680,
    title: 'AMG OTP Hub',
    icon: iconPath,
    autoHideMenuBar: true,
    backgroundColor: '#07101d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Windows Native Anti-Screenshot Protection (blocks screen captures & snipping)
  if (typeof mainWindow.setContentProtection === 'function') {
    mainWindow.setContentProtection(true);
  }

  mainWindow.loadURL(`http://${HOST}:${PORT}`);

  // Safe link handling: allow Google OAuth redirects, open general links externally
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('https://accounts.google.com') ||
      url.startsWith('https://oauth2.googleapis.com') ||
      url.includes('google.com')
    ) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const parsedUrl = new URL(url);
      const isLocal = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === HOST;
      const isGoogleOAuth =
        parsedUrl.hostname.endsWith('google.com') || parsedUrl.hostname.endsWith('googleapis.com');

      if (!isLocal && !isGoogleOAuth) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {
      // ignore
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await startLocalServer();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      try {
        server.close();
      } catch {}
    }
    app.quit();
  }
});

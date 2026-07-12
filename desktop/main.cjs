const { app, BrowserWindow, Menu, desktopCapturer, shell } = require('electron');
const path = require('node:path');
const config = require('./config.json');

app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');

const requestedUrl = process.argv.find(argument => argument.startsWith('--app-url='))?.slice('--app-url='.length);
const baseUrl = new URL(process.env.VIDEO_ROOM_APP_URL || requestedUrl || config.appUrl);
baseUrl.search = '';
baseUrl.hash = '';

const appOrigin = baseUrl.origin;
const appBasePath = baseUrl.pathname.replace(/\/+$/, '');
const desktopPath = `${appBasePath}/desktop`;
const loginPath = `${appBasePath}/login`;
const desktopUrl = new URL(desktopPath, appOrigin).href;

if (baseUrl.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname)) {
  throw new Error('PF Video Room requires HTTPS for non-local frontend URLs.');
}

const isTrustedUrl = value => {
  try {
    return new URL(value).origin === appOrigin;
  } catch {
    return false;
  }
};

const isAllowedAppRoute = value => {
  try {
    const url = new URL(value);
    return url.origin === appOrigin && (url.pathname === loginPath || url.pathname.startsWith(desktopPath));
  } catch {
    return false;
  }
};

const showLoadError = (mainWindow, message) => {
  const safeMessage = String(message).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const errorPage = `<!doctype html><html><head><meta charset="utf-8"><title>PF Video Room</title>
    <style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#070b16;color:#eef4ff;font-family:Segoe UI,sans-serif}.card{width:min(520px,calc(100% - 48px));padding:36px;border:1px solid #263149;border-radius:22px;background:#111827;text-align:center}h1{margin:0 0 12px}p{color:#a9b5ca;line-height:1.6}code{color:#7dd3fc}</style>
    </head><body><main class="card"><h1>Video Room could not connect</h1><p>${safeMessage}</p><p>Start the learning platform with <code>npm run dev</code>, then reopen PF Video Room.</p></main></body></html>`;
  mainWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(errorPage)}`);
};

const chooseDisplaySource = async (request, callback, ownerWindow) => {
  if (!isTrustedUrl(request.securityOrigin)) {
    callback({});
    return;
  }

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      fetchWindowIcons: true,
      thumbnailSize: { width: 0, height: 0 }
    });

    let completed = false;
    const finish = source => {
      if (completed) return;
      completed = true;
      callback(source ? {
        video: source,
        ...(request.audioRequested && process.platform === 'win32' ? { audio: 'loopback' } : {})
      } : {});
    };

    if (sources.length === 0) {
      finish(null);
      return;
    }

    const menu = Menu.buildFromTemplate([
      { label: 'Choose what to share', enabled: false },
      { type: 'separator' },
      ...sources.map(source => ({ label: source.name, click: () => finish(source) })),
      { type: 'separator' },
      { label: 'Cancel', click: () => finish(null) }
    ]);
    menu.popup({ window: ownerWindow, callback: () => finish(null) });
  } catch (error) {
    console.error('Unable to show screen-share sources:', error);
    callback({});
  }
};

const configurePermissions = mainWindow => {
  const appSession = mainWindow.webContents.session;
  const allowedPermissions = new Set(['media', 'display-capture', 'fullscreen']);

  appSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => (
    isTrustedUrl(requestingOrigin) && allowedPermissions.has(permission)
  ));
  appSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(isTrustedUrl(webContents.getURL()) && allowedPermissions.has(permission));
  });
  appSession.setDisplayMediaRequestHandler((request, callback) => {
    chooseDisplaySource(request, callback, mainWindow);
  }, { useSystemPicker: true });
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    title: 'PF Video Room',
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: '#070b16',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  configurePermissions(mainWindow);

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!isAllowedAppRoute(navigationUrl)) {
      event.preventDefault();
      if (navigationUrl.startsWith('https://')) shell.openExternal(navigationUrl);
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (isMainFrame && validatedUrl === desktopUrl) {
      showLoadError(mainWindow, `${errorDescription} (${errorCode})`);
    }
  });
  mainWindow.loadURL(desktopUrl);

  return mainWindow;
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

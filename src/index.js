const { app, BrowserWindow, Tray, nativeImage, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const Positioner = require('electron-positioner')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let tray;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 350,
    height: 950,
    frame: false,
    // resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });


  // Hide the window when it loses focus
  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Init system tray
  tray = new Tray(path.join(__dirname, 'assets/icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Control Center', click: () => toggleWindow(mainWindow) },
    { label: 'Monitor: CPU', type: 'radio', enabled: true, click: () => mainWindow.webContents.send('monitor:cpu') },
    { label: 'Monitor: RAM', type: 'radio', enabled: true, click: () => mainWindow.webContents.send('monitor:ram') },
    { label: 'Monitor: Pause', type: 'radio', enabled: true, click: () => mainWindow.webContents.send('monitor:pause') },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('BlinkStick Control Center');
  tray.setContextMenu(contextMenu);

  // Make app window only visible on tray icon click
  tray.on('click', (event, bounds) => {
    toggleWindow(mainWindow);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('app:close', (e) => {
  app.quit();
});

// Functions for positioning the app properly near tray icon
function toggleWindow(window) {
  window.isVisible() ? window.hide() : showWindow(window);
}

function showWindow(window) {
  // Position the app window cleanly below tray icon

  const positioner = new Positioner(window);
  positioner.move('rightCenter');
  window.show();
}

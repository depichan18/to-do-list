const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Database file path
const dataPath = path.join(__dirname, 'data.json');
const calendarDataPath = path.join(__dirname, 'calendar-data.json');

// Initialize data file if it doesn't exist
function initializeDataFile() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ tasks: [] }, null, 2));
  }
}

// Initialize calendar data file if it doesn't exist
function initializeCalendarDataFile() {
  if (!fs.existsSync(calendarDataPath)) {
    fs.writeFileSync(calendarDataPath, JSON.stringify({}, null, 2));
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

// IPC handlers for database operations
ipcMain.handle('load-tasks', async () => {
  try {
    initializeDataFile();
    const data = fs.readFileSync(dataPath, 'utf8');
    const parsedData = JSON.parse(data);
    return parsedData.tasks || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
});

ipcMain.handle('save-tasks', async (event, tasks) => {
  try {
    // Save to main data.json
    const data = { tasks, lastModified: new Date().toISOString() };
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    // Also save to calendar data for today
    const today = getTodayDateString();
    await saveTasksByDateInternal(today, tasks);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving tasks:', error);
    return { success: false, error: error.message };
  }
});

// Calendar-specific handlers
ipcMain.handle('load-tasks-by-date', async (event, date) => {
  try {
    initializeCalendarDataFile();
    const data = fs.readFileSync(calendarDataPath, 'utf8');
    const parsedData = JSON.parse(data);
    return parsedData[date] || [];
  } catch (error) {
    console.error('Error loading tasks by date:', error);
    return [];
  }
});

ipcMain.handle('save-tasks-by-date', async (event, date, tasks) => {
  try {
    return await saveTasksByDateInternal(date, tasks);
  } catch (error) {
    console.error('Error saving tasks by date:', error);
    return { success: false, error: error.message };
  }
});

async function saveTasksByDateInternal(date, tasks) {
  initializeCalendarDataFile();
  const data = fs.readFileSync(calendarDataPath, 'utf8');
  const parsedData = JSON.parse(data);
  parsedData[date] = tasks;
  fs.writeFileSync(calendarDataPath, JSON.stringify(parsedData, null, 2));
  return { success: true };
}

ipcMain.handle('get-all-dates-with-tasks', async () => {
  try {
    initializeCalendarDataFile();
    const data = fs.readFileSync(calendarDataPath, 'utf8');
    const parsedData = JSON.parse(data);
    return Object.keys(parsedData).filter(date => parsedData[date].length > 0);
  } catch (error) {
    console.error('Error getting dates with tasks:', error);
    return [];
  }
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Kuromi ToDo List!', // Mengatur judul window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

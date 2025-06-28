// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const dataPath = path.join(__dirname, 'data.json');

contextBridge.exposeInMainWorld('electronAPI', {
  loadTasks: () => {
    try {
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
      }
      return { tasksByDate: {} };
    } catch (error) {
      console.error('Error loading tasks:', error);
      return { tasksByDate: {} };
    }
  },
  
  saveTasks: (data) => {
    try {
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error);
      return false;
    }
  }
});

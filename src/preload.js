// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadTasks: () => ipcRenderer.invoke('load-tasks'),
  saveTasks: (tasks) => ipcRenderer.invoke('save-tasks', tasks),
  loadTasksByDate: (date) => ipcRenderer.invoke('load-tasks-by-date', date),
  saveTasksByDate: (date, tasks) => ipcRenderer.invoke('save-tasks-by-date', date, tasks),
  getAllDatesWithTasks: () => ipcRenderer.invoke('get-all-dates-with-tasks')
});

// Wait for DOM to be ready before getting elements
// --- DOM Elements ---
let taskInput, taskList, dateDisplay, resetBtn, calendarBtn, calendarModal, calendarCloseBtn;

function getElements() {
  taskInput = document.getElementById('taskInput');
  taskList = document.getElementById('taskList');
  dateDisplay = document.getElementById('dateDisplay');
  resetBtn = document.getElementById('resetBtn');
  calendarBtn = document.getElementById('calendarBtn');
  calendarModal = document.getElementById('calendarModal');
  calendarCloseBtn = document.querySelector('.close');
}

function setupEventListeners() {
  if (taskInput) {
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm("Yakin ingin menghapus semua tugas?")) {
        tasks = [];
        await saveTasks();
        renderTasks();
        setTimeout(() => { if (taskInput) taskInput.focus(); }, 10);
      }
    });
  }
  if (calendarBtn && calendarModal) {
    calendarBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await loadDatesWithTasks();
      renderCalendar();
      calendarModal.style.display = 'block';
    });
  }
  if (calendarCloseBtn && calendarModal) {
    calendarCloseBtn.addEventListener('click', () => {
      calendarModal.style.display = 'none';
    });
  }
  if (calendarModal) {
    window.addEventListener('click', (event) => {
      if (event.target === calendarModal) {
        calendarModal.style.display = 'none';
      }
    });
  }
}

let tasks = [];

// Load tasks from database on startup
async function loadTasks() {
  try {
    tasks = await window.electronAPI.loadTasks();
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasks = [];
  }
}

// Helper: get local date string in YYYY-MM-DD
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function saveTasks() {
  try {
    await window.electronAPI.saveTasks(tasks);
    // Save to calendar-data.json for today (local date)
    const today = getLocalDateString();
    await window.electronAPI.saveTasksByDate(today, tasks);
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.classList.add('task-item');

    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', async () => {
      task.done = checkbox.checked;
      await saveTasks();
      renderTasks();
    });

    const taskSpan = document.createElement('span');
    taskSpan.textContent = task.text;
    taskSpan.classList.add('task-text');
    if (task.done) taskSpan.classList.add('done');

    taskSpan.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.text;
      input.className = 'task-edit-input';
      taskContent.replaceChild(input, taskSpan);
      input.focus();

      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          task.text = input.value.trim();
          await saveTasks();
          renderTasks();
        }
      });

      input.addEventListener('blur', () => renderTasks());
    });

    const note = document.createElement('div');
    note.textContent = task.note || '📝 add note...';
    note.classList.add('task-note');
    note.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.note || '';
      input.className = 'task-note-input';
      rightSide.replaceChild(input, note);
      input.focus();

      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          task.note = input.value.trim();
          await saveTasks();
          renderTasks();
        }
      });

      input.addEventListener('blur', () => renderTasks());
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', async () => {
      tasks.splice(index, 1);
      await saveTasks();
      renderTasks();
    });

    const rightSide = document.createElement('div');
    rightSide.classList.add('task-actions');
    rightSide.appendChild(note);
    rightSide.appendChild(deleteBtn);

    taskContent.appendChild(checkbox);
    taskContent.appendChild(taskSpan);

    li.appendChild(taskContent);
    li.appendChild(rightSide);

    taskList.appendChild(li);
  });
}

async function addTask() {
  const text = taskInput ? taskInput.value.trim() : '';
  if (text === '') return;

  const newTask = { 
    text, 
    done: false, 
    note: '',
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  await saveTasks();
  renderTasks();
  if (taskInput) taskInput.value = '';
  
  // Ensure focus returns to input after adding task (Windows compatibility)
  setTimeout(() => {
    if (taskInput) taskInput.focus();
  }, 10);
}

function updateDate() {
  console.log('Updating date...');
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  
  const dateDisplayElement = document.getElementById('dateDisplay');
  console.log('Date display element:', dateDisplayElement);
  
  if (dateDisplayElement) {
    dateDisplayElement.textContent = `${dayName}, ${dateStr}`;
    console.log('Date updated to:', `${dayName}, ${dateStr}`);
  } else {
    console.error('Date display element not found!');
  }
}

// --- Initialization ---
async function initApp() {
  getElements();
  setupEventListeners();
  await loadTasks();
  updateDate();
  setTimeout(() => { initializeCalendar(); }, 100);
  setTimeout(() => { if (taskInput) taskInput.focus(); }, 150);
}

// --- Call initApp after DOMContentLoaded ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Calendar functionality
let currentDate = new Date();
let selectedDate = null;
let datesWithTasks = [];

function initializeCalendar() {
  console.log('Initializing calendar...');
  
  const calendarBtn = document.getElementById('calendarBtn');
  const modal = document.getElementById('calendarModal');
  const closeBtn = document.querySelector('.close');
  
  console.log('Calendar button:', calendarBtn);
  console.log('Modal:', modal);
  console.log('Close button:', closeBtn);
  
  if (!calendarBtn) {
    console.error('Calendar button not found!');
    return;
  }
  
  if (!modal) {
    console.error('Calendar modal not found!');
    return;
  }
  
  calendarBtn.addEventListener('click', async (e) => {
    console.log('Calendar button clicked!');
    e.preventDefault();
    await loadDatesWithTasks();
    renderCalendar();
    modal.style.display = 'block';
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  console.log('Calendar initialized successfully!');
}

async function loadDatesWithTasks() {
  try {
    datesWithTasks = await window.electronAPI.getAllDatesWithTasks();
  } catch (error) {
    console.error('Error loading dates with tasks:', error);
    datesWithTasks = [];
  }
}

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  // Create navigation
  const nav = document.createElement('div');
  nav.className = 'calendar-nav';
  nav.innerHTML = `
    <button onclick="previousMonth()">&lt;</button>
    <span>${currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
    <button onclick="nextMonth()">&gt;</button>
  `;
  calendar.appendChild(nav);
  
  // Day headers
  const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.textContent = day;
    calendar.appendChild(header);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const today = new Date();
  const todayString = getLocalDateString(today);
  
  // Empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day';
    calendar.appendChild(emptyDay);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayString = getLocalDateString(dayDate);
    
    // Check if this day has tasks
    if (datesWithTasks.includes(dayString)) {
      dayElement.classList.add('has-tasks');
    }
    
    // Check if it's today
    if (dayString === todayString) {
      dayElement.classList.add('today');
    }
    
    // Check if it's selected
    if (selectedDate && dayString === selectedDate) {
      dayElement.classList.add('selected');
    }
    
    dayElement.addEventListener('click', () => selectDate(dayString));
    calendar.appendChild(dayElement);
  }
}

async function selectDate(dateString) {
  selectedDate = dateString;
  renderCalendar();
  await loadTasksForDate(dateString);
}

async function loadTasksForDate(dateString) {
  try {
    const tasks = await window.electronAPI.loadTasksByDate(dateString);
    renderSelectedDateTasks(dateString, tasks);
  } catch (error) {
    console.error('Error loading tasks for date:', error);
  }
}

function renderSelectedDateTasks(dateString, tasksForDate) {
  const titleElement = document.getElementById('selectedDateTitle');
  const taskListElement = document.getElementById('selectedDateTaskList');
  
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  titleElement.textContent = `Tasks untuk ${formattedDate}`;
  taskListElement.innerHTML = '';
  
  if (tasksForDate.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.textContent = 'Tidak ada tugas untuk hari ini';
    emptyMsg.style.color = '#666';
    emptyMsg.style.fontStyle = 'italic';
    taskListElement.appendChild(emptyMsg);
    return;
  }
  
  tasksForDate.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    if (task.done) {
      taskText.classList.add('done');
    }
    taskText.textContent = task.text;
    
    const taskNote = document.createElement('span');
    if (task.note) {
      taskNote.textContent = ` (${task.note})`;
      taskNote.style.fontSize = '12px';
      taskNote.style.color = '#666';
    }
    
    li.appendChild(taskText);
    li.appendChild(taskNote);
    taskListElement.appendChild(li);
  });
}

// Navigation functions (need to be global)
window.previousMonth = function() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

window.nextMonth = function() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.classList.add('task-item');

    // LEFT: checkbox + text
    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      saveTasks();
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

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          task.text = input.value.trim();
          saveTasks();
          renderTasks();
        }
      });

      input.addEventListener('blur', () => renderTasks());
    });

    taskContent.appendChild(checkbox);
    taskContent.appendChild(taskSpan);

    // RIGHT: note + delete
    const taskActions = document.createElement('div');
    taskActions.classList.add('task-actions');

    const note = document.createElement('div');
    note.textContent = task.note || '📝 add note...';
    note.classList.add('task-note');

    note.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.note || '';
      input.className = 'task-note-input';
      taskActions.replaceChild(input, note);
      input.focus();

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          task.note = input.value.trim();
          saveTasks();
          renderTasks();
        }
      });

      input.addEventListener('blur', () => renderTasks());
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    taskActions.appendChild(note);
    taskActions.appendChild(deleteBtn);

    li.appendChild(taskContent);
    li.appendChild(taskActions);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (text === '') return;

  tasks.push({ text, done: false, note: '' });
  saveTasks();
  renderTasks();
  taskInput.value = '';
}

renderTasks();
taskInput.focus();

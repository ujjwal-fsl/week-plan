// UI rendering and DOM manipulation
import { createTask, toggleTaskCompletion, updateTask, deleteTask, getTasksForDate } from './taskService.js';
import { getWeekDays, formatDateKey, formatDateDisplay, formatWeekRange, isToday, isPast } from './weekUtils.js';

let currentWeekStart = null;
let allTasks = [];
let unsubscribe = null;

/**
 * Initialize the UI with app container
 */
export function initUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="header">
      <h1>Week Plan</h1>
      <div class="week-nav">
        <button id="prev-week" class="nav-btn" aria-label="Previous week">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span id="week-range" class="week-range"></span>
        <button id="next-week" class="nav-btn" aria-label="Next week">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </header>
    <main class="week-grid" id="week-grid"></main>
    
    <!-- Task Notes Modal -->
    <div class="modal-overlay hidden" id="task-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" id="modal-task-text"></h2>
          <button class="modal-close" id="modal-close" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <label for="task-note" class="modal-label">Notes</label>
          <textarea 
            id="task-note" 
            class="modal-textarea" 
            placeholder="Add notes for this task..."
            rows="5"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="modal-delete-btn" id="modal-delete">Delete Task</button>
          <button class="modal-save-btn" id="modal-save">Save</button>
        </div>
      </div>
    </div>
  `;
  
  // Attach modal event listeners
  attachModalEventListeners();
}

/**
 * Set up event listeners for navigation
 * @param {Function} onPrevWeek
 * @param {Function} onNextWeek
 */
export function setupNavigation(onPrevWeek, onNextWeek) {
  document.getElementById('prev-week').addEventListener('click', onPrevWeek);
  document.getElementById('next-week').addEventListener('click', onNextWeek);
}

/**
 * Update the week range display
 * @param {Date} weekStart
 */
export function updateWeekDisplay(weekStart) {
  currentWeekStart = weekStart;
  document.getElementById('week-range').textContent = formatWeekRange(weekStart);
}

/**
 * Render the week grid with all days
 * @param {Date} weekStart
 * @param {Object[]} tasks
 */
export function renderWeek(weekStart, tasks) {
  currentWeekStart = weekStart;
  allTasks = tasks;
  
  const grid = document.getElementById('week-grid');
  const days = getWeekDays(weekStart);
  
  grid.innerHTML = days.map(day => renderDayPanel(day, tasks)).join('');
  
  // Attach event listeners
  attachDayEventListeners();
}

/**
 * Render a single day panel
 * @param {Date} day
 * @param {Object[]} tasks
 * @returns {string} HTML string
 */
function renderDayPanel(day, tasks) {
  const dateKey = formatDateKey(day);
  const dayTasks = getTasksForDate(dateKey, tasks);
  const todayClass = isToday(day) ? 'day-panel--today' : '';
  const pastClass = isPast(day) && !isToday(day) ? 'day-panel--past' : '';
  
  return `
    <div class="day-panel ${todayClass} ${pastClass}" data-date="${dateKey}">
      <div class="day-header">
        <span class="day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        <span class="day-date">${day.getDate()}</span>
        ${isToday(day) ? '<span class="today-badge">Today</span>' : ''}
      </div>
      <div class="task-list" data-date="${dateKey}">
        ${dayTasks.map(task => renderTask(task)).join('')}
        <div class="add-task-inline" data-date="${dateKey}">
          <button class="add-task-btn" data-date="${dateKey}">+ New task</button>
          <input type="text" class="add-task-input hidden" data-date="${dateKey}" placeholder="Enter task..." />
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single task
 * @param {Object} task
 * @returns {string} HTML string
 */
function renderTask(task) {
  const completedClass = task.completed ? 'task--completed' : '';
  const carriedClass = task.date !== task.originalDate ? 'task--carried' : '';
  
  return `
    <div class="task ${completedClass} ${carriedClass}" data-task-id="${task.id}">
      <button class="task-checkbox" data-task-id="${task.id}" aria-label="Toggle completion">
        ${task.completed ? `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ` : ''}
      </button>
      <span class="task-text">${escapeHtml(task.text)}</span>
    </div>
  `;
}

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Attach event listeners to day panels
 */
function attachDayEventListeners() {
  // Add task button clicks
  document.querySelectorAll('.add-task-btn').forEach(btn => {
    btn.addEventListener('click', handleAddTaskClick);
  });
  
  // Add task input handlers
  document.querySelectorAll('.add-task-input').forEach(input => {
    input.addEventListener('keydown', handleAddTaskKeydown);
    input.addEventListener('blur', handleAddTaskBlur);
  });
  
  // Task checkbox clicks (toggle completion)
  document.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('click', handleTaskToggle);
  });
  
  // Task row clicks (open notes modal)
  document.querySelectorAll('.task').forEach(taskRow => {
    taskRow.addEventListener('click', handleTaskClick);
  });
}

/**
 * Handle click on add task button
 * @param {Event} e
 */
function handleAddTaskClick(e) {
  const date = e.target.dataset.date;
  const btn = e.target;
  const input = document.querySelector(`.add-task-input[data-date="${date}"]`);
  
  btn.classList.add('hidden');
  input.classList.remove('hidden');
  input.focus();
}

/**
 * Handle keydown on add task input
 * @param {Event} e
 */
async function handleAddTaskKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const input = e.target;
    const text = input.value.trim();
    const date = input.dataset.date;
    
    // Prevent double submission from keydown + blur race condition
    if (input.dataset.submitting === 'true') return;
    
    if (text) {
      input.dataset.submitting = 'true';
      input.value = ''; // Clear immediately to prevent re-submission
      await createTask(text, date);
      delete input.dataset.submitting;
    }
    
    hideTaskInput(input);
  } else if (e.key === 'Escape') {
    e.target.value = '';
    hideTaskInput(e.target);
  }
}

/**
 * Handle blur on add task input
 * @param {Event} e
 */
async function handleAddTaskBlur(e) {
  const input = e.target;
  const text = input.value.trim();
  const date = input.dataset.date;
  
  // Skip if already submitting (from keydown handler)
  if (input.dataset.submitting === 'true') {
    hideTaskInput(input);
    return;
  }
  
  if (text) {
    input.dataset.submitting = 'true';
    input.value = ''; // Clear immediately to prevent re-submission
    await createTask(text, date);
    delete input.dataset.submitting;
  }
  
  hideTaskInput(input);
}

/**
 * Hide task input and show button
 * @param {HTMLInputElement} input
 */
function hideTaskInput(input) {
  const date = input.dataset.date;
  const btn = document.querySelector(`.add-task-btn[data-date="${date}"]`);
  
  input.classList.add('hidden');
  btn.classList.remove('hidden');
}

/**
 * Handle task toggle click
 * @param {Event} e
 */
async function handleTaskToggle(e) {
  // Stop propagation so clicking checkbox doesn't also open the modal
  e.stopPropagation();
  
  const taskId = e.currentTarget.dataset.taskId;
  const task = allTasks.find(t => t.id === taskId);
  
  if (task) {
    await toggleTaskCompletion(taskId, !task.completed);
  }
}

/**
 * Update tasks without full re-render (for real-time updates)
 * @param {Object[]} tasks
 */
export function updateTasks(tasks) {
  allTasks = tasks;
  if (currentWeekStart) {
    renderWeek(currentWeekStart, tasks);
  }
}

// ============================================
// Modal functionality for task notes and delete
// ============================================

let currentTaskId = null;

/**
 * Attach event listeners to the modal
 */
function attachModalEventListeners() {
  // Close button
  document.getElementById('modal-close').addEventListener('click', closeModal);
  
  // Save button
  document.getElementById('modal-save').addEventListener('click', handleSaveNote);
  
  // Delete button
  document.getElementById('modal-delete').addEventListener('click', handleDeleteTask);
  
  // Click on overlay to close
  document.getElementById('task-modal').addEventListener('click', (e) => {
    if (e.target.id === 'task-modal') {
      closeModal();
    }
  });
  
  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('task-modal');
      if (!modal.classList.contains('hidden')) {
        closeModal();
      }
    }
  });
}

/**
 * Handle click on task text to open modal
 * @param {Event} e
 */
function handleTaskClick(e) {
  const taskElement = e.target.closest('.task');
  if (!taskElement) return;
  
  const taskId = taskElement.dataset.taskId;
  const task = allTasks.find(t => t.id === taskId);
  
  if (task) {
    openModal(task);
  }
}

/**
 * Open the task notes modal
 * @param {Object} task
 */
function openModal(task) {
  currentTaskId = task.id;
  
  const modal = document.getElementById('task-modal');
  const titleEl = document.getElementById('modal-task-text');
  const noteEl = document.getElementById('task-note');
  
  // Set task text as modal title
  titleEl.textContent = task.text;
  
  // Set existing note or empty
  noteEl.value = task.note || '';
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Focus on textarea
  noteEl.focus();
}

/**
 * Close the modal
 */
function closeModal() {
  const modal = document.getElementById('task-modal');
  modal.classList.add('hidden');
  currentTaskId = null;
}

/**
 * Handle saving the note
 */
async function handleSaveNote() {
  if (!currentTaskId) return;
  
  const noteEl = document.getElementById('task-note');
  const note = noteEl.value.trim();
  
  // Save note to Firebase
  await updateTask(currentTaskId, { note });
  
  closeModal();
}

/**
 * Handle deleting the task
 */
async function handleDeleteTask() {
  if (!currentTaskId) return;
  
  // Delete from Firebase - realtime listener will update UI
  await deleteTask(currentTaskId);
  
  closeModal();
}

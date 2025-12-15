// Task service - CRUD operations with Firebase
import { database, ref, set, get, onValue, remove, update } from './firebase.js';
import { getCurrentUser } from './auth.js';

/**
 * Generate a unique task ID
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get the database reference for user's tasks
 * @returns {DatabaseReference}
 */
function getTasksRef() {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  return ref(database, `users/${user.uid}/tasks`);
}

/**
 * Get reference to a specific task
 * @param {string} taskId
 * @returns {DatabaseReference}
 */
function getTaskRef(taskId) {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  return ref(database, `users/${user.uid}/tasks/${taskId}`);
}

/**
 * Create a new task
 * @param {string} text - Task description
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Created task
 */
export async function createTask(text, date) {
  const id = generateId();
  const task = {
    id,
    text: text.trim(),
    completed: false,
    date,
    originalDate: date,
    createdAt: Date.now()
  };
  
  await set(getTaskRef(id), task);
  return task;
}

/**
 * Update a task
 * @param {string} taskId
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateTask(taskId, updates) {
  await update(getTaskRef(taskId), updates);
}

/**
 * Toggle task completion
 * @param {string} taskId
 * @param {boolean} completed
 * @returns {Promise<void>}
 */
export async function toggleTaskCompletion(taskId, completed) {
  await updateTask(taskId, { completed });
}

/**
 * Delete a task
 * @param {string} taskId
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
  await remove(getTaskRef(taskId));
}

/**
 * Get all tasks for the current user (one-time fetch)
 * @returns {Promise<Object[]>}
 */
export async function getAllTasks() {
  const snapshot = await get(getTasksRef());
  if (!snapshot.exists()) return [];
  
  const tasksObj = snapshot.val();
  return Object.values(tasksObj);
}

/**
 * Get tasks for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object[]} allTasks - All tasks array
 * @returns {Object[]}
 */
export function getTasksForDate(date, allTasks) {
  return allTasks
    .filter(task => task.date === date)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Subscribe to real-time task updates
 * @param {Function} callback - Called with array of tasks on every change
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTasks(callback) {
  const tasksRef = getTasksRef();
  
  return onValue(tasksRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const tasksObj = snapshot.val();
    const tasks = Object.values(tasksObj);
    callback(tasks);
  });
}

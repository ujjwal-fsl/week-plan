// Carry-forward logic for incomplete tasks
import { updateTask } from './taskService.js';
import { formatDateKey, getToday } from './weekUtils.js';

/**
 * Process carry-forward for all incomplete tasks from past days
 * This runs AFTER auth is resolved and tasks are fully loaded
 * 
 * @param {Object[]} allTasks - All tasks for the user
 * @returns {Promise<Object[]>} Updated tasks array
 */
export async function processCarryForward(allTasks) {
  const todayKey = formatDateKey(getToday());
  const tasksToCarryForward = [];
  
  // Find incomplete tasks from past days
  for (const task of allTasks) {
    if (!task.completed && task.date < todayKey) {
      tasksToCarryForward.push(task);
    }
  }
  
  // Update each task to today's date
  // Keep the same ID and originalDate to preserve identity
  for (const task of tasksToCarryForward) {
    await updateTask(task.id, { date: todayKey });
  }
  
  // Return updated tasks array with new dates applied
  return allTasks.map(task => {
    if (tasksToCarryForward.find(t => t.id === task.id)) {
      return { ...task, date: todayKey };
    }
    return task;
  });
}

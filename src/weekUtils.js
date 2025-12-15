// Week utilities
/**
 * Get the Monday of the week containing the given date
 * @param {Date} date
 * @returns {Date}
 */
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the Sunday of the week containing the given date
 * @param {Date} date
 * @returns {Date}
 */
export function getWeekEnd(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/**
 * Get all 7 days of a week starting from Monday
 * @param {Date} weekStart - Monday of the week
 * @returns {Date[]}
 */
export function getWeekDays(weekStart) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 * @param {Date} date
 * @returns {string}
 */
export function formatDateDisplay(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format week range for header
 * @param {Date} weekStart
 * @returns {string}
 */
export function formatWeekRange(weekStart) {
  const weekEnd = getWeekEnd(weekStart);
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Check if a date is today
 * @param {Date} date
 * @returns {boolean}
 */
export function isToday(date) {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
}

/**
 * Check if a date is in the past
 * @param {Date} date
 * @returns {boolean}
 */
export function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Get today's date at midnight
 * @returns {Date}
 */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

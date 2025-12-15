// Main application entry point
import './style.css';
import { waitForAuth, signInWithGoogle, onAuthChange } from './auth.js';
import { getAllTasks, subscribeToTasks } from './taskService.js';
import { processCarryForward } from './carryForward.js';
import { getWeekStart, getToday } from './weekUtils.js';
import { initUI, setupNavigation, updateWeekDisplay, renderWeek, updateTasks } from './ui.js';

let currentWeekStart = null;
let tasksUnsubscribe = null;
let initialLoadComplete = false;

/**
 * Initialize the application
 */
async function init() {
  // Step 1: Wait for auth state to resolve
  const user = await waitForAuth();
  
  if (!user) {
    // No user signed in - show sign-in screen
    // We must NOT auto-trigger signInWithPopup because browsers block popups
    // that are not initiated by a direct user gesture (click)
    showSignInScreen();
    return;
  }
  
  // User is authenticated - proceed with app initialization
  initializeApp();
}

/**
 * Show the sign-in screen with a button to trigger Google Sign-In
 * This ensures the popup is initiated by a user gesture (required by browsers)
 */
function showSignInScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="signin-container">
      <h1 class="signin-title">Week Plan</h1>
      <p class="signin-subtitle">Your calm weekly planner</p>
      <button class="signin-btn" id="google-signin-btn">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </div>
  `;
  
  // Attach click handler to the sign-in button
  const signInBtn = document.getElementById('google-signin-btn');
  signInBtn.addEventListener('click', handleSignInClick);
}

/**
 * Handle sign-in button click - triggers Google Sign-In popup
 * This is called from a user gesture, so the popup will not be blocked
 */
async function handleSignInClick() {
  const signInBtn = document.getElementById('google-signin-btn');
  
  // Show loading state
  signInBtn.disabled = true;
  signInBtn.innerHTML = `
    <div class="signin-loader"></div>
    Signing in...
  `;
  
  try {
    await signInWithGoogle();
    // Sign-in successful - initialize the app
    initializeApp();
  } catch (error) {
    console.error('Sign-in failed:', error);
    // Reset button state and show error
    signInBtn.disabled = false;
    signInBtn.innerHTML = `
      <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    `;
    showError('Failed to sign in. Please try again.');
  }
}

/**
 * Initialize the app after successful authentication
 */
function initializeApp() {
  // Step 2: Initialize UI
  initUI();
  
  // Step 3: Set up week navigation
  currentWeekStart = getWeekStart(getToday());
  updateWeekDisplay(currentWeekStart);
  
  setupNavigation(
    () => navigateWeek(-1),
    () => navigateWeek(1)
  );
  
  // Step 4: Load initial tasks and process carry-forward
  loadTasksAndCarryForward();
  
  // Step 5: Subscribe to real-time updates
  subscribeToRealTimeUpdates();
}

/**
 * Load all tasks and process carry-forward
 * This ensures carry-forward runs only AFTER:
 * 1. Auth is resolved (done in init)
 * 2. Tasks are fully loaded
 */
async function loadTasksAndCarryForward() {
  try {
    // Get all tasks first
    let tasks = await getAllTasks();
    
    // Process carry-forward for incomplete past tasks
    tasks = await processCarryForward(tasks);
    
    // Render the week with updated tasks
    renderWeek(currentWeekStart, tasks);
    
    initialLoadComplete = true;
  } catch (error) {
    console.error('Error loading tasks:', error);
    showError('Failed to load tasks. Please refresh the page.');
  }
}

/**
 * Subscribe to real-time task updates
 */
function subscribeToRealTimeUpdates() {
  if (tasksUnsubscribe) {
    tasksUnsubscribe();
  }
  
  tasksUnsubscribe = subscribeToTasks((tasks) => {
    // Only update if initial load is complete to avoid conflicts
    if (initialLoadComplete) {
      updateTasks(tasks);
    }
  });
}

/**
 * Navigate to previous or next week
 * @param {number} direction - -1 for previous, 1 for next
 */
function navigateWeek(direction) {
  const newStart = new Date(currentWeekStart);
  newStart.setDate(newStart.getDate() + (direction * 7));
  currentWeekStart = newStart;
  
  updateWeekDisplay(currentWeekStart);
  
  // Re-render with current tasks
  getAllTasks().then(tasks => {
    renderWeek(currentWeekStart, tasks);
  });
}

/**
 * Show error message to user
 * @param {string} message
 */
function showError(message) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">${message}</p>
      <button class="retry-btn" onclick="location.reload()">Retry</button>
    </div>
  `;
}

// Listen for auth state changes (handles sign out, token refresh, etc.)
onAuthChange((user) => {
  if (!user && initialLoadComplete) {
    // User signed out - reload to trigger sign-in
    location.reload();
  }
});

// Start the app
init();

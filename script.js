/**
 * Achievo - Premium To-Do List Application
 * Created by Hima Agarwal
 * © 2026
 */

// Application State
let tasks = [];
let currentFilter = 'all'; // 'all', 'active', 'completed'
let searchQuery = '';
let deleteTaskId = null; // Stores task ID during custom delete modal flow

// DOM Elements
const taskListSection = document.getElementById('task-list-section');
const emptyStateView = document.getElementById('empty-state-view');
const quickAddForm = document.getElementById('quick-add-form');
const quickAddInput = document.getElementById('quick-add-input');
const quickAddPriority = document.getElementById('quick-add-priority');
const searchTasksInput = document.getElementById('search-tasks');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const fabBtn = document.getElementById('fab-btn');

// Task Modal Elements
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const taskIdField = document.getElementById('task-id-field');
const taskTitleInput = document.getElementById('task-title-input');
const taskPriorityInput = document.getElementById('task-priority-input');
const modalTitleText = document.getElementById('modal-title-text');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

// Delete Modal Elements
const deleteModal = document.getElementById('delete-modal');
const deleteModalClose = document.getElementById('delete-modal-close');
const deleteCancelBtn = document.getElementById('delete-cancel-btn');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');

// Filters Container & Buttons
const filtersContainer = document.getElementById('filters-container');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  loadFromLocalStorage();
  updateCounters();
  renderTasksList();
  setupEventListeners();
  
  // Set up filter slider on start
  setTimeout(updateFilterSlider, 100);
});

// Splash Screen Fade Out
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader-screen');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.visibility = 'hidden';
      }, 500);
    }
  }, 1500); // 1.5 second loading screen animation
});

// 1. Clock and Dynamic Welcome Widget
function initClock() {
  const clockEl = document.getElementById('live-clock');
  const welcomeEl = document.getElementById('welcome-msg');
  
  function updateTime() {
    const now = new Date();
    
    // Live date and time formatting
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (clockEl) {
      clockEl.textContent = `${dateStr} • ${timeStr}`;
    }
    
    // Dynamic greeting based on current hour
    const hour = now.getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
    } else if (hour >= 17 || hour < 4) {
      greeting = 'Good evening';
    }
    
    if (welcomeEl) {
      welcomeEl.textContent = `${greeting}, Productive Day Ahead!`;
    }
  }
  
  updateTime();
  setInterval(updateTime, 1000);
}

// 2. Local Storage Persistence
function loadFromLocalStorage() {
  const storedTasks = localStorage.getItem('achivo_tasks');
  if (storedTasks) {
    try {
      tasks = JSON.parse(storedTasks);
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e);
      tasks = [];
    }
  }
}

function saveToLocalStorage() {
  localStorage.setItem('achivo_tasks', JSON.stringify(tasks));
}

// 3. Theme Toggle & Initializer
function initTheme() {
  const savedTheme = localStorage.getItem('achivo_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('achivo_theme', newTheme);
}

// 4. Task Management Operations
function addTask(title, priority) {
  if (!title || title.trim() === '') return;
  
  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    priority: priority || 'medium',
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  tasks.unshift(newTask); // Add new tasks to the beginning of the list
  saveToLocalStorage();
  updateCounters();
  renderTasksList();
}

function editTask(id, newTitle, newPriority) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.title = newTitle.trim();
    task.priority = newPriority;
    saveToLocalStorage();
    updateCounters();
    renderTasksList();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveToLocalStorage();
  updateCounters();
  renderTasksList();
}

function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToLocalStorage();
    updateCounters();
    renderTasksList();
  }
}

// 5. Counters & Circle progress update
function updateCounters() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  
  document.getElementById('count-total').textContent = total;
  document.getElementById('count-pending').textContent = pending;
  document.getElementById('count-completed').textContent = completed;
  
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('progress-desc').textContent = `${percent}% of tasks done`;
  
  // Dynamic progress circle calculation
  const circle = document.getElementById('progress-circle');
  if (circle) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius; // Approx 175.93
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }
}

// 6. Search & Filter Operations
function filterTasks(filterName) {
  currentFilter = filterName;
  updateFilterSlider();
  renderTasksList();
}

function searchTasks(query) {
  searchQuery = query.toLowerCase().trim();
  renderTasksList();
}

// Clear all tasks marked completed
function clearCompletedTasks() {
  tasks = tasks.filter(t => !t.completed);
  saveToLocalStorage();
  updateCounters();
  renderTasksList();
}

// 7. Render Lists and Layout Updates
function renderTasksList() {
  taskListSection.innerHTML = '';
  
  // Filter Tasks
  let filtered = tasks;
  if (currentFilter === 'active') {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  }
  
  // Search Query filter
  if (searchQuery !== '') {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery));
  }
  
  // Empty State Toggle
  if (filtered.length === 0) {
    emptyStateView.style.display = 'flex';
    taskListSection.style.display = 'none';
    
    // Customize messaging based on actions
    const stateTitle = document.getElementById('empty-state-title');
    const stateDesc = document.getElementById('empty-state-desc');
    
    if (searchQuery !== '') {
      stateTitle.textContent = 'No matches found';
      stateDesc.textContent = `We couldn't find any results for "${searchQuery}". Try editing your query.`;
    } else if (currentFilter === 'active') {
      stateTitle.textContent = 'All goals checked';
      stateDesc.textContent = 'No active tasks remaining. Click add to map new goals!';
    } else if (currentFilter === 'completed') {
      stateTitle.textContent = 'No finished work';
      stateDesc.textContent = 'Tasks you mark as completed will appear here.';
    } else {
      stateTitle.textContent = 'Your schedule is clean';
      stateDesc.textContent = 'No tasks found. Click the button below or use the quick bar above to add a new task.';
    }
  } else {
    emptyStateView.style.display = 'none';
    taskListSection.style.display = 'flex';
    
    filtered.forEach(task => {
      const taskCard = createTaskCard(task);
      taskListSection.appendChild(taskCard);
    });
  }
}

// Create DOM structure for each Task
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-item ${task.completed ? 'completed' : ''}`;
  card.setAttribute('data-id', task.id);
  
  // Formatted date string
  const dateObj = new Date(task.createdAt);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  card.innerHTML = `
    <div class="task-item-left">
      <div class="custom-checkbox" aria-label="Mark task done">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></path>
        </svg>
      </div>
      <div class="task-content-box">
        <span class="task-title">${escapeHTML(task.title)}</span>
        <div class="task-meta">
          <span class="task-priority-tag ${task.priority}">${task.priority}</span>
          <span class="task-date">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            ${formattedDate}
          </span>
        </div>
      </div>
    </div>
    <div class="task-item-right">
      <button class="action-btn btn-edit" aria-label="Edit task">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
        </svg>
      </button>
      <button class="action-btn btn-delete" aria-label="Delete task">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Interactive events for Card
  card.querySelector('.custom-checkbox').addEventListener('click', () => {
    completeTask(task.id);
  });
  
  card.querySelector('.btn-edit').addEventListener('click', () => {
    openEditModal(task);
  });
  
  card.querySelector('.btn-delete').addEventListener('click', () => {
    openDeleteConfirmModal(task.id);
  });
  
  // Double click inline edit capability
  card.querySelector('.task-title').addEventListener('dblclick', () => {
    openEditModal(task);
  });
  
  return card;
}

// 8. Sliding Filter pill update
function updateFilterSlider() {
  const activeBtn = document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`);
  const slider = document.getElementById('filter-slider');
  
  if (activeBtn && slider) {
    slider.style.left = `${activeBtn.offsetLeft}px`;
    slider.style.width = `${activeBtn.offsetWidth}px`;
  }
}

// 9. Modals Visual Management
function openAddModal() {
  taskIdField.value = '';
  taskTitleInput.value = '';
  taskPriorityInput.value = 'medium';
  modalTitleText.textContent = 'Add New Task';
  
  taskModal.classList.add('active');
  setTimeout(() => taskTitleInput.focus(), 150);
}

function openEditModal(task) {
  taskIdField.value = task.id;
  taskTitleInput.value = task.title;
  taskPriorityInput.value = task.priority;
  modalTitleText.textContent = 'Edit Task';
  
  taskModal.classList.add('active');
  setTimeout(() => taskTitleInput.focus(), 150);
}

function closeTaskModal() {
  taskModal.classList.remove('active');
}

function openDeleteConfirmModal(id) {
  deleteTaskId = id;
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  deleteTaskId = null;
  deleteModal.classList.remove('active');
}

// 10. Event Listeners Setup
function setupEventListeners() {
  // Add task via Quick form
  quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = quickAddInput.value;
    const priority = quickAddPriority.value;
    addTask(title, priority);
    quickAddInput.value = '';
    quickAddInput.blur();
  });
  
  // Search filter trigger
  searchTasksInput.addEventListener('input', (e) => {
    searchTasks(e.target.value);
  });
  
  // Filter pills selection
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterTasks(btn.getAttribute('data-filter'));
    });
  });
  
  // Clear completed button
  clearCompletedBtn.addEventListener('click', () => {
    clearCompletedTasks();
  });
  
  // Theme Toggle Button
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Floating Action Button
  fabBtn.addEventListener('click', openAddModal);
  
  // Modal Closes
  modalCloseBtn.addEventListener('click', closeTaskModal);
  modalCancelBtn.addEventListener('click', closeTaskModal);
  
  deleteModalClose.addEventListener('click', closeDeleteModal);
  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  
  // Modal task submission (handles add vs edit)
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = taskIdField.value;
    const title = taskTitleInput.value;
    const priority = taskPriorityInput.value;
    
    if (id) {
      editTask(id, title, priority);
    } else {
      addTask(title, priority);
    }
    
    closeTaskModal();
  });
  
  // Custom modal delete confirm click
  deleteConfirmBtn.addEventListener('click', () => {
    if (deleteTaskId) {
      deleteTask(deleteTaskId);
      closeDeleteModal();
    }
  });
  
  // Closing modals on outer click
  window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeTaskModal();
    }
    if (e.target === deleteModal) {
      closeDeleteModal();
    }
  });
  
  // Window resize recalculates sliding filter position
  window.addEventListener('resize', updateFilterSlider);
}

// Helpers
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

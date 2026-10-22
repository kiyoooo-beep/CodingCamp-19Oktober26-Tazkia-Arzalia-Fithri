/* ============================================================
   Personal Dashboard — app.js
   Vanilla JS, no frameworks, all data in localStorage
   ============================================================ */

// ============================================================
// Storage helpers — detect and wrap localStorage safely
// ============================================================
const Store = (() => {
  let available = true;
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
  } catch (e) {
    available = false;
  }

  function get(key, fallback = null) {
    if (!available) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function set(key, value) {
    if (!available) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  }

  function remove(key) {
    if (!available) return;
    try { localStorage.removeItem(key); } catch {}
  }

  return { get, set, remove, isAvailable: () => available };
})();

// ============================================================
// Storage unavailability notice
// ============================================================
function initStorageNotice() {
  if (!Store.isAvailable()) {
    document.getElementById('storage-notice').classList.remove('hidden');
  }
}

// ============================================================
// Theme — light / dark toggle
// ============================================================
function initTheme() {
  const toggle = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  }

  // Read saved or system preference (already set inline in <head> to avoid flash)
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current);

  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Store.set('theme', next); // silent if storage unavailable
  });
}

// ============================================================
// Greeting Widget — live clock, date, time-of-day greeting
// ============================================================
function initGreeting() {
  const greetingEl   = document.getElementById('greeting');
  const clockEl      = document.getElementById('clock');
  const dateEl       = document.getElementById('date-display');
  const nameInput    = document.getElementById('name-input');
  const nameSaveBtn  = document.getElementById('name-save');
  const nameError    = document.getElementById('name-error');

  const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'];

  // Derive greeting prefix from current hour
  function getGreetingPrefix(hour) {
    if (hour >= 5  && hour <= 11) return 'Selamat Pagi';
    if (hour >= 12 && hour <= 17) return 'Selamat Siang';
    return 'Selamat Malam';
  }

  // Format hour to 12-hour with AM/PM
  function format12(h, m, s) {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12    = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} ${period}`;
  }

  // Update clock and greeting every second
  function tick() {
    const now  = new Date();
    const h    = now.getHours();
    const name = Store.get('userName', '');

    clockEl.textContent = format12(h, now.getMinutes(), now.getSeconds());
    dateEl.textContent  = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    const prefix = getGreetingPrefix(h);
    greetingEl.textContent = name ? `${prefix}, ${name}!` : `${prefix}!`;
  }

  tick();
  setInterval(tick, 1000);

  // Pre-populate name input from storage
  const savedName = Store.get('userName', '');
  if (savedName) nameInput.value = savedName;

  // Save name handler
  function saveName() {
    const raw = nameInput.value;
    const trimmed = raw.trim();

    if (raw.length > 50) {
      showError(nameError, 'Nama maksimal 50 karakter.');
      return;
    }

    if (trimmed === '') {
      Store.remove('userName');
    } else {
      Store.set('userName', trimmed);
    }

    hideError(nameError);
    tick(); // update greeting immediately
  }

  nameSaveBtn.addEventListener('click', saveName);
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
}

// ============================================================
// Pomodoro Timer — start / stop / reset, custom duration
// ============================================================
function initTimer() {
  const displayEl     = document.getElementById('timer-display');
  const startBtn      = document.getElementById('timer-start');
  const stopBtn       = document.getElementById('timer-stop');
  const resetBtn      = document.getElementById('timer-reset');
  const durationInput = document.getElementById('timer-duration-input');
  const durationSave  = document.getElementById('timer-duration-save');
  const timerError    = document.getElementById('timer-error');

  let durationMinutes = Store.get('timerDuration', 25);
  let remainingSeconds = durationMinutes * 60;
  let intervalId = null;
  let running = false;

  // AudioContext-based beep for audible alert
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch (err) { /* silent fail if audio context unavailable */ }
  }

  // Render MM:SS from total seconds
  function renderTime(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    displayEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // Toggle input availability based on session state
  function setSessionRunning(isRunning) {
    running = isRunning;
    durationInput.disabled = isRunning;
    durationSave.disabled  = isRunning;
    startBtn.disabled      = isRunning;
    stopBtn.disabled       = !isRunning;
  }

  renderTime(remainingSeconds);
  setSessionRunning(false);

  // Start countdown
  startBtn.addEventListener('click', () => {
    if (running) return; // guard: already running
    hideError(timerError);
    setSessionRunning(true);

    intervalId = setInterval(() => {
      remainingSeconds--;
      renderTime(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        setSessionRunning(false);
        playBeep();
      }
    }, 1000);
  });

  // Stop (pause) countdown
  stopBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId);
    intervalId = null;
    setSessionRunning(false);
  });

  // Reset countdown
  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    intervalId = null;
    remainingSeconds = durationMinutes * 60;
    renderTime(remainingSeconds);
    setSessionRunning(false);
    hideError(timerError);
  });

  // Save custom duration
  function saveDuration() {
    const val = parseInt(durationInput.value, 10);
    if (isNaN(val) || val < 1 || val > 99) {
      showError(timerError, 'Masukkan durasi antara 1–99 menit.');
      return;
    }
    hideError(timerError);
    durationMinutes = val;
    remainingSeconds = durationMinutes * 60;
    Store.set('timerDuration', durationMinutes);
    renderTime(remainingSeconds);
    durationInput.value = '';
  }

  durationSave.addEventListener('click', saveDuration);
  durationInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveDuration(); });
}

// ============================================================
// To-Do List — add / edit / complete / delete, localStorage
// ============================================================
function initTodoList() {
  const todoInput = document.getElementById('todo-input');
  const todoAddBtn = document.getElementById('todo-add');
  const todoList   = document.getElementById('todo-list');
  const todoError  = document.getElementById('todo-error');

  // Load tasks — show error if storage failed
  let tasks = [];
  if (!Store.isAvailable()) {
    showError(todoError, 'Tidak dapat memuat tugas: Local Storage tidak tersedia.');
  } else {
    tasks = Store.get('tasks', []);
  }

  // Persist task list to storage
  function saveTasks() {
    Store.set('tasks', tasks);
  }

  // Generate a simple unique ID
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Render all tasks
  function renderTasks() {
    todoList.innerHTML = '';
    tasks.forEach(task => {
      const li = buildTaskItem(task);
      todoList.appendChild(li);
    });
  }

  // Build a single task list item element
  function buildTaskItem(task) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Tandai selesai: ${task.text}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Text span (normal display)
    const span = document.createElement('span');
    span.className = 'todo-text' + (task.done ? ' done' : '');
    span.textContent = task.text;

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-ghost btn-sm';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit tugas: ${task.text}`);
    editBtn.addEventListener('click', () => startEdit(li, task, span));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-ghost btn-sm';
    delBtn.textContent = '🗑️';
    delBtn.setAttribute('aria-label', `Hapus tugas: ${task.text}`);
    delBtn.style.color = 'var(--danger)';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    return li;
  }

  // Toggle task completion status
  function toggleTask(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.done = !t.done;
    saveTasks();
    renderTasks();
  }

  // Activate inline edit mode on a task item
  function startEdit(li, task, span) {
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'todo-edit-input';
    editInput.value = task.text;
    editInput.maxLength = 200;
    editInput.setAttribute('aria-label', 'Edit teks tugas');

    li.replaceChild(editInput, span);
    editInput.focus();
    editInput.select();

    // Confirm edit on Enter
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmEdit(li, task, editInput);
      if (e.key === 'Escape') cancelEdit(li, task, editInput);
    });

    // Cancel edit on blur (click outside)
    editInput.addEventListener('blur', () => {
      setTimeout(() => cancelEdit(li, task, editInput), 150);
    });

    // Replace action buttons temporarily with confirm/cancel
    const actions = li.querySelector('.todo-actions');
    actions.innerHTML = '';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary btn-sm';
    confirmBtn.textContent = '✓';
    confirmBtn.setAttribute('aria-label', 'Konfirmasi perubahan');
    confirmBtn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevent blur before click
      confirmEdit(li, task, editInput);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-ghost btn-sm';
    cancelBtn.textContent = '✕';
    cancelBtn.setAttribute('aria-label', 'Batalkan perubahan');
    cancelBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      cancelEdit(li, task, editInput);
    });

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
  }

  // Confirm and save the edited text
  function confirmEdit(li, task, editInput) {
    const newText = editInput.value.trim();
    if (newText === '') {
      // Discard — restore original
      renderTasks();
      return;
    }
    task.text = newText;
    saveTasks();
    renderTasks();
  }

  // Cancel edit and restore original display
  function cancelEdit(li, task, editInput) {
    // Only cancel if still in edit mode (element still in DOM)
    if (!li.isConnected) return;
    renderTasks();
  }

  // Delete a task by ID
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  // Add a new task
  function addTask() {
    const raw = todoInput.value;
    const text = raw.trim();

    if (raw.length > 200) {
      showError(todoError, 'Deskripsi tugas maksimal 200 karakter.');
      return;
    }
    if (text === '') {
      showError(todoError, 'Tugas tidak boleh kosong.');
      return;
    }

    hideError(todoError);
    tasks.push({ id: uid(), text, done: false });
    saveTasks();
    renderTasks();
    todoInput.value = '';
    todoInput.focus();
  }

  todoAddBtn.addEventListener('click', addTask);
  todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });

  renderTasks();
}

// ============================================================
// Quick Links — add / delete, opens in new tab
// ============================================================
function initQuickLinks() {
  const labelInput = document.getElementById('link-label-input');
  const urlInput   = document.getElementById('link-url-input');
  const addBtn     = document.getElementById('link-add');
  const grid       = document.getElementById('links-grid');
  const linkError  = document.getElementById('link-error');

  let links = Store.get('links', []);

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function saveLinks() {
    Store.set('links', links);
  }

  // Normalize URL — prepend https:// if no scheme
  function normalizeUrl(url) {
    if (!/^https?:\/\//i.test(url)) return 'https://' + url;
    return url;
  }

  // Render all link chips
  function renderLinks() {
    grid.innerHTML = '';
    links.forEach(link => {
      const chip = document.createElement('div');
      chip.className = 'link-chip';
      chip.setAttribute('role', 'group');
      chip.setAttribute('aria-label', link.label);

      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;
      anchor.style.color = 'inherit';
      anchor.style.textDecoration = 'none';

      const delBtn = document.createElement('button');
      delBtn.className = 'link-chip-delete';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', `Hapus link: ${link.label}`);
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteLink(link.id);
      });

      chip.appendChild(anchor);
      chip.appendChild(delBtn);
      grid.appendChild(chip);
    });
  }

  // Delete a link by ID
  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    saveLinks();
    renderLinks();
  }

  // Add a new link
  function addLink() {
    const label = labelInput.value.trim();
    const rawUrl = urlInput.value.trim();

    // Validation
    if (!label) {
      showError(linkError, 'Label tidak boleh kosong.');
      return;
    }
    if (label.length > 50) {
      showError(linkError, 'Label maksimal 50 karakter.');
      return;
    }
    if (!rawUrl) {
      showError(linkError, 'URL tidak boleh kosong.');
      return;
    }
    if (rawUrl.length > 2048) {
      showError(linkError, 'URL terlalu panjang (maks 2048 karakter).');
      return;
    }

    const url = normalizeUrl(rawUrl);

    const isDuplicate = links.some(l => l.url === url);
    if (isDuplicate) {
      showError(linkError, 'URL ini sudah ada di Quick Links.');
      return;
    }

    if (links.length >= 50) {
      showError(linkError, 'Maksimal 50 quick links.');
      return;
    }

    if (!Store.isAvailable()) {
      showError(linkError, 'Gagal menyimpan: Local Storage tidak tersedia.');
      return;
    }

    hideError(linkError);
    links.push({ id: uid(), label, url });
    const saved = saveLinks();
    if (!saved) {
      showError(linkError, 'Gagal menyimpan link.');
      return;
    }
    renderLinks();
    labelInput.value = '';
    urlInput.value = '';
    labelInput.focus();
  }

  addBtn.addEventListener('click', addLink);
  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
  labelInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

  renderLinks();
}

// ============================================================
// Utility — show / hide inline error messages
// ============================================================
function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.textContent = '';
  el.classList.add('hidden');
}

// ============================================================
// Bootstrap — initialise all modules on DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initStorageNotice();
  initTheme();
  initGreeting();
  initTimer();
  initTodoList();
  initQuickLinks();
});

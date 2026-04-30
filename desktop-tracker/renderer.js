const apiBaseInput = document.getElementById('apiBase')
const userIdInput = document.getElementById('userId')
const userNameInput = document.getElementById('userName')
const projectNameInput = document.getElementById('projectName')
const projectSelectInput = document.getElementById('projectSelect')
const taskIdInput = document.getElementById('taskId')
const taskTitleInput = document.getElementById('taskTitle')
const taskSelectInput = document.getElementById('taskSelect')
const timerValue = document.getElementById('timerValue')
const todayTime = document.getElementById('todayTime')
const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const statusEl = document.getElementById('status')
const settingsPanel = document.getElementById('settingsPanel')
const projectTitleEl = document.getElementById('currentProjectTitle')
const projectSearchInput = document.getElementById('projectSearch')
const projectList = document.getElementById('projectList')
const lastUpdatedEl = document.getElementById('lastUpdated')
const orgTitleEl = document.getElementById('orgTitle')
const authEmailInput = document.getElementById('authEmail')
const authPasswordInput = document.getElementById('authPassword')
const authStateEl = document.getElementById('authState')
const loginBtn = document.getElementById('loginBtn')
const openLoginBtn = document.getElementById('openLoginBtn')
const backToEntranceBtn = document.getElementById('backToEntranceBtn')
const headerLoginBtn = document.getElementById('headerLoginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const loginScreen = document.getElementById('loginScreen')
const entranceScreen = document.getElementById('entranceScreen')
const loginFormScreen = document.getElementById('loginFormScreen')
const trackerContent = document.getElementById('trackerContent')

let timerId = null
let startTime = null
let todaySeconds = 0
let projectRefreshId = null
let activeSessionId = null
let taskRows = []
let projectRows = []
let authUser = null

function normalizeLower(value) {
  return String(value || '').trim().toLowerCase()
}

function isEmployeeRole(role) {
  return normalizeLower(role) === 'employee'
}

function showEntrance() {
  if (entranceScreen) entranceScreen.classList.remove('hidden')
  if (loginFormScreen) loginFormScreen.classList.add('hidden')
}

function showLoginForm() {
  if (entranceScreen) entranceScreen.classList.add('hidden')
  if (loginFormScreen) loginFormScreen.classList.remove('hidden')
}

function formatDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function setStatus(message, isError = false) {
  statusEl.textContent = message
  statusEl.style.color = isError ? '#c32f3a' : '#4c5875'
}

function persistSettings() {
  localStorage.setItem('tracker-api-base', apiBaseInput.value.trim())
  localStorage.setItem('tracker-user-id', userIdInput.value.trim())
  localStorage.setItem('tracker-user-name', userNameInput.value.trim())
  localStorage.setItem('tracker-project-name', projectNameInput.value.trim())
  localStorage.setItem('tracker-task-id', taskIdInput.value.trim())
  localStorage.setItem('tracker-task-title', taskTitleInput.value.trim())
  if (authUser) localStorage.setItem('tracker-auth-user', JSON.stringify(authUser))
  else localStorage.removeItem('tracker-auth-user')
}

function getApiBase() {
  return apiBaseInput.value.trim().replace(/\/+$/, '')
}

function restoreSettings() {
  apiBaseInput.value = localStorage.getItem('tracker-api-base') || 'http://localhost:5000/api'
  userIdInput.value = localStorage.getItem('tracker-user-id') || ''
  userNameInput.value = localStorage.getItem('tracker-user-name') || ''
  const savedProject = localStorage.getItem('tracker-project-name') || ''
  const savedTaskId = localStorage.getItem('tracker-task-id') || ''
  const savedTaskTitle = localStorage.getItem('tracker-task-title') || ''
  if (savedProject) {
    projectNameInput.value = savedProject
    if (projectSelectInput) projectSelectInput.value = savedProject
  }
  if (savedTaskId) taskIdInput.value = savedTaskId
  if (savedTaskTitle) {
    taskTitleInput.value = savedTaskTitle
    projectTitleEl.textContent = savedTaskTitle
    setActiveTask(savedTaskId)
  }
  const savedToday = Number(localStorage.getItem('tracker-today-seconds') || 0)
  if (Number.isFinite(savedToday) && savedToday >= 0) {
    todaySeconds = savedToday
    todayTime.textContent = `Today: ${formatDuration(todaySeconds).slice(3)}`
  }
  try {
    const savedAuth = localStorage.getItem('tracker-auth-user')
    authUser = savedAuth ? JSON.parse(savedAuth) : null
  } catch {
    authUser = null
  }
  applyAuthState()
}

function applyAuthState() {
  const signedIn = Boolean(authUser?.email && authUser?.userId)
  if (signedIn) {
    userIdInput.value = String(authUser.userId)
    userNameInput.value = String(authUser.displayName || authUser.email)
    authEmailInput.value = String(authUser.email || '')
    authStateEl.textContent = `Logged in: ${authUser.displayName || authUser.email} (${authUser.role || 'User'})`
    loginScreen.classList.add('hidden')
    trackerContent.classList.remove('hidden')
  } else {
    userIdInput.value = ''
    userNameInput.value = ''
    authEmailInput.value = ''
    authStateEl.textContent = 'Not logged in'
    loginScreen.classList.remove('hidden')
    trackerContent.classList.add('hidden')
    showEntrance()
  }

  loginBtn.disabled = false
  if (headerLoginBtn) {
    headerLoginBtn.disabled = signedIn
    if (signedIn) headerLoginBtn.classList.add('hidden')
    else headerLoginBtn.classList.remove('hidden')
  }
  if (logoutBtn) {
    logoutBtn.disabled = !signedIn
    if (signedIn) logoutBtn.classList.remove('hidden')
    else logoutBtn.classList.add('hidden')
  }
  authEmailInput.disabled = false
  authPasswordInput.disabled = false
  projectSearchInput.disabled = !signedIn
  projectSelectInput.disabled = !signedIn
  if (!signedIn) {
    taskSelectInput.disabled = true
    taskSelectInput.innerHTML = '<option value="">Login first</option>'
    projectList.innerHTML = '<div class="project-item" style="cursor:default;"><span class="dot ghost"></span><span class="name">Login to load tasks</span><span class="time"></span></div>'
  }
}

async function loginTrackerUser() {
  if (authUser?.email) {
    setStatus('Already logged in')
    return
  }
  const email = authEmailInput.value.trim().toLowerCase()
  const password = authPasswordInput.value
  if (!email || !password) {
    setStatus('Email and password are required', true)
    return
  }
  try {
    const response = await fetch(`${getApiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.message || 'Login failed')
    authUser = {
      userId: data?.userId ?? '',
      displayName: data?.displayName || data?.email || email,
      email: data?.email || email,
      role: data?.role || 'User',
    }
    authPasswordInput.value = ''
    applyAuthState()
    persistSettings()
    await refreshProjects(true)
    setStatus('Login successful.')
  } catch (error) {
    setStatus(error.message || 'Login failed', true)
  }
}

async function logoutTrackerUser() {
  if (timerId) {
    setStatus('Stop timer before logout', true)
    return
  }
  authUser = null
  authPasswordInput.value = ''
  projectNameInput.value = ''
  taskIdInput.value = ''
  taskTitleInput.value = ''
  if (projectSelectInput) projectSelectInput.value = ''
  if (taskSelectInput) taskSelectInput.value = ''
  applyAuthState()
  persistSettings()
  setStatus('Logged out')
}

function escapeHtml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function populateProjectOptions(projects, selectedProjectName = '') {
  if (!projectSelectInput) return
  const list = Array.isArray(projects) ? projects : []
  const selected = String(selectedProjectName || '').trim()
  projectSelectInput.innerHTML = [
    '<option value="">Select project</option>',
    ...list.map((project) => {
      const name = String(project?.name || '').trim()
      if (!name) return ''
      const isSelected = name === selected ? ' selected' : ''
      return `<option value="${escapeHtml(name)}"${isSelected}>${escapeHtml(name)}</option>`
    }),
  ].join('\n')
}

function populateTaskOptions(tasks, selectedTaskId = '') {
  if (!taskSelectInput) return
  const list = Array.isArray(tasks) ? tasks : []
  const selected = String(selectedTaskId || '').trim()
  if (!projectNameInput.value.trim()) {
    taskSelectInput.innerHTML = '<option value="">Select project first</option>'
    taskSelectInput.disabled = true
    return
  }
  taskSelectInput.disabled = false
  taskSelectInput.innerHTML = [
    '<option value="">Select task</option>',
    ...list.map((task) => {
      const taskId = String(task?.id || '').trim()
      const title = String(task?.title || '').trim() || `Task #${taskId}`
      if (!taskId) return ''
      const isSelected = taskId === selected ? ' selected' : ''
      return `<option value="${escapeHtml(taskId)}"${isSelected}>${escapeHtml(title)}</option>`
    }),
  ].join('\n')
}

function applyTaskSelectionById(taskId) {
  const selectedTaskId = String(taskId || '').trim()
  const selectedTask = taskRows.find((task) => String(task?.id || '') === selectedTaskId) || null
  if (!selectedTask) {
    taskIdInput.value = ''
    taskTitleInput.value = ''
    projectTitleEl.textContent = 'Select a Task'
    if (taskSelectInput && taskSelectInput.value) taskSelectInput.value = ''
    setActiveTask('')
    return
  }
  const projectName = String(selectedTask?.project || '').trim()
  const title = String(selectedTask?.title || '').trim()
  taskIdInput.value = selectedTaskId
  taskTitleInput.value = title
  projectNameInput.value = projectName
  projectTitleEl.textContent = title || 'Select a Task'
  if (taskSelectInput) taskSelectInput.value = selectedTaskId
  if (projectSelectInput && projectName) projectSelectInput.value = projectName
  setActiveTask(selectedTaskId)
}

async function startRemoteTimer() {
  const apiBase = getApiBase()
  if (!authUser?.userId) throw new Error('Please login first')
  const payload = {
    userId: String(authUser.userId),
    userName: String(authUser.displayName || authUser.email || ''),
    projectName: projectNameInput.value.trim(),
    taskId: taskIdInput.value.trim(),
    taskTitle: taskTitleInput.value.trim(),
    source: 'desktop',
  }

  if (!payload.userId || !payload.userName || !payload.projectName || !payload.taskId) {
    throw new Error('User ID, User Name, Project and Task are required')
  }

  const response = await fetch(`${apiBase}/tracker/timer/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to start timer on server')
  }
  const data = await response.json()
  activeSessionId = data?.id || null
  return data
}

async function stopRemoteTimer() {
  const apiBase = getApiBase()
  if (!authUser?.userId) throw new Error('Please login first')
  const payload = {
    sessionId: activeSessionId,
    userId: String(authUser.userId),
    taskId: taskIdInput.value.trim(),
    source: 'desktop',
  }
  if (!payload.sessionId && (!payload.userId || !payload.taskId)) {
    throw new Error('No active timer session found')
  }
  const response = await fetch(`${apiBase}/tracker/timer/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to stop timer on server')
  }
  const data = await response.json()
  activeSessionId = null
  return data
}

function renderTaskItems(rows) {
  const currentTaskId = taskIdInput.value.trim()
  const tasks = Array.isArray(rows) ? rows : []

  if (tasks.length === 0) {
    projectList.innerHTML = [
      '<div class="project-item" style="cursor:default;">',
      '<span class="dot ghost"></span>',
      '<span class="name">No tasks found</span>',
      '<span class="time">0:00</span>',
      '</div>',
    ].join('')
    if (!currentTaskId) projectTitleEl.textContent = 'Select a Task'
    return
  }

  projectList.innerHTML = tasks.map((task, index) => {
    const taskTitle = String(task?.title || '').trim() || `Task ${index + 1}`
    const projectName = String(task?.project || '').trim() || 'Project'
    const taskId = String(task?.id || '')
    const isActive = taskId === currentTaskId
    const dotClass = isActive ? 'dot' : 'dot ghost'
    return [
      `<button class="project-item ${isActive ? 'active' : ''}" type="button" data-task-id="${taskId}" data-project="${escapeHtml(projectName)}" data-task-title="${escapeHtml(taskTitle)}">`,
      `  <span class="${dotClass}">${isActive ? '▶' : ''}</span>`,
      `  <span class="name">${taskTitle}</span>`,
      `  <span class="time">${projectName}</span>`,
      '</button>',
    ].join('\n')
  }).join('\n')

  const selectedExists = tasks.some((t) => String(t?.id || '') === currentTaskId)
  if (!selectedExists) {
    const first = tasks[0]
    const firstId = String(first?.id || '')
    applyTaskSelectionById(firstId)
    persistSettings()
  } else {
    applyTaskSelectionById(currentTaskId)
  }
}

async function refreshProjects(showErrors = false) {
  const apiBase = getApiBase()
  if (!authUser?.email) return
  if (!apiBase) return
  try {
    const [projectRes, taskRes, employeeRes] = await Promise.all([
      fetch(`${apiBase}/projects`),
      fetch(`${apiBase}/tasks`),
      fetch(`${apiBase}/employees`),
    ])
    if (!projectRes.ok || !taskRes.ok || !employeeRes.ok) throw new Error('Unable to load projects/tasks')
    const projects = await projectRes.json()
    const allTasks = await taskRes.json()
    const employees = await employeeRes.json()
    const allProjects = Array.isArray(projects) ? projects : []
    const allTaskRows = Array.isArray(allTasks) ? allTasks : []
    const employeeRows = Array.isArray(employees) ? employees : []

    const identitySet = new Set()
    const authDisplay = String(authUser?.displayName || '').trim()
    const authEmail = String(authUser?.email || '').trim()
    if (authDisplay) identitySet.add(normalizeLower(authDisplay))
    if (authEmail) identitySet.add(normalizeLower(authEmail))

    const matchedEmployee = employeeRows.find((emp) => {
      const byId = String(emp?.id || '') === String(authUser?.userId || '')
      const byEmail = normalizeLower(emp?.email) && normalizeLower(emp?.email) === normalizeLower(authEmail)
      const byName = normalizeLower(emp?.name) && normalizeLower(emp?.name) === normalizeLower(authDisplay)
      return byId || byEmail || byName
    })
    if (matchedEmployee?.name) identitySet.add(normalizeLower(matchedEmployee.name))
    if (matchedEmployee?.email) identitySet.add(normalizeLower(matchedEmployee.email))

    const restrictToAssignee = isEmployeeRole(authUser?.role)
    const visibleProjects = restrictToAssignee
      ? allProjects.filter((project) => {
        const ownerMatch = identitySet.has(normalizeLower(project?.owner))
        const members = Array.isArray(project?.members) ? project.members : []
        const memberMatch = members.some((member) => identitySet.has(normalizeLower(member)))
        return ownerMatch || memberMatch
      })
      : allProjects

    projectRows = visibleProjects

    const selectedProjectRaw = (projectSelectInput?.value || projectNameInput.value || '').trim()
    const selectedProjectLower = normalizeLower(selectedProjectRaw)
    const projectNames = new Set(projectRows.map((project) => normalizeLower(project?.name)).filter(Boolean))
    const resolvedProject =
      selectedProjectLower && projectNames.has(selectedProjectLower)
        ? selectedProjectRaw
        : String(projectRows?.[0]?.name || '').trim()

    projectNameInput.value = resolvedProject
    if (projectSelectInput) projectSelectInput.value = resolvedProject
    populateProjectOptions(projectRows, resolvedProject)

    const activeProject = normalizeLower(resolvedProject)
    taskRows = allTaskRows.filter((item) => {
      if (!activeProject) return false
      const inProject = normalizeLower(item?.project) === activeProject
      if (!inProject) return false
      if (!restrictToAssignee) return true
      return identitySet.has(normalizeLower(item?.assignee))
    })
    populateTaskOptions(taskRows, taskIdInput.value.trim())
    renderTaskItems(taskRows)
    if (projectRows?.[0]?.owner) orgTitleEl.textContent = `${projectRows[0].owner}'s Organization Tasks`
    else orgTitleEl.textContent = 'Your Assigned Tasks'
    updateLastUpdated()
  } catch (error) {
    if (showErrors) setStatus(error.message || 'Failed to fetch projects', true)
  }
}

async function startTimer() {
  if (timerId) return
  if (!authUser?.email) {
    setStatus('Please login first', true)
    return
  }
  try {
    persistSettings()
    await startRemoteTimer()
    startTime = new Date()
    startBtn.disabled = false
    stopBtn.disabled = true
    startBtn.textContent = '⏸'
    setStatus('Timer running and synced...')
    timerId = window.setInterval(() => {
      const sec = (Date.now() - startTime.getTime()) / 1000
      timerValue.textContent = formatDuration(sec)
    }, 250)
  } catch (error) {
    setStatus(error.message || 'Could not start timer', true)
  }
}

async function stopTimerAndSync() {
  if (!timerId || !startTime) return
  clearInterval(timerId)
  timerId = null
  stopBtn.disabled = true
  startBtn.disabled = false
  startBtn.textContent = '▶'

  const endedAt = new Date()
  const durationSeconds = Math.floor((endedAt.getTime() - startTime.getTime()) / 1000)
  timerValue.textContent = formatDuration(durationSeconds)
  todaySeconds += durationSeconds
  localStorage.setItem('tracker-today-seconds', String(todaySeconds))
  todayTime.textContent = `Today: ${formatDuration(todaySeconds).slice(3)}`

  try {
    persistSettings()
    const synced = await stopRemoteTimer()
    if (Number.isFinite(Number(synced?.durationSeconds))) {
      timerValue.textContent = formatDuration(Number(synced.durationSeconds))
    }
    setStatus(`Synced ${formatDuration(durationSeconds)} successfully.`)
  } catch (error) {
    setStatus(error.message || 'Sync failed', true)
  }

  updateLastUpdated()
}

function setActiveTask(taskId) {
  const items = projectList.querySelectorAll('.project-item')
  items.forEach((item) => {
    const isActive = item.dataset.taskId === String(taskId || '')
    item.classList.toggle('active', isActive)
  })
}

function updateLastUpdated() {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  let hh = now.getHours()
  const min = String(now.getMinutes()).padStart(2, '0')
  const ampm = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  lastUpdatedEl.textContent = `${dd}-${mm}-${yyyy} ${hh}:${min} ${ampm}`
}

startBtn.addEventListener('click', async () => {
  if (timerId) {
    await stopTimerAndSync()
    return
  }
  await startTimer()
})
stopBtn.addEventListener('click', stopTimerAndSync)
// Settings panel is opened from the tracker UI elsewhere (no floating icon).
projectList.addEventListener('click', (event) => {
  const btn = event.target.closest('.project-item')
  if (!btn) return
  const projectName = btn.dataset.project || ''
  const taskId = btn.dataset.taskId || ''
  if (projectSelectInput) projectSelectInput.value = projectName
  applyTaskSelectionById(taskId)
  persistSettings()
})
projectSearchInput.addEventListener('input', () => {
  const term = projectSearchInput.value.trim().toLowerCase()
  const items = projectList.querySelectorAll('.project-item')
  items.forEach((item) => {
    const name = `${String(item.dataset.project || '')} ${String(item.dataset.taskTitle || '')}`.toLowerCase()
    item.style.display = !term || name.includes(term) ? 'flex' : 'none'
  })
})
apiBaseInput.addEventListener('change', async () => {
  persistSettings()
  await refreshProjects(true)
})
userNameInput.addEventListener('change', persistSettings)
userIdInput.addEventListener('change', persistSettings)
projectNameInput.addEventListener('change', persistSettings)
taskIdInput.addEventListener('change', persistSettings)
taskTitleInput.addEventListener('change', persistSettings)
if (projectSelectInput) {
  projectSelectInput.addEventListener('change', async () => {
    const selectedProject = projectSelectInput.value.trim()
    projectNameInput.value = selectedProject
    taskIdInput.value = ''
    taskTitleInput.value = ''
    if (taskSelectInput) taskSelectInput.value = ''
    if (taskSelectInput) taskSelectInput.disabled = !selectedProject
    persistSettings()
    await refreshProjects(true)
  })
}
if (taskSelectInput) {
  taskSelectInput.addEventListener('change', () => {
    applyTaskSelectionById(taskSelectInput.value)
    persistSettings()
  })
}
if (loginBtn) loginBtn.addEventListener('click', loginTrackerUser)
if (openLoginBtn) openLoginBtn.addEventListener('click', showLoginForm)
if (backToEntranceBtn) backToEntranceBtn.addEventListener('click', showEntrance)
if (headerLoginBtn) {
  headerLoginBtn.addEventListener('click', () => {
    if (authUser?.email) return
    loginScreen.classList.remove('hidden')
    trackerContent.classList.add('hidden')
    showLoginForm()
  })
}
if (logoutBtn) logoutBtn.addEventListener('click', logoutTrackerUser)
if (authPasswordInput) {
  authPasswordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') loginTrackerUser()
  })
}

restoreSettings()
updateLastUpdated()
if (authUser?.email) refreshProjects(true)
projectRefreshId = window.setInterval(() => {
  refreshProjects(false)
}, 15000)

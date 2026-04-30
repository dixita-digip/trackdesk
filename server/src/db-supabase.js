const { createClient } = require('@supabase/supabase-js')

const PAGE = 1000

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env (use the service role key only on the server).',
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function fetchAll(supabase, table, columns = '*', order) {
  const out = []
  let from = 0
  while (true) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1)
    if (order) q = q.order(order.column, { ascending: order.ascending })
    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break
    out.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return out
}

async function deleteAllRows(supabase, table) {
  const { error } = await supabase.from(table).delete().not('id', 'is', null)
  if (error) throw error
}

async function deleteAllActivityLogs(supabase) {
  const { error } = await supabase.from('activity_logs').delete().not('id', 'is', null)
  if (error) throw error
}

async function deleteAllProjectMembers(supabase) {
  const { error } = await supabase.from('project_members').delete().not('project_id', 'is', null)
  if (error) throw error
}

function mapSystem(row) {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    location: row.location,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    statusHistory: Array.isArray(row.status_history) ? row.status_history : [],
  }
}

function mapEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    assignedTasks: row.assigned_tasks,
    completedTasks: row.completed_tasks,
    active: row.active,
    hours: row.hours,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    passwordResetRequired: row.password_reset_required,
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
  }
}

function mapProject(row, membersByProjectId) {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    description: row.description ?? '',
    priority: row.priority,
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    totalTasks: row.total_tasks,
    completedTasks: row.completed_tasks,
    status: row.status,
    members: membersByProjectId.get(row.id) || [],
  }
}

function mapTask(row) {
  const task = {
    id: row.id,
    title: row.title,
    project: row.project,
    priority: row.priority,
    status: row.status,
    description: row.description ?? '',
    timeEntries: Array.isArray(row.time_entries) ? row.time_entries : [],
  }
  if (row.assignee != null) task.assignee = row.assignee
  if (row.logged_hours != null) task.loggedHours = row.logged_hours
  if (row.logged_date != null) task.loggedDate = row.logged_date
  if (row.deadline != null) task.deadline = row.deadline
  if (row.created_at) task.createdAt = row.created_at
  if (row.active_timer) task.activeTimer = row.active_timer
  if (row.total_tracked_seconds != null && Number.isFinite(Number(row.total_tracked_seconds))) {
    task.totalTrackedSeconds = Number(row.total_tracked_seconds)
  }
  if (row.attachments?.length) task.attachments = row.attachments
  return task
}

function mapActivity(row) {
  return {
    id: row.id,
    action: row.action,
    details: row.details && typeof row.details === 'object' ? row.details : {},
    timestamp: row.logged_at,
  }
}

function mapSession(row) {
  return {
    id: row.id,
    ...(row.timer_id != null ? { timerId: row.timer_id } : {}),
    userId: row.user_id,
    userName: row.user_name,
    projectName: row.project_name,
    taskId: row.task_id,
    taskTitle: row.task_title ?? '',
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    source: row.source,
    createdAt: row.created_at,
  }
}

function mapTimer(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    projectName: row.project_name,
    taskId: row.task_id,
    taskTitle: row.task_title ?? '',
    source: row.source,
    startedAt: row.started_at,
    createdAt: row.created_at,
  }
}

function mapNotification(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  }
}

async function loadAppState(supabase) {
  const [counterRow] = await fetchAll(supabase, 'app_counters', '*')
  const next = counterRow || {
    next_system_id: 1,
    next_project_id: 1,
    next_task_id: 1,
    next_employee_id: 1,
    next_notification_id: 1,
    next_tracker_timer_id: 1,
  }

  const memberRows = await fetchAll(supabase, 'project_members', '*', {
    column: 'sort_order',
    ascending: true,
  })
  const membersByProjectId = new Map()
  for (const m of memberRows) {
    if (!membersByProjectId.has(m.project_id)) membersByProjectId.set(m.project_id, [])
    membersByProjectId.get(m.project_id).push(m.member_name)
  }

  const projectRows = await fetchAll(supabase, 'projects', '*', { column: 'id', ascending: false })
  const projects = projectRows.map((r) => mapProject(r, membersByProjectId))

  const systemRows = await fetchAll(supabase, 'systems', '*', { column: 'id', ascending: false })
  const systems = systemRows.map(mapSystem)

  const employeeRows = await fetchAll(supabase, 'employees', '*', { column: 'id', ascending: false })
  const employees = employeeRows.map(mapEmployee)

  const taskRows = await fetchAll(supabase, 'tasks', '*', { column: 'id', ascending: false })
  const tasks = taskRows.map(mapTask)

  const activityRows = await fetchAll(supabase, 'activity_logs', '*', { column: 'id', ascending: false })
  const activityLogs = activityRows.map(mapActivity)

  const sessionRows = await fetchAll(supabase, 'tracker_sessions', '*', { column: 'id', ascending: false })
  const trackerSessions = sessionRows.map(mapSession)

  const timerRows = await fetchAll(supabase, 'active_tracker_timers', '*', { column: 'id', ascending: false })
  const activeTrackerTimers = timerRows.map(mapTimer)

  const notifRows = await fetchAll(supabase, 'notifications', '*', { column: 'id', ascending: false })
  const notifications = notifRows.map(mapNotification)

  return {
    systems,
    projects,
    tasks,
    employees,
    activityLogs,
    trackerSessions,
    activeTrackerTimers,
    notifications,
    nextId: next.next_system_id,
    nextProjectId: next.next_project_id,
    nextTaskId: next.next_task_id,
    nextEmployeeId: next.next_employee_id,
    nextNotificationId: next.next_notification_id,
    nextTrackerTimerId: next.next_tracker_timer_id,
  }
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function insertChunks(supabase, table, rows, chunkSize = 200) {
  if (!rows.length) return
  for (const part of chunk(rows, chunkSize)) {
    const { error } = await supabase.from(table).insert(part)
    if (error) throw error
  }
}

async function persistFullState(supabase, state) {
  await deleteAllRows(supabase, 'notifications')
  await deleteAllRows(supabase, 'active_tracker_timers')
  await deleteAllRows(supabase, 'tracker_sessions')
  await deleteAllActivityLogs(supabase)
  await deleteAllRows(supabase, 'tasks')
  await deleteAllProjectMembers(supabase)
  await deleteAllRows(supabase, 'projects')
  await deleteAllRows(supabase, 'employees')
  await deleteAllRows(supabase, 'systems')

  const systems = state.systems.map((s) => ({
    id: s.id,
    name: s.name,
    owner: s.owner,
    location: s.location,
    status: s.status,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    status_history: s.statusHistory || [],
  }))

  const employees = state.employees.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role ?? 'Employee',
    assigned_tasks: e.assignedTasks ?? 0,
    completed_tasks: e.completedTasks ?? 0,
    active: e.active ?? true,
    hours: e.hours ?? '0h 00m',
    password_hash: e.passwordHash,
    password_salt: e.passwordSalt,
    password_reset_required: Boolean(e.passwordResetRequired),
    updated_at: e.updatedAt || null,
  }))

  const projects = state.projects.map((p) => ({
    id: p.id,
    name: p.name,
    owner: p.owner,
    description: p.description ?? '',
    priority: p.priority ?? 'medium',
    start_date: p.startDate ?? '',
    end_date: p.endDate ?? '',
    total_tasks: p.totalTasks ?? 0,
    completed_tasks: p.completedTasks ?? 0,
    status: p.status ?? 'active',
  }))

  const memberRows = []
  for (const p of state.projects) {
    const members = Array.isArray(p.members) ? p.members : []
    members.forEach((name, idx) => {
      memberRows.push({ project_id: p.id, member_name: name, sort_order: idx })
    })
  }

  const tasks = state.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    project: t.project,
    priority: t.priority ?? 'medium',
    status: t.status ?? 'backlog',
    description: t.description ?? '',
    assignee: t.assignee ?? null,
    logged_hours: t.loggedHours ?? null,
    logged_date: t.loggedDate ?? null,
    deadline: t.deadline ?? null,
    created_at: t.createdAt ?? null,
    active_timer: t.activeTimer ?? null,
    time_entries: Array.isArray(t.timeEntries) ? t.timeEntries : [],
    total_tracked_seconds: Number.isFinite(Number(t.totalTrackedSeconds)) ? Number(t.totalTrackedSeconds) : null,
    attachments: Array.isArray(t.attachments) ? t.attachments : null,
  }))

  const activityLogs = state.activityLogs.map((a) => ({
    id: a.id,
    action: a.action,
    details: a.details && typeof a.details === 'object' ? a.details : {},
    logged_at: a.timestamp,
  }))

  const trackerSessions = state.trackerSessions.map((s) => ({
    id: s.id,
    timer_id: s.timerId ?? null,
    user_id: s.userId,
    user_name: s.userName,
    project_name: s.projectName,
    task_id: s.taskId ?? null,
    task_title: s.taskTitle ?? '',
    started_at: s.startedAt,
    ended_at: s.endedAt,
    duration_seconds: s.durationSeconds,
    source: s.source ?? 'desktop',
    created_at: s.createdAt,
  }))

  const activeTrackerTimers = state.activeTrackerTimers.map((t) => ({
    id: t.id,
    user_id: t.userId,
    user_name: t.userName,
    project_name: t.projectName,
    task_id: t.taskId,
    task_title: t.taskTitle ?? '',
    source: t.source ?? 'desktop',
    started_at: t.startedAt,
    created_at: t.createdAt,
  }))

  const notifications = state.notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    read: n.read,
    created_at: n.createdAt,
  }))

  const counters = {
    id: 1,
    next_system_id: state.nextId,
    next_project_id: state.nextProjectId,
    next_task_id: state.nextTaskId,
    next_employee_id: state.nextEmployeeId,
    next_notification_id: state.nextNotificationId,
    next_tracker_timer_id: state.nextTrackerTimerId,
  }

  await insertChunks(supabase, 'systems', systems)
  await insertChunks(supabase, 'employees', employees)
  await insertChunks(supabase, 'projects', projects)
  await insertChunks(supabase, 'project_members', memberRows)
  await insertChunks(supabase, 'tasks', tasks)
  await insertChunks(supabase, 'activity_logs', activityLogs)
  await insertChunks(supabase, 'tracker_sessions', trackerSessions)
  await insertChunks(supabase, 'active_tracker_timers', activeTrackerTimers)
  await insertChunks(supabase, 'notifications', notifications)

  const { error: upErr } = await supabase.from('app_counters').upsert(counters, { onConflict: 'id' })
  if (upErr) throw upErr
}

function createSaveDb(supabase, getState) {
  let tail = Promise.resolve()
  function saveDb() {
    const job = tail.then(() => persistFullState(supabase, getState()))
    tail = job.catch((err) => {
      console.error('saveDb (Supabase) failed:', err)
    })
    return job
  }
  return saveDb
}

module.exports = {
  createSupabaseClient,
  loadAppState,
  createSaveDb,
  persistFullState,
}

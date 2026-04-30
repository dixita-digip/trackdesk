import axios from 'axios'

const rawApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').trim()
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

export async function getSystems() {
  const { data } = await api.get('/systems')
  return data
}

export async function getProjects() {
  const { data } = await api.get('/projects')
  return data
}

export async function createProject(payload) {
  const { data } = await api.post('/projects', payload)
  return data
}

export async function updateProject(id, payload) {
  const { data } = await api.patch(`/projects/${id}`, payload)
  return data
}

export async function deleteProject(id) {
  const { data } = await api.delete(`/projects/${id}`)
  return data
}

export async function getTasks() {
  const { data } = await api.get('/tasks')
  return data
}

export async function createTask(payload) {
  const { data } = await api.post('/tasks', payload)
  return data
}

export async function updateTask(id, payload) {
  const { data } = await api.patch(`/tasks/${id}`, payload)
  return data
}

export async function deleteTask(id) {
  const { data } = await api.delete(`/tasks/${id}`)
  return data
}

export async function getEmployees() {
  const { data } = await api.get('/employees')
  return data
}

export async function createEmployee(payload) {
  const { data } = await api.post('/employees', payload)
  return data
}

export async function updateEmployee(id, payload) {
  const { data } = await api.patch(`/employees/${id}`, payload)
  return data
}

export async function deleteEmployee(id) {
  const { data } = await api.delete(`/employees/${id}`)
  return data
}

export async function getReports() {
  const { data } = await api.get('/reports')
  return data
}

export async function getTimesheetReport(params) {
  const { data } = await api.get('/reports/timesheet', { params })
  return data
}

export async function createSystem(payload) {
  const { data } = await api.post('/systems', payload)
  return data
}

export async function updateSystemStatus(id, status) {
  const { data } = await api.patch(`/systems/${id}/status`, { status })
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export async function changePassword(payload) {
  const { data } = await api.post('/auth/change-password', payload)
  return data
}

export async function getNotifications(params) {
  const { data } = await api.get('/notifications', { params })
  return data
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}

export async function markNotificationsRead(ids) {
  const { data } = await api.patch('/notifications/read-many', { ids })
  return data
}

export async function deleteNotification(id) {
  const { data } = await api.delete(`/notifications/${id}`)
  return data
}

export async function deleteNotifications(ids) {
  const { data } = await api.delete('/notifications', { data: { ids } })
  return data
}

export async function startTrackerTimer(payload) {
  const { data } = await api.post('/tracker/timer/start', payload)
  return data
}

export async function stopTrackerTimer(payload) {
  const { data } = await api.post('/tracker/timer/stop', payload)
  return data
}

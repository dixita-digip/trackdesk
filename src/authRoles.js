/** Normalized app roles (must match server login payload). */
export function normalizeRole(raw) {
  const r = String(raw || '').trim()
  if (r === 'Admin' || r === 'Manager' || r === 'Employee') return r
  const lower = r.toLowerCase()
  if (lower === 'admin') return 'Admin'
  if (lower === 'manager') return 'Manager'
  return 'Employee'
}

export function roleNavLabel(role) {
  if (role === 'Admin') return 'Administrator'
  if (role === 'Manager') return 'Manager'
  return 'Team member'
}

export function canAccessReports(role) {
  return role === 'Admin' || role === 'Manager'
}

export function canManageEmployees(role) {
  return role === 'Admin'
}

/** Sidebar / route labels the signed-in role may open. */
export function allowedNavLabels(role) {
  const base = ['Dashboard', 'Projects', 'Tasks', 'Notifications', 'Help & Support']
  if (role === 'Admin') return [...base, 'Employees', 'Reports']
  if (role === 'Manager') return [...base, 'Reports']
  return base
}

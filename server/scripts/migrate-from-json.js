/**
 * One-time: copy data/db.json into Supabase.
 * Requires SUPABASE_* env and schema applied. Run from repo root:
 *   node server/scripts/migrate-from-json.js
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true })
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true, quiet: true })

const fs = require('fs')
const { createSupabaseClient, persistFullState } = require('../src/db-supabase')

const DB_PATH = path.join(__dirname, '../data/db.json')

function normalizeFromFile(parsed) {
  return {
    nextId: Number(parsed.nextId) || 1,
    nextProjectId: Number(parsed.nextProjectId) || 1,
    nextTaskId: Number(parsed.nextTaskId) || 1,
    nextEmployeeId: Number(parsed.nextEmployeeId) || 1,
    nextNotificationId: Number(parsed.nextNotificationId) || 1,
    nextTrackerTimerId: Number(parsed.nextTrackerTimerId) || 1,
    systems: Array.isArray(parsed.systems) ? parsed.systems : [],
    projects: Array.isArray(parsed.projects)
      ? parsed.projects.map((p) => ({
        ...p,
        members: Array.isArray(p.members) ? p.members : [],
      }))
      : [],
    tasks: Array.isArray(parsed.tasks)
      ? parsed.tasks.map((t) => ({
        ...t,
        deadline: t.deadline ? String(t.deadline).slice(0, 10) : null,
      }))
      : [],
    employees: Array.isArray(parsed.employees)
      ? parsed.employees.map((e) => ({
        ...e,
        email: e?.email ? String(e.email).trim().toLowerCase() : '',
        passwordHash: String(e?.passwordHash || ''),
        passwordSalt: String(e?.passwordSalt || ''),
        passwordResetRequired: Boolean(e?.passwordResetRequired),
      }))
      : [],
    activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
    trackerSessions: Array.isArray(parsed.trackerSessions) ? parsed.trackerSessions : [],
    activeTrackerTimers: Array.isArray(parsed.activeTrackerTimers) ? parsed.activeTrackerTimers : [],
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
  }
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('No file at', DB_PATH)
    process.exit(1)
  }
  const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  const n = normalizeFromFile(raw)
  const state = {
    systems: n.systems,
    projects: n.projects,
    tasks: n.tasks,
    employees: n.employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: e.role,
      assignedTasks: e.assignedTasks,
      completedTasks: e.completedTasks,
      active: e.active,
      hours: e.hours,
      passwordHash: e.passwordHash,
      passwordSalt: e.passwordSalt,
      passwordResetRequired: e.passwordResetRequired,
      ...(e.updatedAt ? { updatedAt: e.updatedAt } : {}),
    })),
    activityLogs: n.activityLogs,
    trackerSessions: n.trackerSessions,
    activeTrackerTimers: n.activeTrackerTimers,
    notifications: n.notifications,
    nextId: n.nextId,
    nextProjectId: n.nextProjectId,
    nextTaskId: n.nextTaskId,
    nextEmployeeId: n.nextEmployeeId,
    nextNotificationId: n.nextNotificationId,
    nextTrackerTimerId: n.nextTrackerTimerId,
  }

  const supabase = createSupabaseClient()
  await persistFullState(supabase, state)
  console.log('Migration finished. Rows written for all app tables.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

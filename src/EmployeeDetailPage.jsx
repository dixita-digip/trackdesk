import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  Avatar,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import { getProjects, getTimesheetReport } from './services/api'
import { canManageEmployees } from './authRoles.js'

const TEAM_ROW_AVATAR_COLORS = [
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
]

function formatDdMmYyyy(iso) {
  if (!iso || iso === '—') return '—'
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return String(iso)
  return `${d}-${m}-${y}`
}

function formatHoursCell(h) {
  const n = Number(h)
  if (!Number.isFinite(n)) return String(h ?? '—')
  const minutesTotal = Math.round(n * 60)
  const hours = Math.floor(minutesTotal / 60)
  const minutes = minutesTotal % 60
  return `${hours}h ${minutes}min`
}

function formatSecondsToHhMm(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds || 0)))
  const minutesTotal = Math.floor(s / 60)
  const hours = Math.floor(minutesTotal / 60)
  const minutes = minutesTotal % 60
  return `${hours}h ${minutes}min`
}

function isTaskCompletedStatus(status) {
  const s = String(status || '')
    .toLowerCase()
    .trim()
    .replace(/_/g, ' ')
  return s === 'completed' || s === 'done' || s === 'in review'
}

function nameKey(s) {
  return String(s || '').trim().toLowerCase()
}

function taskForEmployee(task, empName) {
  return nameKey(task.assignee) === nameKey(empName)
}

function projectForEmployee(project, empName) {
  const nk = nameKey(empName)
  const members = Array.isArray(project.members) ? project.members : []
  if (members.some((m) => nameKey(m) === nk)) return true
  if (nameKey(project.owner) === nk) return true
  return false
}

const TAB_SX = {
  minHeight: 44,
  '& .MuiTabs-flexContainer': {
    columnGap: { xs: 0.5, sm: 1 },
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '2px 2px 0 0',
    bgcolor: '#7c3aed',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 800,
    fontSize: { xs: '0.82rem', sm: '0.88rem' },
    color: '#64748b',
    minHeight: 44,
    minWidth: 'auto !important',
    width: 'auto',
    flexShrink: 0,
    py: 1.25,
    px: { xs: 1.5, sm: 2.25 },
    mx: { xs: 0.25, sm: 0.5 },
    letterSpacing: '-0.01em',
    '&.Mui-selected': { color: '#7c3aed' },
  },
}

export default function EmployeeDetailPage({ employees = [], tasks = [], setNotice, userRole, viewerName, onBack }) {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const id = Number(employeeId)

  const [tab, setTab] = useState(0)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [timesheetRows, setTimesheetRows] = useState([])
  const [timesheetTotal, setTimesheetTotal] = useState(0)
  const [timesheetLoading, setTimesheetLoading] = useState(false)

  const employee = useMemo(() => employees.find((e) => e.id === id), [employees, id])
  const empIdx = useMemo(() => employees.findIndex((e) => e.id === id), [employees, id])
  const avatarColor = TEAM_ROW_AVATAR_COLORS[(empIdx >= 0 ? empIdx : 0) % TEAM_ROW_AVATAR_COLORS.length]

  const canView = useMemo(() => {
    if (!employee) return false
    if (canManageEmployees(userRole)) return true
    return nameKey(employee.name) === nameKey(viewerName)
  }, [employee, userRole, viewerName])

  const employeeTasks = useMemo(() => {
    if (!employee) return []
    return tasks.filter((t) => taskForEmployee(t, employee.name)).sort((a, b) => Number(b.id) - Number(a.id))
  }, [tasks, employee])

  const assignedTotalTasks = employeeTasks.length
  const completedTotalTasks = employeeTasks.filter((t) => isTaskCompletedStatus(t?.status)).length
  const loggedSecondsTotal = employeeTasks.reduce((sum, t) => sum + Number(t?.totalTrackedSeconds || 0), 0)
  const loggedHoursLabel = formatSecondsToHhMm(loggedSecondsTotal)

  const assignedProjects = useMemo(() => {
    if (!employee) return []
    return projects.filter((p) => projectForEmployee(p, employee.name))
  }, [projects, employee])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setProjectsLoading(true)
      try {
        const data = await getProjects()
        if (mounted) setProjects(Array.isArray(data) ? data : [])
      } catch {
        if (mounted) setProjects([])
      } finally {
        if (mounted) setProjectsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const loadTimesheet = useCallback(async () => {
    if (!employee?.id) return
    setTimesheetLoading(true)
    try {
      const data = await getTimesheetReport({ employeeId: employee.id })
      setTimesheetRows(Array.isArray(data?.rows) ? data.rows : [])
      setTimesheetTotal(Number(data?.totalHours) || 0)
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load logged hours'
      setNotice?.({ type: 'error', message })
      setTimesheetRows([])
      setTimesheetTotal(0)
    } finally {
      setTimesheetLoading(false)
    }
  }, [employee?.id, setNotice])

  useEffect(() => {
    if (tab !== 2 || !employee?.id) return
    loadTimesheet()
  }, [tab, employee?.id, loadTimesheet])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [employeeId])

  const handleBack = () => {
    if (typeof onBack === 'function') onBack()
    else navigate(-1)
  }

  if (!Number.isFinite(id) || id < 1) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', py: 4 }}>
        <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.12)' }}>
          <Typography fontWeight={800} color="#1e1b4b" sx={{ mb: 1 }}>Invalid link</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ fontWeight: 700, textTransform: 'none' }}>
            Back to team
          </Button>
        </Card>
      </Box>
    )
  }

  if (!employee) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', py: 4 }}>
        <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.12)' }}>
          <Typography fontWeight={800} color="#1e1b4b" sx={{ mb: 1 }}>Employee not found</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ fontWeight: 700, textTransform: 'none' }}>
            Back to team
          </Button>
        </Card>
      </Box>
    )
  }

  if (!canView) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', py: 4 }}>
        <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(245,158,11,0.35)' }}>
          <Typography fontWeight={800} color="#1e1b4b" sx={{ mb: 1 }}>Access restricted</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.88rem', mb: 2 }}>You can only open your own profile from here.</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ fontWeight: 700, textTransform: 'none' }}>
            Back
          </Button>
        </Card>
      </Box>
    )
  }

  const detailCards = (
    <Stack spacing={2} sx={{ mt: 0.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, p: 2, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
            Email
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <AlternateEmailOutlinedIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
            <Typography sx={{ fontWeight: 700, color: '#334155', wordBreak: 'break-word' }}>{employee.email || '—'}</Typography>
          </Stack>
        </Card>
        <Card sx={{ flex: 1, p: 2, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
            Role
          </Typography>
          <Chip
            label={employee.role || 'Employee'}
            size="small"
            sx={{
              fontWeight: 800,
              height: 28,
              borderRadius: '10px',
              bgcolor: ['Admin', 'Manager'].includes(employee.role) ? 'rgba(124,58,237,0.12)' : 'rgba(16,185,129,0.1)',
              color: ['Admin', 'Manager'].includes(employee.role) ? '#7c3aed' : '#059669',
            }}
          />
        </Card>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, p: 2, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
            Assigned tasks (summary)
          </Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e1b4b' }}>{assignedTotalTasks}</Typography>
        </Card>
        <Card sx={{ flex: 1, p: 2, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
            Completed (summary)
          </Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{completedTotalTasks}</Typography>
        </Card>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Card sx={{ flex: 1, p: 2, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
            Hours (summary)
          </Typography>
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c3aed' }}>{loggedHoursLabel}</Typography>
        </Card>
        <Card sx={{ flex: 1, p: 2, borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
            Status
          </Typography>
          <Chip
            label={employee.active !== false ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              fontWeight: 800,
              height: 28,
              borderRadius: '10px',
              bgcolor: employee.active !== false ? 'rgba(16,185,129,0.14)' : 'rgba(148,163,184,0.14)',
              color: employee.active !== false ? '#059669' : '#64748b',
            }}
          />
        </Card>
      </Stack>
    </Stack>
  )

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      <Card
        sx={{
          mb: 2.5,
          borderRadius: '18px',
          overflow: 'hidden',
          border: '1px solid rgba(124, 58, 237, 0.1)',
          boxShadow: '0 4px 24px rgba(30, 27, 75, 0.06), 0 0 0 1px rgba(255,255,255,0.8) inset',
          background: 'linear-gradient(165deg, #ffffff 0%, #faf9ff 45%, #f5f3ff 100%)',
        }}
      >
        <Box sx={{ px: { xs: 2, sm: 2.75 }, pt: 2, pb: 2.25 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              sx={{
                width: 58,
                height: 58,
                bgcolor: avatarColor,
                fontSize: '1.22rem',
                fontWeight: 800,
                boxShadow: `0 0 0 3px #fff, 0 8px 22px ${avatarColor}48`,
                flexShrink: 0,
              }}
            >
              {String(employee.name || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1.5}
                flexWrap="wrap"
                sx={{ columnGap: 2, rowGap: 1 }}
              >
                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', sm: '1.38rem' },
                    color: '#1e1b4b',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                    flex: '1 1 auto',
                    minWidth: 'min(100%, 12rem)',
                  }}
                >
                  {employee.name}
                </Typography>
                <ButtonBase
                  onClick={handleBack}
                  focusRipple
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.65,
                    px: 0.85,
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    color: '#4338ca',
                    textTransform: 'none',
                    transition: 'color 0.15s, background-color 0.15s',
                    flexShrink: 0,
                    ml: 'auto',
                    '&:hover': {
                      color: '#7c3aed',
                      bgcolor: 'rgba(124, 58, 237, 0.08)',
                    },
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20, opacity: 0.92 }} />
                  Back to team
                </ButtonBase>
              </Stack>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, mt: 0.45 }}>
                {employee.email}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            borderTop: '1px solid rgba(148, 163, 184, 0.22)',
            bgcolor: 'rgba(248, 247, 255, 0.85)',
            px: { xs: 1.25, sm: 2 },
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={TAB_SX}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab disableRipple label="General details" />
            <Tab disableRipple label="Assigned projects" />
            <Tab disableRipple label="Logged hours" />
            <Tab disableRipple label="Tasks" />
          </Tabs>
        </Box>
      </Card>

      {tab === 0 && detailCards}

      {tab === 1 && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          {projectsLoading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} sx={{ color: '#7c3aed' }} /></Box>
          ) : assignedProjects.length === 0 ? (
            <Box sx={{ py: 5, px: 3, textAlign: 'center' }}>
              <FolderOpenOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography sx={{ color: '#64748b', fontWeight: 700 }}>No projects assigned as member or owner.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafe' }}>
                  {['Project', 'Owner', 'Priority', 'Status', 'Your role'].map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 800, fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.08 }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedProjects.map((p) => {
                  const isOwner = nameKey(p.owner) === nameKey(employee.name)
                  return (
                    <TableRow key={p.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e1b4b' }}>{p.name}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{p.owner || '—'}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{p.priority || '—'}</TableCell>
                      <TableCell>
                        <Chip label={p.status || '—'} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#7c3aed' }}>{isOwner ? 'Owner' : 'Member'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {tab === 2 && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeOutlinedIcon sx={{ color: '#7c3aed' }} />
              <Typography sx={{ fontWeight: 800, color: '#1e1b4b' }}>Time by project &amp; task</Typography>
            </Stack>
            <Chip
              label={`Total ${formatHoursCell(timesheetTotal)}`}
              sx={{ fontWeight: 800, bgcolor: 'rgba(124,58,237,0.1)', color: '#6d28d9' }}
            />
          </Box>
          {timesheetLoading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} sx={{ color: '#7c3aed' }} /></Box>
          ) : timesheetRows.length === 0 ? (
            <Box sx={{ py: 5, px: 3, textAlign: 'center' }}>
              <Typography sx={{ color: '#64748b', fontWeight: 700 }}>No logged hours found for this employee.</Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mt: 0.5 }}>Hours appear when the desktop tracker saves sessions or tasks include logged time.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafe' }}>
                  {['Date', 'Project', 'Task', 'Status', 'Hours'].map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 800, fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.08, ...(col === 'Hours' ? { textAlign: 'right' } : {}) }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {timesheetRows.map((r, i) => (
                  <TableRow key={`${r.date}-${r.task}-${i}`} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDdMmYyyy(r.date)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e1b4b' }}>{r.project || '—'}</TableCell>
                    <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{r.task || '—'}</TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.78rem' }}>{r.status || '—'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#7c3aed' }}>{formatHoursCell(r.hours)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {tab === 3 && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          {employeeTasks.length === 0 ? (
            <Box sx={{ py: 5, px: 3, textAlign: 'center' }}>
              <AssignmentOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography sx={{ color: '#64748b', fontWeight: 700 }}>No tasks assigned to this employee.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafe' }}>
                  {['Task', 'Project', 'Status', 'Deadline', 'Logged hours'].map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 800, fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.08, ...(col === 'Logged hours' ? { textAlign: 'right' } : {}) }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeTasks.map((t) => (
                  <TableRow key={t.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1e1b4b', maxWidth: 240 }}>{t.title || '—'}</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{t.project || '—'}</TableCell>
                    <TableCell>
                      <Chip label={t.status || '—'} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ color: '#475569', whiteSpace: 'nowrap' }}>{t.deadline ? formatDdMmYyyy(t.deadline) : '—'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#334155' }}>{t.loggedHours != null && t.loggedHours !== '' ? formatHoursCell(t.loggedHours) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </Box>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  ButtonBase,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Pagination,
  Skeleton,
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
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import DownloadIcon from '@mui/icons-material/Download'
import { getProjects, getTimesheetReport, getEmployeeScreenCaptures } from './services/api'
import { canManageEmployees } from './authRoles.js'
import { DataTableSkeleton, EmployeeDetailFiveColTableSkeleton, EmployeeDetailTimesheetToolbarSkeleton } from './pageSkeletons.jsx'

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

function formatCaptureWhen(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
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

/** Desktop captures: items per page (responsive row grid). */
const CAPTURES_PER_PAGE = 6

const CAPTURE_GRID_SX = {
  display: 'grid',
  gap: 1.5,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
  },
}

/** Matches loaded capture cards: image region + caption band. */
const CAPTURE_CARD_OUTER_SX = {
  borderRadius: '12px',
  overflow: 'hidden',
  bgcolor: '#f8fafc',
  border: '1px solid rgba(124,58,237,0.08)',
  display: 'flex',
  flexDirection: 'column',
}

const CAPTURE_IMAGE_AREA_SX = {
  width: '100%',
  aspectRatio: '16/10',
  minHeight: { xs: 184, sm: 208, md: 228 },
  flexShrink: 0,
  display: 'block',
  bgcolor: '#e2e8f0',
}

const CAPTURE_CARD_FOOTER_SX = {
  p: 1.15,
  pt: 1,
  flexShrink: 0,
  minHeight: 52,
}

const CAPTURES_PAGINATION_FOOTER_SX = {
  py: 2,
  px: 2,
  borderTop: '1px solid rgba(0,0,0,0.06)',
  bgcolor: 'rgba(248, 250, 252, 0.75)',
}

const CAPTURES_PAGINATION_SX = {
  '& .MuiPaginationItem-root': { fontWeight: 700 },
  '& .MuiPaginationItem-root.Mui-selected': {
    bgcolor: 'rgba(124, 58, 237, 0.14) !important',
    color: '#5b21b6',
  },
}

/** Full-width state view — matches employee profile shell instead of a small floating card. */
function EmployeeDetailUnavailable({
  title,
  description,
  onBack,
  svgIcon = LockOutlinedIcon,
  variant = 'default',
}) {
  const Illustration = svgIcon
  const isAccess = variant === 'access'
  const avatarBg = isAccess ? 'rgba(245, 158, 11, 0.18)' : 'rgba(124, 58, 237, 0.14)'
  const avatarColor = isAccess ? '#b45309' : '#6d28d9'
  const cardBorder = isAccess ? '1px solid rgba(245, 158, 11, 0.28)' : '1px solid rgba(124, 58, 237, 0.1)'
  const cardBg = isAccess
    ? 'linear-gradient(165deg, #ffffff 0%, #fffbeb 42%, #fef3c7 100%)'
    : 'linear-gradient(165deg, #ffffff 0%, #faf9ff 45%, #f5f3ff 100%)'

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      <Card
        sx={{
          borderRadius: '18px',
          overflow: 'hidden',
          border: cardBorder,
          boxShadow: '0 4px 24px rgba(30, 27, 75, 0.06), 0 0 0 1px rgba(255,255,255,0.8) inset',
          background: cardBg,
        }}
      >
        <Box sx={{ px: { xs: 2, sm: 2.75 }, pt: 2, pb: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              sx={{
                width: 58,
                height: 58,
                bgcolor: avatarBg,
                color: avatarColor,
                flexShrink: 0,
                borderRadius: '16px',
              }}
            >
              <Illustration sx={{ fontSize: 30 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                alignItems="flex-start"
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
                    lineHeight: 1.25,
                    flex: '1 1 auto',
                    minWidth: 'min(100%, 12rem)',
                  }}
                >
                  {title}
                </Typography>
                <ButtonBase
                  onClick={onBack}
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
                    color: isAccess ? '#b45309' : '#4338ca',
                    textTransform: 'none',
                    transition: 'color 0.15s, background-color 0.15s',
                    flexShrink: 0,
                    ml: 'auto',
                    '&:hover': {
                      color: isAccess ? '#92400e' : '#7c3aed',
                      bgcolor: isAccess ? 'rgba(245, 158, 11, 0.1)' : 'rgba(124, 58, 237, 0.08)',
                    },
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20, opacity: 0.92 }} />
                  Back to team
                </ButtonBase>
              </Stack>
              {description ? (
                <Typography
                  sx={{
                    mt: 1.25,
                    fontSize: '0.92rem',
                    color: '#64748b',
                    fontWeight: 500,
                    lineHeight: 1.55,
                    maxWidth: '44rem',
                  }}
                >
                  {description}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Box>
      </Card>
    </Box>
  )
}

export default function EmployeeDetailPage({
  employees = [],
  employeesFetchSettled = true,
  tasks = [],
  setNotice,
  userRole,
  viewerName,
  onBack,
}) {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const id = Number(employeeId)

  const [tab, setTab] = useState(0)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [timesheetRows, setTimesheetRows] = useState([])
  const [timesheetTotal, setTimesheetTotal] = useState(0)
  const [timesheetLoading, setTimesheetLoading] = useState(false)
  const [screenCaptures, setScreenCaptures] = useState([])
  const [screenCapturesTotal, setScreenCapturesTotal] = useState(0)
  const [screenCapturesLoading, setScreenCapturesLoading] = useState(false)
  const [capturesPage, setCapturesPage] = useState(1)
  const [selectedCaptureIndex, setSelectedCaptureIndex] = useState(-1)
  const [captureZoom, setCaptureZoom] = useState(1)
  const screenCapturesEmployeeRef = useRef(null)
  const redirectAwayRef = useRef(false)

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
    redirectAwayRef.current = false
  }, [employeeId])

  useEffect(() => {
    if (redirectAwayRef.current) return

    if (!Number.isFinite(id) || id < 1) {
      redirectAwayRef.current = true
      setNotice?.({ type: 'info', message: 'That profile link is not valid.' })
      onBack?.()
      return
    }

    if (!employeesFetchSettled) return

    const found = employees.some((e) => Number(e.id) === id)
    if (found) return

    redirectAwayRef.current = true
    setNotice?.({
      type: 'info',
      message: 'That team member could not be opened. They may have been removed.',
    })
    onBack?.()
  }, [id, employees, employeesFetchSettled, onBack, setNotice])

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

  const loadScreenCaptures = useCallback(
    async (pageNum) => {
      if (!employee?.id) return
      const p = Math.max(1, Number(pageNum) || 1)
      setScreenCapturesLoading(true)
      try {
        const data = await getEmployeeScreenCaptures(employee.id, { page: p, pageSize: CAPTURES_PER_PAGE })
        setScreenCaptures(Array.isArray(data?.items) ? data.items : [])
        setScreenCapturesTotal(Number(data?.total) || 0)
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || 'Failed to load screen captures'
        setNotice?.({ type: 'error', message })
        setScreenCaptures([])
        setScreenCapturesTotal(0)
      } finally {
        setScreenCapturesLoading(false)
      }
    },
    [employee?.id, setNotice],
  )

  const capturesPageCount = useMemo(
    () => Math.max(1, Math.ceil(screenCapturesTotal / CAPTURES_PER_PAGE)),
    [screenCapturesTotal],
  )

  useEffect(() => {
    if (tab !== 4 || !employee?.id) return
    if (screenCapturesEmployeeRef.current !== employee.id) {
      screenCapturesEmployeeRef.current = employee.id
      setCapturesPage(1)
      void loadScreenCaptures(1)
      return
    }
    void loadScreenCaptures(capturesPage)
  }, [tab, employee?.id, capturesPage, loadScreenCaptures])

  useEffect(() => {
    if (capturesPage > capturesPageCount) setCapturesPage(capturesPageCount)
  }, [capturesPage, capturesPageCount])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [employeeId])

  useEffect(() => {
    if (tab !== 4) {
      setSelectedCaptureIndex(-1)
      setCaptureZoom(1)
    }
  }, [tab])

  useEffect(() => {
    setSelectedCaptureIndex(-1)
    setCaptureZoom(1)
  }, [capturesPage])

  const selectedCapture = useMemo(
    () => (selectedCaptureIndex >= 0 && selectedCaptureIndex < screenCaptures.length ? screenCaptures[selectedCaptureIndex] : null),
    [selectedCaptureIndex, screenCaptures],
  )

  const selectedCaptureSrc = useMemo(() => {
    if (!selectedCapture) return ''
    return selectedCapture.fullImageUrl || selectedCapture.imageUrl || selectedCapture.dataUrl || ''
  }, [selectedCapture])

  async function handleDownloadSelectedCapture() {
    if (!selectedCaptureSrc) return
    const stampRaw = String(selectedCapture?.capturedAt || '').replace(/[^\d]/g, '').slice(0, 14)
    const stamp = stampRaw || Date.now()
    const fileName = `capture-display-${Number(selectedCapture?.displayIndex ?? 0) + 1}-${stamp}.png`
    try {
      const response = await fetch(selectedCaptureSrc)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(selectedCaptureSrc, '_blank', 'noopener,noreferrer')
    }
  }

  const handleBack = () => {
    if (typeof onBack === 'function') onBack()
    else navigate(-1)
  }

  const invalidId = !Number.isFinite(id) || id < 1

  if (invalidId) {
    return null
  }

  if (!employee) {
    if (!employeesFetchSettled) {
      return (
        <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#7c3aed' }} />
        </Box>
      )
    }
    return null
  }

  if (!canView) {
    return (
      <EmployeeDetailUnavailable
        title="Access restricted"
        description="You can only open your own profile here. Ask an admin if you need to view someone else’s details."
        onBack={handleBack}
        svgIcon={LockOutlinedIcon}
        variant="access"
      />
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
            <Tab disableRipple label="Desktop captures" />
          </Tabs>
        </Box>
      </Card>

      {tab === 0 && detailCards}

      {tab === 1 && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          {projectsLoading ? (
            <Box sx={{ overflowX: 'auto' }}>
              <EmployeeDetailFiveColTableSkeleton />
            </Box>
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
            <>
              <EmployeeDetailTimesheetToolbarSkeleton />
              <Box sx={{ overflowX: 'auto' }}>
                <DataTableSkeleton columns={5} rows={6} />
              </Box>
            </>
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

      {tab === 4 && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,27,75,0.04)' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }} style={{alignItems: 'center'}}>
              <PhotoLibraryOutlinedIcon sx={{ color: '#7c3aed' }} />
              <Typography sx={{ fontWeight: 800, color: '#1e1b4b', fontSize: '1rem' }}>Desktop screen captures</Typography>
            </Stack>
          </Box>
          {screenCapturesLoading ? (
            <>
              <Box sx={{ p: 2 }}>
                <Box sx={CAPTURE_GRID_SX}>
                  {Array.from({ length: CAPTURES_PER_PAGE }, (_, i) => (
                    <Box key={`capture-skeleton-${i}`} sx={CAPTURE_CARD_OUTER_SX}>
                      <Skeleton
                        variant="rectangular"
                        animation="wave"
                        sx={{
                          ...CAPTURE_IMAGE_AREA_SX,
                          bgcolor: '#e8ecf4',
                        }}
                      />
                      <Box sx={CAPTURE_CARD_FOOTER_SX}>
                        <Skeleton variant="rectangular" animation="wave" height={38} sx={{ borderRadius: '8px', bgcolor: 'rgba(148,163,184,0.22)' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Stack alignItems="center" sx={CAPTURES_PAGINATION_FOOTER_SX}>
                <Box sx={{ pointerEvents: 'none', opacity: 0.72 }}>
                  <Pagination
                    count={1}
                    page={1}
                    onChange={() => {}}
                    color="primary"
                    shape="rounded"
                    size="small"
                    siblingCount={0}
                    boundaryCount={1}
                    sx={CAPTURES_PAGINATION_SX}
                  />
                </Box>
                <Typography variant="caption" sx={{ mt: 1.25, color: '#64748b', fontWeight: 600 }}>
                  Loading captures…
                </Typography>
              </Stack>
            </>
          ) : screenCaptures.length === 0 ? (
            <Box sx={{ py: 5, px: 3, textAlign: 'center' }}>
              <PhotoLibraryOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography sx={{ color: '#64748b', fontWeight: 700 }}>No captures yet.</Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mt: 0.5 }}>
                The employee must be logged into the desktop tracker with the same API URL as this site so uploads can reach the server.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2 }}>
                <Box sx={CAPTURE_GRID_SX}>
                  {screenCaptures.map((item) => (
                    <Box key={item.id} sx={CAPTURE_CARD_OUTER_SX}>
                      <Box
                        component="img"
                        src={item.imageUrl || item.dataUrl}
                        alt={`Display ${Number(item.displayIndex ?? 0) + 1} at ${formatCaptureWhen(item.capturedAt)}`}
                        loading="lazy"
                        sx={{
                          ...CAPTURE_IMAGE_AREA_SX,
                          objectFit: 'cover',
                          cursor: 'zoom-in',
                        }}
                        onClick={() => {
                          const idx = screenCaptures.findIndex((x) => String(x.id) === String(item.id))
                          setSelectedCaptureIndex(idx)
                          setCaptureZoom(1)
                        }}
                      />
                      <Box sx={CAPTURE_CARD_FOOTER_SX}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e1b4b', letterSpacing: '-0.01em' }}>
                          Display {Number(item.displayIndex ?? 0) + 1}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, mt: 0.25 }}>
                          {formatCaptureWhen(item.capturedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
              {screenCapturesTotal > 0 && (
                <Stack alignItems="center" sx={CAPTURES_PAGINATION_FOOTER_SX}>
                  <Pagination
                    count={capturesPageCount}
                    page={capturesPage}
                    onChange={(_, p) => setCapturesPage(p)}
                    color="primary"
                    shape="rounded"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                    sx={CAPTURES_PAGINATION_SX}
                  />
                  <Typography variant="caption" sx={{ mt: 1.25, color: '#64748b', fontWeight: 600 }}>
                    {screenCapturesTotal} capture{screenCapturesTotal !== 1 ? 's' : ''} · page {capturesPage} of {capturesPageCount}
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </Card>
      )}

      <Dialog
        open={Boolean(selectedCapture)}
        onClose={() => {
          setSelectedCaptureIndex(-1)
          setCaptureZoom(1)
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f172a',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(148,163,184,0.25)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            px: { xs: 1.25, sm: 1.5 },
            py: 1.1,
            borderBottom: '1px solid rgba(148,163,184,0.18)',
            gap: { xs: 0.9, sm: 1.2 },
            bgcolor: 'rgba(15,23,42,0.95)',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.65}
            sx={{
              flex: 1,
              p: 0.45,
              pr: 0.7,
              borderRadius: '10px',
              bgcolor: 'rgba(148,163,184,0.10)',
              border: '1px solid rgba(148,163,184,0.2)',
              maxWidth: 'max-content',
            }}
            style={{ alignItems: 'center'}}
          >
            <IconButton
              size="small"
              sx={{
                color: '#cbd5e1',
                bgcolor: 'rgba(15,23,42,0.45)',
                '&:hover': { bgcolor: 'rgba(148,163,184,0.16)' },
                '&.Mui-disabled': {
                  color: 'rgba(148,163,184,0.45)',
                  bgcolor: 'rgba(15,23,42,0.2)',
                  border: '1px solid rgba(148,163,184,0.16)',
                  opacity: 1,
                },
              }}
              aria-label="Previous capture"
              disabled={selectedCaptureIndex <= 0}
              onClick={() => {
                setSelectedCaptureIndex((prev) => Math.max(0, prev - 1))
                setCaptureZoom(1)
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography
              sx={{
                color: '#e2e8f0',
                fontWeight: 700,
                fontSize: '0.82rem',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: 180, sm: 320, md: 440 },
              }}
            >
              {selectedCapture
                ? `Display ${Number(selectedCapture.displayIndex ?? 0) + 1} · ${formatCaptureWhen(selectedCapture.capturedAt)}`
                : 'Capture preview'}
            </Typography>
            <Typography
              sx={{
                color: '#94a3b8',
                fontWeight: 700,
                fontSize: '0.72rem',
                ml: 0.35,
                px: 0.7,
                py: 0.2,
                borderRadius: '999px',
                bgcolor: 'rgba(15,23,42,0.45)',
                border: '1px solid rgba(148,163,184,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedCaptureIndex + 1}/{screenCaptures.length}
            </Typography>
            <IconButton
              size="small"
              sx={{
                color: '#cbd5e1',
                bgcolor: 'rgba(15,23,42,0.45)',
                '&:hover': { bgcolor: 'rgba(148,163,184,0.16)' },
                '&.Mui-disabled': {
                  color: 'rgba(148,163,184,0.45)',
                  bgcolor: 'rgba(15,23,42,0.2)',
                  border: '1px solid rgba(148,163,184,0.16)',
                  opacity: 1,
                },
              }}
              aria-label="Next capture"
              disabled={selectedCaptureIndex < 0 || selectedCaptureIndex >= screenCaptures.length - 1}
              onClick={() => {
                setSelectedCaptureIndex((prev) => Math.min(screenCaptures.length - 1, prev + 1))
                setCaptureZoom(1)
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.35}
            sx={{
              justifyContent: 'center',
              alignSelf: { xs: 'center', sm: 'auto' },
              p: 0.4,
              borderRadius: '10px',
              bgcolor: 'rgba(148,163,184,0.10)',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
            style={{alignItems: 'center'}}
          >
            <IconButton
              size="small"
              sx={{ color: '#cbd5e1', '&:hover': { bgcolor: 'rgba(148,163,184,0.18)' } }}
              aria-label="Zoom out"
              onClick={() => setCaptureZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Typography
              sx={{
                color: '#cbd5e1',
                fontSize: '0.74rem',
                fontWeight: 700,
                minWidth: 46,
                textAlign: 'center',
                px: 0.45,
                py: 0.3,
                borderRadius: '7px',
                bgcolor: 'rgba(15,23,42,0.45)',
                border: '1px solid rgba(148,163,184,0.24)',
              }}
              style={{textAlign: 'center'}}
            >
              {Math.round(captureZoom * 100)}%
            </Typography>
            <IconButton
              size="small"
              sx={{ color: '#cbd5e1', '&:hover': { bgcolor: 'rgba(148,163,184,0.18)' } }}
              aria-label="Zoom in"
              onClick={() => setCaptureZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: '#93c5fd', '&:hover': { bgcolor: 'rgba(59,130,246,0.18)' } }}
              aria-label="Download image"
              onClick={() => {
                void handleDownloadSelectedCapture()
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => {
                setSelectedCaptureIndex(-1)
                setCaptureZoom(1)
              }}
              size="small"
              sx={{ color: '#fca5a5', '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } }}
              aria-label="Close preview"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
        <Box sx={{ p: 1.5, bgcolor: '#0b1020', display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
          {selectedCapture ? (
            <Box
              component="img"
              src={selectedCaptureSrc}
              alt={`Desktop capture preview at ${formatCaptureWhen(selectedCapture.capturedAt)}`}
              sx={{
                width: 'auto',
                maxWidth: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '10px',
                bgcolor: '#111827',
                transform: `scale(${captureZoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease',
              }}
            />
          ) : null}
        </Box>
      </Dialog>
    </Box>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { useMediaQuery, useTheme } from '@mui/material'
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Badge,
} from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import MailOutlinedIcon from '@mui/icons-material/MailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import MenuIcon from '@mui/icons-material/Menu'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import FolderIcon from '@mui/icons-material/Folder'
import AssignmentIcon from '@mui/icons-material/Assignment'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShieldIcon from '@mui/icons-material/Shield'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import CloseIcon from '@mui/icons-material/Close'
import {
  clearAuthToken,
  deleteNotifications,
  getEmployees,
  getNotifications,
  getSystems,
  getTasks,
  changePassword,
  loginUser,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsRead,
  setAuthToken,
} from './services/api'
import {
  allowedNavLabels,
  canAccessReports,
  canManageEmployees,
  normalizeRole,
  roleNavLabel,
} from './authRoles.js'
import ProjectsPage from './ProjectsPage.jsx'
import TasksPage from './TasksPage.jsx'
import EmployeesPage from './EmployeesPage.jsx'
import ReportsPage from './ReportsPage.jsx'
import NotificationsPage from './NotificationsPage.jsx'
import EmployeeDetailPage from './EmployeeDetailPage.jsx'
import { DashboardPageSkeleton, EmployeesModuleSkeleton } from './pageSkeletons.jsx'
import { notify } from './notify.js'

const TRACKER_DOWNLOAD_URL = 'https://github.com/dixita-digip/trackdesk/releases/download/tracker-v1.0.0/tracker-setup.exe'
// Optional but recommended: fill with the exact SHA-256 hash of the installer you uploaded.
// If left empty, the UI will hide the hash section.
const TRACKER_INSTALLER_SHA256 = '47130F3F643F36FEA3E429F2B5F412F912D7DA4D9C95F7DA0B1B2EA16F8B9366'

function HelpSupportPage({ setNotice, onDownloadTracker }) {
  const whyItems = [
    'Automatic work-hour capture helps avoid manual timesheet mistakes.',
    'Activity logs improve visibility for project planning and billing.',
    'Managers can identify blockers early from real-time tracking data.',
    'Task-wise time insights help improve team productivity and estimates.',
  ]

  const startItems = [
    'Ensure your employee account is active and you can log in to the web app.',
    'Download and install the Tracker app from the profile dropdown (opens GitHub Releases).',
    'Allow required permissions on your operating system when prompted.',
    'Keep internet enabled periodically so logs can sync to server.',
  ]

  const steps = [
    { title: 'Install', body: 'Open profile menu in the web app and click "Download Tracker App" to download the installer from GitHub Releases. Run the installer.' },
    { title: 'Sign In', body: 'Launch Tracker and log in with your employee email and password.' },
    { title: 'Start Tracking', body: 'Click Start Tracking when your work begins. Keep the app running in background.' },
    { title: 'Assign Task Context', body: 'Select project/task when prompted so your tracked time is mapped correctly.' },
    { title: 'Pause / Resume', body: 'Pause tracking during breaks and resume when you continue work.' },
    { title: 'Stop & Sync', body: 'Stop tracking after work. Confirm session sync to server before logout.' },
  ]

  const bestPractices = [
    'Start tracker at shift start',
    'Pause during breaks',
    'Tag correct project/task',
    'Sync before shutdown',
    'Keep app updated',
    'Report sync errors quickly',
  ]

  return (
    <Box sx={{ width: '100%', display: 'grid', gap: 2.25 }}>
      <Card
        sx={{
          borderRadius: '20px',
          border: '1px solid rgba(124,58,237,0.16)',
          boxShadow: '0 12px 34px rgba(124,58,237,0.12)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f7f3ff 55%, #edf5ff 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: -70, right: -80, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(124,58,237,0.10)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: -50, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(59,130,246,0.08)' }} />
        <CardContent sx={{ p: { xs: 2.8, md: 3.6 }, position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} style={{justifyContent: 'space-between', alignItems: 'center'}} alignItems={{ xs: 'flex-start', lg: 'center' }}>
            <Box>
              <Chip
                label="Tracker Help Center"
                size="small"
                sx={{ mb: 1.25, bgcolor: 'rgba(124,58,237,0.12)', color: '#6d28d9', border: '1px solid rgba(124,58,237,0.18)', fontWeight: 800 }}
              />
              <Typography fontWeight={900} sx={{ fontSize: { xs: '1.35rem', md: '1.58rem' }, color: '#1e1b4b', mb: 0.65, letterSpacing: '-0.015em' }} style={{fontWeight:800}}>
                Tracker Software Guide
              </Typography>
              <Typography sx={{ fontSize: { xs: '0.92rem', md: '0.98rem' }, color: '#64748b', maxWidth: 760, lineHeight: 1.65 }}>
                Understand why the Tracker app matters and follow the best workflow to capture accurate, reliable work logs.
              </Typography>
            </Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.2}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                alignSelf: { xs: 'stretch', lg: 'flex-end' },
                ml: { lg: 'auto' },
                p: { xs: 0, sm: 0.6 },
              }}
            >
              <Button
                variant="contained"
                startIcon={<DownloadOutlinedIcon style={{fontSize: '1.7 rem'}}/>}
                onClick={() => {
                  onDownloadTracker?.()
                }}
                style={{
                  padding:"10px"
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  px: 1.8,
                  minHeight: 38,
                  minWidth: { sm: 148 },
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  fontSize: '1rem',
                  '& .MuiButton-startIcon': { mr: 0.55, ml: -0.2 },
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 8px 18px rgba(124,58,237,0.28)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
                    boxShadow: '0 10px 22px rgba(109,40,217,0.35)',
                  },
                }}
              >
                Download Tracker App
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<MailOutlinedIcon style={{fontSize: '1.7 rem'}}/>}
                onClick={() => {
                  window.location.href = 'mailto:support@system.local?subject=Tracker%20Software%20Help'
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  px: 1.8,
                  minHeight: 38,
                  minWidth: { sm: 148 },
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  fontSize: '1rem',
                  '& .MuiButton-startIcon': { mr: 0.55, ml: -0.2 },
                  bgcolor: '#fff',
                  color: '#5b21b6',
                  borderColor: 'rgba(124,58,237,0.26)',
                  boxShadow: '0 6px 14px rgba(15,23,42,0.06)',
                  '&:hover': {
                    bgcolor: '#faf5ff',
                    borderColor: 'rgba(124,58,237,0.38)',
                    boxShadow: '0 8px 18px rgba(91,33,182,0.14)',
                  },
                }}
              >
                Contact Support
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 2.2 }}>
            {[
              {
                value: 'Accurate logs',
                label: 'Daily time capture',
                icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 14 }} />,
                accent: '#7c3aed',
                soft: 'rgba(124,58,237,0.10)',
              },
              {
                value: 'Real-time visibility',
                label: 'Manager insights',
                icon: <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />,
                accent: '#2563eb',
                soft: 'rgba(37,99,235,0.10)',
              },
              {
                value: 'Better planning',
                label: 'Task-level analytics',
                icon: <TrendingUpIcon sx={{ fontSize: 14 }} />,
                accent: '#0ea5e9',
                soft: 'rgba(14,165,233,0.10)',
              },
            ].map((kpi) => (
              <Box
                key={kpi.value}
                sx={{
                  px: 1.3,
                  py: 1,
                  borderRadius: '11px',
                  bgcolor: 'rgba(255,255,255,0.88)',
                  border: '1px solid rgba(124,58,237,0.14)',
                  boxShadow: '0 1px 10px rgba(15,23,42,0.04)',
                  flex: 1,
                  minWidth: 170,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.22s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    bgcolor: kpi.accent,
                  },
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 18px rgba(15,23,42,0.09)',
                    borderColor: 'rgba(124,58,237,0.22)',
                  },
                }}
                style={{paddingTop:"15px"}}
              >
                <Stack direction="row" spacing={0.85} alignItems="center" sx={{ mb: 0.3 }}>
                  <Box
                    sx={{
                      width: 35,
                      height: 35,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: kpi.accent,
                      bgcolor: kpi.soft,
                      border: `1px solid ${kpi.soft.replace('0.10', '0.35')}`,
                      flexShrink: 0,
                    }}
                  >
                    {kpi.icon}
                  </Box>
                  <Box style={{display:"flex", flexDirection:"column", gap:"1px"}}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.2 }}>
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#64748b', pl: 0.1 }}>
                  {kpi.label}
                </Typography>
                </Box>
                </Stack>
               
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.1fr 1fr' }, gap: 2.25 }}>
        <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)' }}>
          <CardContent sx={{ p: { xs: 2.7, md: 3.2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight={800} sx={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e1b4b', mb: 1.4 }}>
              Why Use Tracker Software?
            </Typography>
            <Stack spacing={1.15} sx={{ flex: 1, justifyContent: 'space-between' }}>
              {whyItems.map((item) => (
                <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, mt: '2px', color: '#7c3aed', flexShrink: 0 }} />
                  <Typography sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.62 }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)' }}>
          <CardContent sx={{ p: { xs: 2.7, md: 3.2 } }}>
            <Typography fontWeight={800} sx={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e1b4b', mb: 1.4 }}>
              Before You Start
            </Typography>
            <Stack spacing={1}>
              {startItems.map((item, idx) => (
                <Box
                  key={item}
                  sx={{
                    p: 1.2,
                    borderRadius: '10px',
                    bgcolor: idx % 2 === 0 ? '#f8f7ff' : '#f4f7ff',
                    border: '1px solid rgba(124,58,237,0.10)',
                  }}
                >
                  <Typography sx={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>{item}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)' }}>
        <CardContent sx={{ p: { xs: 2.7, md: 3.2 } }}>
          <Typography fontWeight={800} sx={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e1b4b', mb: 1.4 }}>
            How to Use Tracker Software (Step-by-Step)
          </Typography>

          <Box sx={{ position: 'relative', pl: 0 }}>
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                left: { xs: 11, sm: 18 },
                width: '2px',
                bgcolor: 'rgba(124,58,237,0.20)',
                borderRadius: 2,
              }}
            />
            <Stack spacing={1.2}>
              {steps.map((step, idx) => (
                <Stack key={step.title} direction="row" spacing={1.2} alignItems="stretch">
                  <Box
                    sx={{
                      mt: 0.35,
                      width: { xs: 22, sm: 36 },
                      height: { xs: 22, sm: 36 },
                      borderRadius: '50%',
                      bgcolor: '#7c3aed',
                      color: '#fff',
                      fontSize: { xs: '0.72rem', sm: '0.78rem' },
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid #fff',
                      boxShadow: '0 4px 12px rgba(124,58,237,0.28)',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <Box sx={{ flex: 1, p: 1.55, borderRadius: '12px', bgcolor: '#f8f7ff', border: '1px solid rgba(124,58,237,0.10)' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.9rem', mb: 0.3 }}>
                      {step.title}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.62 }}>
                      {step.body}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)' }}>
        <CardContent sx={{ p: { xs: 2.7, md: 3.2 } }}>
          <Typography fontWeight={800} sx={{ fontSize: '1.02rem', fontWeight: 800, color: '#1e1b4b', mb: 1.2 }}>
            Tracker Usage Best Practices
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.9}>
            {bestPractices.map((tip) => (
              <Chip
                key={tip}
                label={tip}
                size="small"
                sx={{
                  bgcolor: 'rgba(124,58,237,0.08)',
                  color: '#6d28d9',
                  border: '1px solid rgba(124,58,237,0.16)',
                  fontWeight: 700,
                  height: 30,
                  '&:hover': { bgcolor: 'rgba(124,58,237,0.14)' },
                }}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

/* ────────────────────────────────────────────────
   Navigation configuration
──────────────────────────────────────────────── */
const navItems = [
  { label: 'Dashboard', icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: 'Projects', icon: <FolderOpenOutlinedIcon fontSize="small" /> },
  { label: 'Tasks', icon: <TaskOutlinedIcon fontSize="small" /> },
  { label: 'Employees', icon: <GroupsOutlinedIcon fontSize="small" /> },
  { label: 'Reports', icon: <AssessmentOutlinedIcon fontSize="small" /> },
  { label: 'Notifications', icon: <NotificationsOutlinedIcon fontSize="small" /> },
]

const TEAM_ROW_AVATAR_COLORS = ['#10b981', '#9333ea', '#3b82f6', '#f59e0b', '#ec4899']

/* ────────────────────────────────────────────────
   Animated Donut Chart
──────────────────────────────────────────────── */
function DonutChart({ completed, inProgress, pending }) {
  const total = Math.max(completed + inProgress + pending, 0)
  const calcTotal = Math.max(total, 1)
  const isEmpty = total === 0
  const completedPct = (completed / calcTotal) * 100
  const progressPct = (inProgress / calcTotal) * 100
  const pendingPct = 100 - completedPct - progressPct

  const gradient = isEmpty
    ? 'conic-gradient(#e2e8f0 0% 100%)'
    : `conic-gradient(
      #8b5cf6 0% ${completedPct}%,
      #3b82f6 ${completedPct}% ${completedPct + progressPct}%,
      #06b6d4 ${completedPct + progressPct}% ${completedPct + progressPct + pendingPct}%
    )`

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 2.5 }}>
      <Box
        sx={{
          width: 168,
          height: 168,
          borderRadius: '50%',
          background: gradient,
          display: 'grid',
          placeItems: 'center',
          mb: 2.5,
          position: 'relative',
          boxShadow: '0 0 0 6px rgba(139,92,246,0.06), 0 12px 40px rgba(139,92,246,0.18)',
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { transform: 'scale(1.04)' },
        }}
      >
        <Box
          sx={{
            width: 108,
            height: 108,
            borderRadius: '50%',
            bgcolor: '#fff',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <Typography fontWeight={700} sx={{ fontSize: '2rem', color: '#1e1b4b', lineHeight: 1 }}>
            {total}
          </Typography>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Total
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1}>
        {[
          { color: '#8b5cf6', label: 'Completed', val: completed },
          { color: '#3b82f6', label: 'In Progress', val: inProgress },
          { color: '#06b6d4', label: 'Pending', val: pending },
        ].map((item) => (
          <Stack key={item.label} direction="row" spacing={0.7} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 8px ${item.color}66` }} />
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569' }}>
              {item.label} <span style={{ color: '#1e1b4b', fontWeight: 800 }}>({item.val})</span>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

/* ────────────────────────────────────────────────
   Bar Chart Progress
──────────────────────────────────────────────── */
function ProgressBars({ systems }) {
  const items = systems.slice(0, 3).map((system) => {
    const completed = system.status === 'Online' ? 4 : system.status === 'Maintenance' ? 2 : 1
    const total = 5
    return { name: system.name, completed, total }
  })

  if (items.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260, width: '100%' }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>No systems connected yet.</Typography>
      </Box>
    )
  }

  const chartMax = Math.max(...items.map((item) => item.total), 1)
  const yTicks = Array.from({ length: chartMax + 1 }, (_, idx) => chartMax - idx)
  const chartHeight = 150
  const stepHeight = chartHeight / chartMax
  const columns = `repeat(${items.length}, minmax(110px, 1fr))`

  return (
    <Box sx={{ mt: 7.3 }}>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ width: 26, mr: 1.2, height: chartHeight, position: 'relative' }}>
          {yTicks.map((tick) => (
            <Typography
              key={tick}
              sx={{
                position: 'absolute',
                right: 0,
                bottom: `${tick * stepHeight}px`,
                transform: tick === 0 ? 'translateY(45%)' : tick === chartMax ? 'translateY(-55%)' : 'translateY(50%)',
                fontSize: '0.7rem',
                color: '#94a3b8',
                lineHeight: 1,
              }}
            >
              {tick}
            </Typography>
          ))}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ position: 'relative', height: chartHeight, borderLeft: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
            {yTicks.slice(1).map((tick) => (
              <Box
                key={tick}
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${tick * stepHeight}px`,
                  borderTop: '1px solid #e5e7eb',
                }}
              />
            ))}

            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: chartHeight,
                px: { xs: 1.5, sm: 2.4 },
                display: 'grid',
                gridTemplateColumns: columns,
                columnGap: { xs: 0.6, sm: 1.1 },
                alignItems: 'end',
              }}
            >
              {items.map((item) => (
                <Box key={item.name} sx={{ height: chartHeight, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Box sx={{ height: chartHeight, display: 'flex', alignItems: 'flex-end', gap: 1.1 }}>
                    <Box
                      sx={{
                        width: { xs: 22, sm: 28 },
                        height: `${item.total * stepHeight}px`,
                        borderRadius: '9px 9px 0 0',
                        bgcolor: '#e9e7f8',
                        border: '2px solid #7c3aed',
                        borderBottom: 'none',
                        alignSelf: 'flex-end',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <Box
                      sx={{
                        width: { xs: 22, sm: 28 },
                        height: `${item.completed * stepHeight}px`,
                        borderRadius: '9px 9px 0 0',
                        bgcolor: '#b8e1d0',
                        border: '2px solid #059669',
                        borderBottom: 'none',
                        alignSelf: 'flex-end',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              mt: 1.3,
              px: { xs: 1.5, sm: 2.4 },
              display: 'grid',
              gridTemplateColumns: columns,
              columnGap: { xs: 0.6, sm: 1.1 },
            }}
          >
            {items.map((item) => (
              <Typography
                key={item.name}
                sx={{
                  textAlign: 'center',
                  fontSize: '0.76rem',
                  color: '#94a3b8',
                  whiteSpace: 'normal',
                  lineHeight: 1.15,
                }}
              >
                {item.name}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

/* ────────────────────────────────────────────────
   Metric Card
──────────────────────────────────────────────── */
const TONES = {
  default: {
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    light: '#ede9fe',
    text: '#6d28d9',
    glow: 'rgba(124,58,237,0.25)',
  },
  success: {
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    light: '#d1fae5',
    text: '#047857',
    glow: 'rgba(5,150,105,0.25)',
  },
  warning: {
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    light: '#fef3c7',
    text: '#b45309',
    glow: 'rgba(217,119,6,0.25)',
  },
  info: {
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    light: '#dbeafe',
    text: '#1d4ed8',
    glow: 'rgba(37,99,235,0.25)',
  },
}

function MetricCard({ icon, title, value, hint, trend = '+12%', tone = 'default', delay = 0 }) {
  const t = TONES[tone] || TONES.default

  return (
    <Card
      className="animate-fade-in-up card-hover"
      style={{ animationDelay: `${delay}ms` }}
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.9)',
        bgcolor: '#fff',
        boxShadow: 'var(--shadow-xs)',
        position: 'relative',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${t.light}40, transparent)`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          borderRadius: '16px 16px 0 0',
          background: t.gradient,
        },
      }}
    >
      <CardContent sx={{ p: 2.15, '&:last-child': { pb: 2.15 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }} style={{ justifyContent: "space-between" }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: t.gradient,
              boxShadow: `0 6px 20px ${t.glow}`,
            }}
          >
            {icon}
          </Avatar>
          <Box
            sx={{
              px: 1,
              py: 0.4,
              borderRadius: '8px',
              bgcolor: t.light,
              color: t.text,
              fontSize: '0.68rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 11 }} />
            {trend}
          </Box>
        </Stack>

        <Typography
          fontWeight={700}
          sx={{ fontSize: '1.75rem', color: '#1e1b4b', lineHeight: 1, letterSpacing: '-0.03em', mb: 0.25 }}
        >
          {value}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', mb: 0.25 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{hint}</Typography>
      </CardContent>
    </Card>
  )
}

/* ────────────────────────────────────────────────
   Status helpers
──────────────────────────────────────────────── */
function statusStyles(status) {
  const s = String(status || '').toLowerCase().replace(/_/g, ' ')
  if (s === 'completed' || s === 'in review') return { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' }
  if (s === 'in progress' || s === 'doing') return { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' }
  if (s === 'ready') return { bg: '#e0e7ff', color: '#4338ca', dot: '#6366f1' }
  if (s === 'backlog' || s === 'pending') return { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' }
  return { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' }
}

/* ────────────────────────────────────────────────
   Sidebar nav item
──────────────────────────────────────────────── */
function NavItem({ item, isActive, onClick }) {
  return (
    <ListItemButton
      selected={isActive}
      onClick={onClick}
      sx={{
        borderRadius: '12px',
        mb: '4px',
        px: 2,
        py: 1.1,
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': { bgcolor: 'rgba(139,92,246,0.12)' },
        '&.Mui-selected': {
          bgcolor: 'rgba(139,92,246,0.18)',
          backdropFilter: 'blur(8px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '25%',
            bottom: '25%',
            width: '3px',
            borderRadius: '0 4px 4px 0',
            background: 'linear-gradient(180deg,#a78bfa,#7c3aed)',
          },
          '&:hover': { bgcolor: 'rgba(139,92,246,0.24)' },
        },
      }}
    >
      <Box
        sx={{
          color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.38)',
          mr: 1.5,
          transition: 'color 0.2s',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {item.icon}
      </Box>
      <ListItemText
        primary={item.label}
        sx={{
          '& .MuiTypography-root': {
            fontWeight: isActive ? 700 : 500,
            fontSize: '0.875rem',
            color: isActive ? '#e9d5ff' : 'rgba(255,255,255,0.6)',
            letterSpacing: isActive ? '0.01em' : 0,
          },
        }}
      />
      {isActive && (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#a78bfa',
            boxShadow: '0 0 8px #a78bfa',
          }}
        />
      )}
    </ListItemButton>
  )
}

/* ────────────────────────────────────────────────
   Sidebar Component
──────────────────────────────────────────────── */
function Sidebar({ selectedNav, onNavChange, onLogout, isMobile, open, onClose, userRole, displayName, roleLabel }) {
  const labels = allowedNavLabels(userRole)
  const navItemsVisible = navItems.filter((item) => labels.includes(item.label))
  const content = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(175deg, #1c1050 0%, #0d0828 60%, #080518 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative orbs */}
      <Box sx={{ position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', filter: 'blur(50px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: 60, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '45%', right: '5%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(30px)', pointerEvents: 'none' }} />

      {/* Logo */}
      <Box sx={{ pl: 1.5, pr: 10, pt: 1.5, pb: 2.5, position: 'relative', zIndex: 1 }}>
        <Stack direction="row" style={{alignItems: 'center', gap:"10px"}}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(124,58,237,0.4)',
              border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}
          >
            <ShieldIcon sx={{ fontSize: 22, color: '#fff' }} />
          </Box>
          <Box>
            <Typography style={{fontSize: '1.3rem', color: '#fff', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em'}}>
              TrackDesk
            </Typography>
            <Typography style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>
              PM&T System
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Nav items */}
      <List sx={{ px: 1.5, flex: 1, position: 'relative', zIndex: 1, overflow: 'auto' }}>
        {navItemsVisible.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            isActive={selectedNav === item.label}
            onClick={() => {
              onNavChange(item.label)
              if (isMobile) onClose()
            }}
          />
        ))}
      </List>
    </Box>
  )

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: 228,
          bgcolor: 'transparent',
          borderRight: 'none',
          boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
        },
      }}
    >
      {content}
    </Drawer>
  )
}

/* ────────────────────────────────────────────────
   Top Bar
──────────────────────────────────────────────── */
function roleBadgeSx(role) {
  if (role === 'Admin') return { bgcolor: '#2563eb', color: '#fff' }
  if (role === 'Manager') return { bgcolor: '#7c3aed', color: '#fff' }
  return { bgcolor: '#0d9488', color: '#fff' }
}

function TopBar({
  isMobile,
  onMenuOpen,
  pageTitle,
  pageBreadcrumb,
  densePageHeader = false,
  unreadNotifications = 0,
  displayName,
  roleLabel,
  email,
  userRole,
  onLogout,
  onOpenNotifications,
  onOpenHelpSupport,
  onDownloadTracker,
  onOpenChangePassword,
}) {
  const [profileAnchor, setProfileAnchor] = useState(null)
  const profileOpen = Boolean(profileAnchor)
  const closeProfileMenu = () => setProfileAnchor(null)

  return (
    <Box
      component="header"
      sx={{
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        zIndex: 1100,
        height: { xs: 54, md: 60 },
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, sm: 2.5, md: 3 },
        background: 'rgba(248,247,255,0.95)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: '1.5px solid rgba(124,58,237,0.10)',
        boxShadow: '0 2px 16px rgba(124,58,237,0.07)',
      }}
    >
      {isMobile ? (
        /* ── MOBILE LEFT: hamburger + brand ── */
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
          <IconButton
            id="mobile-menu-btn"
            onClick={onMenuOpen}
            size="small"
            sx={{
              color: '#7c3aed',
              bgcolor: 'rgba(124,58,237,0.08)',
              borderRadius: '10px',
              width: 38,
              height: 38,
              '&:hover': { bgcolor: 'rgba(124,58,237,0.15)' },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
            <ShieldIcon sx={{ fontSize: 17, color: '#fff' }} />
          </Box>
          <Box>
            <Typography fontWeight={800} sx={{ fontSize: '0.95rem', color: '#1e1b4b', lineHeight: 1.2, letterSpacing: '-0.01em' }}>TrackDesk</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>PM&T System</Typography>
          </Box>
        </Stack>
      ) : (
        /* ── DESKTOP LEFT: page title + breadcrumb ── */
        <Box sx={{ flex: '0 0 auto', minWidth: 180 }}>
          <Typography
            fontWeight={800}
            sx={{
              fontSize: { md: densePageHeader ? '1.15rem' : '1.25rem', lg: densePageHeader ? '1.2rem' : '1.35rem' },
              color: '#1e1b4b',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              mb: densePageHeader ? 0 : 0.2,
            }}
          >
            {pageTitle}
          </Typography>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Home</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#d1d5db' }}>{'›'}</Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed' }}>{pageBreadcrumb}</Typography>
          </Stack>
        </Box>
      )}



      {/* ── RIGHT: icon actions + divider + user profile ── */}
      <Stack direction="row" style={{ alignItems: 'center', gap: "7px" }} sx={{ ml: isMobile ? 0 : 'auto', flexShrink: 0 }}>
        {/* ── CENTER: integrated search bar (desktop only) ── */}
        {!isMobile && (
          <Box sx={{ flex: 1, mx: { md: 3, lg: 4 } }} style={{margin:"0", width:"300px"}}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                height: 40,
                bgcolor: 'rgba(255,255,255,0.9)',
                border: '1.5px solid rgba(124,58,237,0.12)',
                borderRadius: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                '&:hover': { border: '1.5px solid rgba(124,58,237,0.3)', boxShadow: '0 1px 8px rgba(124,58,237,0.1)' },
                '&:focus-within': { border: '1.5px solid #7c3aed', boxShadow: '0 0 0 4px rgba(124,58,237,0.1)', bgcolor: '#fff' },
              }}
            >
              <SearchOutlinedIcon sx={{ fontSize: 17, color: '#a78bfa', flexShrink: 0 }} />
              <Box
                component="input"
                placeholder="Search projects, tasks, team..."
                sx={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.84rem',
                  color: '#1e1b4b',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  '&::placeholder': { color: '#b0b8c8', fontWeight: 400 },
                }}
              />
              <Box sx={{ display: { md: 'none', lg: 'flex' }, alignItems: 'center', gap: '2px', px: 0.8, py: 0.3, borderRadius: '6px', bgcolor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.62rem', color: '#a78bfa', fontWeight: 800, lineHeight: 1 }}>{'⌘'}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#a78bfa', fontWeight: 800, lineHeight: 1 }}>K</Typography>
              </Box>
            </Box>
          </Box>
        )}
        {/* Mobile: search icon */}
        {isMobile && (
          <IconButton size="small" sx={{ color: '#7c3aed', bgcolor: 'rgba(124,58,237,0.07)', borderRadius: '10px', width: 36, height: 36, '&:hover': { bgcolor: 'rgba(124,58,237,0.14)' } }}>
            <SearchOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            id="notifications-btn"
            onClick={onOpenNotifications}
            sx={{ color: '#7c3aed', bgcolor: 'rgba(124,58,237,0.07)', borderRadius: '10px', width: { xs: 36, md: 38 }, height: { xs: 36, md: 38 }, '&:hover': { bgcolor: 'rgba(124,58,237,0.14)' } }}
          >
            <Badge badgeContent={unreadNotifications} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.58rem', minWidth: 15, height: 15, top: 1, right: 1, fontWeight: 800 } }}>
              <NotificationsNoneOutlinedIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Help (desktop only) */}
        {!isMobile && (
          <Tooltip title="Help & Support">
            <IconButton
              id="help-btn"
              onClick={onOpenHelpSupport}
              sx={{ color: '#7c3aed', bgcolor: 'rgba(124,58,237,0.07)', borderRadius: '10px', width: 38, height: 38, '&:hover': { bgcolor: 'rgba(124,58,237,0.14)' } }}
            >
              <HelpOutlineOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}


        {/* Vertical divider */}
        <Box sx={{ width: '1.5px', height: 28, bgcolor: 'rgba(124,58,237,0.12)', borderRadius: 4, mx: { xs: 0.5, md: 1 }, display: { xs: 'none', sm: 'block' } }} />

        {/* User profile pill + dropdown */}
        <>
          <ButtonBase
            id="profile-menu-trigger"
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{
              borderRadius: '999px',
              pl: { xs: 0.25, sm: 0.75 },
              pr: { xs: 0.25, sm: 1 },
              py: 0.5,
              border: '1.5px solid rgba(59, 130, 246, 0.35)',
              bgcolor: 'rgba(255,255,255,0.85)',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(239,246,255,0.95)',
                borderColor: 'rgba(37, 99, 235, 0.45)',
                boxShadow: '0 2px 12px rgba(37,99,235,0.12)',
              },
            }}
          >
            <Stack direction="row" style={{ alignItems: 'center', gap: "5px" }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  id="user-avatar"
                  sx={{
                    width: { xs: 34, md: 36 },
                    height: { xs: 34, md: 36 },
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                    border: '2px solid #fff',
                  }}
                >
                  {(displayName || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#22c55e',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 1px rgba(34,197,94,0.35)',
                  }}
                />
              </Box>
              {!isMobile && (
                <Box sx={{ display: { md: 'none', lg: 'block' }, textAlign: 'left', pr: 0.25 }}>
                  <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {String(displayName || 'User').split(/\s+/)[0] || 'User'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', lineHeight: 1.15 }}>
                    {roleLabel || 'Member'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </ButtonBase>

          <Menu
            anchorEl={profileAnchor}
            open={profileOpen}
            onClose={closeProfileMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1.25,
                  minWidth: 280,
                  maxWidth: 320,
                  borderRadius: '18px',
                  border: '1px solid rgba(15,23,42,0.08)',
                  boxShadow: '0 18px 50px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.8) inset',
                  overflow: 'hidden',
                },
              },
            }}
          >
            <Box sx={{ px: 2.25, pt: 2.25, pb: 2 }}>
              <Stack direction="row" spacing={1.75} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    border: '3px solid #eff6ff',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                  }}
                >
                  {(displayName || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#0f172a', lineHeight: 1.25, mb: 0.35 }}>
                    {displayName || 'User'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, wordBreak: 'break-all' }}>
                    {email || '—'}
                  </Typography>
                  <Chip
                    label={String(userRole || 'Employee').toUpperCase()}
                    size="small"
                    sx={{
                      mt: 1,
                      height: 24,
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      letterSpacing: 0.06,
                      borderRadius: '8px',
                      ...roleBadgeSx(userRole),
                    }}
                  />
                </Box>
              </Stack>
            </Box>
            <Divider sx={{ borderColor: 'rgba(15,23,42,0.06)' }} />
            <MenuItem
              onClick={() => {
                closeProfileMenu()
                notify({ type: 'info', message: 'Profile settings will be available in a future update.' })
              }}
              sx={{ py: 1.35, px: 2, fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonOutlineOutlinedIcon sx={{ fontSize: 22, color: '#64748b' }} />
              </ListItemIcon>
              Profile settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeProfileMenu()
                onOpenChangePassword?.()
              }}
              sx={{ py: 1.35, px: 2, fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsOutlinedIcon sx={{ fontSize: 22, color: '#64748b' }} />
              </ListItemIcon>
              Change password
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeProfileMenu()
                onDownloadTracker?.()
              }}
              sx={{
                py: 1.35,
                px: 2,
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#5b21b6',
                '&:hover': { bgcolor: 'rgba(124,58,237,0.08)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DownloadOutlinedIcon sx={{ fontSize: 22, color: '#7c3aed' }} />
              </ListItemIcon>
              Download Tracker App
            </MenuItem>
            <Divider sx={{ borderColor: 'rgba(15,23,42,0.06)', my: 0.5 }} />
            <MenuItem
              onClick={() => {
                closeProfileMenu()
                onLogout?.()
              }}
              sx={{
                py: 1.35,
                px: 2,
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#dc2626',
                '&:hover': { bgcolor: 'rgba(220,38,38,0.08)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutOutlinedIcon sx={{ fontSize: 22, color: '#dc2626' }} />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </>
      </Stack>
    </Box>
  )
}

/* ────────────────────────────────────────────────
   Login Page
──────────────────────────────────────────────── */
function LoginPage({ onLogin, showPassword, setShowPassword, loginForm, setLoginForm }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        background: 'linear-gradient(135deg, #0a0520 0%, #150d3a 40%, #1f1060 70%, #2e1065 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background blobs */}
      {[
        { top: '-15%', right: '-10%', w: 500, h: 500, color: 'rgba(124,58,237,0.18)' },
        { bottom: '-12%', left: '-10%', w: 420, h: 420, color: 'rgba(59,130,246,0.12)' },
        { top: '35%', left: '20%', w: 280, h: 280, color: 'rgba(139,92,246,0.09)' },
        { top: '10%', left: '40%', w: 180, h: 180, color: 'rgba(6,182,212,0.07)' },
      ].map((blob, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            ...blob,
            width: blob.w,
            height: blob.h,
            borderRadius: '50%',
            background: blob.color,
            filter: 'blur(70px)',
            pointerEvents: 'none',
            animation: `float ${6 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      <Card
        className="animate-scale-in"
        sx={{
          width: '100%',
          maxWidth: 1080,
          borderRadius: { xs: '20px', md: '28px' },
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.25fr 0.75fr' },
          boxShadow: '0 32px 100px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left panel */}
        <Box
          sx={{
            p: { xs: 4, sm: 5, md: 6 },
            color: '#fff',
            background: 'linear-gradient(145deg, #4c1d95 0%, #6d28d9 35%, #7c3aed 65%, #8b5cf6 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 8s ease infinite',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {[
            { top: -90, right: -90, size: 280, opacity: 0.1 },
            { bottom: -50, left: -50, size: 180, opacity: 0.07 },
            { top: '55%', right: '12%', size: 110, opacity: 0.06 },
          ].map((blob, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: blob.top,
                bottom: blob.bottom,
                left: blob.left,
                right: blob.right,
                width: blob.size,
                height: blob.size,
                borderRadius: '50%',
                background: `rgba(255,255,255,${blob.opacity})`,
                pointerEvents: 'none',
              }}
            />
          ))}

          <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
            {/* Brand */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '13px',
                  bgcolor: 'rgba(255,255,255,0.18)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <ShieldIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography fontWeight={800} sx={{ fontSize: '1.15rem', lineHeight: 1.2 }}>PM&T System</Typography>
                <Typography sx={{ opacity: 0.65, fontSize: '0.76rem', fontWeight: 500 }}>Project Management & Tracking</Typography>
              </Box>
            </Stack>

            {/* Headline */}
            <Box>
              <Typography fontWeight={900} sx={{ fontSize: { xs: '1.9rem', sm: '2.4rem', md: '2.8rem' }, lineHeight: 1.1, letterSpacing: '-0.03em', mb: 1.5 }}>
                The professional<br />project workspace.
              </Typography>
              <Typography sx={{ opacity: 0.82, fontSize: '0.95rem', lineHeight: 1.75, maxWidth: 400 }}>
                Manage projects, track tasks, and generate reports — all in one powerful platform built for modern teams.
              </Typography>
            </Box>

            {/* Features */}
            <Stack spacing={1.8}>
              {[
                { icon: <FolderIcon sx={{ fontSize: 20 }} />, title: 'Project Management', desc: 'Organize and track all your projects' },
                { icon: <AssignmentIcon sx={{ fontSize: 20 }} />, title: 'Task Tracking', desc: 'Monitor tasks with priorities & due dates' },
                { icon: <BarChartIcon sx={{ fontSize: 20 }} />, title: 'Analytics & Reports', desc: 'Generate insights and progress reports' },
              ].map((f) => (
                <Stack key={f.title} direction="row" spacing={2} alignItems="center" style={{alignItems:"center"}}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: '10px',
                      bgcolor: 'rgba(255,255,255,0.14)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(6px)',
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>{f.title}</Typography>
                    <Typography sx={{ opacity: 0.65, fontSize: '0.8rem', mt: 0.1 }}>{f.desc}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>

            {/* Tech chips */}
            <Box>
              <Typography sx={{ fontSize: '0.75rem', opacity: 0.55, mb: 1.2, fontWeight: 600 }}>Built with:</Typography>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.8}>
                {['React', 'Vite', 'MUI', 'Node.js', 'Offline-First'].map((chip) => (
                  <Chip
                    key={chip}
                    label={chip}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: '#ddd6fe',
                      borderColor: 'rgba(255,255,255,0.18)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      borderRadius: '8px',
                      height: 26,
                    }}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Right panel – Login form */}
        <Box
          sx={{
            p: { xs: 3.25, sm: 4, md: 5 },
            bgcolor: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
                boxShadow: '0 8px 28px rgba(124,58,237,0.35)',
              }}
            >
              <ShieldIcon sx={{ fontSize: 28, color: '#fff' }} />
            </Box>
            <Typography fontWeight={700} sx={{ fontSize: '1.6rem', color: '#1e1b4b', letterSpacing: '-0.02em' }}>
              Welcome back
            </Typography>
            <Typography sx={{ mt: 0.6, color: '#94a3b8', fontSize: '0.9rem' }}>
              Sign in to your workspace
            </Typography>
          </Box>

          <Stack spacing={2} component="form" onSubmit={onLogin} sx={{ flex: 1 }}>
            <TextField
              id="login-email"
              label="Email address"
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlinedIcon fontSize="small" sx={{ color: '#a78bfa' }} />
                  </InputAdornment>
                ),
              }}
              fullWidth
              style={{padding:"0px !important"}}
            />

            <TextField
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginForm.password}
              onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" sx={{ color: '#a78bfa' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} size="small" edge="end">
                      {showPassword
                        ? <VisibilityOffOutlinedIcon fontSize="small" sx={{ color: '#a78bfa' }} />
                        : <VisibilityOutlinedIcon fontSize="small" sx={{ color: '#a78bfa' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
            />

            <Stack direction="row" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={0.6}>
                <Checkbox
                  id="keep-signed-in"
                  checked={loginForm.keepSignedIn}
                  onChange={(e) => setLoginForm((p) => ({ ...p, keepSignedIn: e.target.checked }))}
                  size="small"
                  sx={{ color: '#c4b5fd', '&.Mui-checked': { color: '#7c3aed' }, p: 0.3 }}
                />
                <Typography component="label" htmlFor="keep-signed-in" sx={{ fontSize: '0.83rem', color: '#64748b', cursor: 'pointer', userSelect: 'none' }}>
                  Keep me signed in
                </Typography>
              </Stack>
            </Stack>

            <Button
              id="login-submit"
              type="submit"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                borderRadius: '13px',
                py: 1.5,
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                letterSpacing: '0.01em',
                boxShadow: '0 8px 28px rgba(124,58,237,0.4)',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
                  boxShadow: '0 12px 36px rgba(124,58,237,0.5)',
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
              }}
            >
              Sign in to workspace
            </Button>

            <Box
              sx={{
                p: 1.5,
                borderRadius: '10px',
                bgcolor: '#f8f7ff',
                border: '1px solid rgba(124,58,237,0.1)',
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Use employee email and password to login.
                <br />
                New employees get temporary password on email.
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ mt: 'auto', pt: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#c0cad6' }}>
              © 2026 PM&T System — All rights reserved
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  )
}

/* ────────────────────────────────────────────────
   Welcome Banner
──────────────────────────────────────────────── */
function WelcomeBanner({ completedTasks, totalTasks, displayName, onOpenProjects, onOpenMyTasks }) {
  const completion = Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const now = new Date()
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
  const firstName = String(displayName || 'there').trim().split(/\s+/)[0] || 'there'

  return (
    <Card
      className="animate-fade-in-up"
      sx={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 30%, #7c3aed 60%, #8b5cf6 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 10s ease infinite',
        color: '#fff',
        boxShadow: '0 20px 60px -12px rgba(124,58,237,0.5)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {[
        { top: -90, right: -90, size: 300, op: 0.09 },
        { bottom: -60, right: 80, size: 200, op: 0.06 },
        { top: 15, left: -35, size: 110, op: 0.05 },
      ].map((b, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: b.top,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            bgcolor: `rgba(255,255,255,${b.op})`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <CardContent
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          py: { xs: 2.5, md: 3 },
          px: { xs: 2.5, md: 3.25 },
          position: 'relative',
          zIndex: 1,
          gap: 1.75,
          '&:last-child': { pb: { xs: 2.5, md: 3 } },
        }}
      >
        <Box>
          <Typography fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.45rem', md: '1.65rem' }, letterSpacing: '-0.02em', mb: 0.4 }}>
            {`Good morning, ${firstName} 👋`}
          </Typography>
          <Typography sx={{ opacity: 0.8, fontSize: '0.82rem', mb: 1.25 }}>{dateStr}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.6}>
            <Box sx={{ px: 1.35, py: 0.45, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', fontSize: '0.76rem', fontWeight: 700 }}>
              {completion}% completion
            </Box>
            <Box sx={{ px: 1.35, py: 0.45, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.1)', fontSize: '0.76rem', fontWeight: 500 }}>
              {totalTasks} tasks
            </Box>
            <Box sx={{ px: 1.35, py: 0.45, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.1)', fontSize: '0.76rem', fontWeight: 500 }}>
              {completedTasks} done
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.2} sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            onClick={onOpenProjects}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.35)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              px: { xs: 2, md: 2.5 },
              py: 0.9,
              bgcolor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              fontSize: '0.85rem',
              '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.16)' },
            }}
          >
            Projects
          </Button>
          <Button
            variant="contained"
            onClick={onOpenMyTasks}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              bgcolor: '#fff',
              color: '#7c3aed',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 800,
              px: { xs: 2, md: 2.5 },
              py: 0.9,
              fontSize: '0.85rem',
              boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
              '&:hover': { bgcolor: '#f3e8ff', boxShadow: '0 6px 24px rgba(0,0,0,0.22)' },
            }}
          >
            My Tasks
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

/* ────────────────────────────────────────────────
   Section header
──────────────────────────────────────────────── */
function SectionHeader({ label, action }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ px: 0.5 }} style={{ justifyContent: "space-between" }}>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '0.64rem',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: 2.2,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      {action && (
        <Typography
          sx={{
            fontSize: '0.78rem',
            color: '#7c3aed',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            '&:hover': { color: '#6d28d9' },
          }}
        >
          {action}
        </Typography>
      )}
    </Stack>
  )
}

function App() {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    keepSignedIn: true,
  })
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()

  const [systems, setSystems] = useState([])
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [employeesFetchSettled, setEmployeesFetchSettled] = useState(false)
  const [tasksFetchSettled, setTasksFetchSettled] = useState(false)
  const [systemsFetchSettled, setSystemsFetchSettled] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const setNotice = useCallback((payload) => {
    notify(payload || { type: '', message: '' })
  }, [])
  const [selectedNav, setSelectedNav] = useState(() => {
    try {
      return localStorage.getItem('trackdesk-selected-nav') || 'Dashboard'
    } catch { return 'Dashboard' }
  })
  const [selectedTaskProject, setSelectedTaskProject] = useState('all')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('trackdesk-auth')
      if (!saved) return { signedIn: false, keepSignedIn: true }
      const p = JSON.parse(saved)
      const role = normalizeRole(p.role)
      return {
        signedIn: !!p.signedIn && !!p.token,
        keepSignedIn: p.keepSignedIn !== false,
        role,
        displayName: p.displayName || (role === 'Employee' ? 'Team member' : 'System Admin'),
        email: p.email || '',
        userId: p.userId ?? null,
        passwordResetRequired: Boolean(p.passwordResetRequired),
        token: String(p.token || ''),
      }
    } catch { return { signedIn: false, keepSignedIn: true } }
  })
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    if (auth?.signedIn && auth?.token) setAuthToken(auth.token)
    else clearAuthToken()
  }, [auth?.signedIn, auth?.token])

  const stats = useMemo(() => ({
    total: systems.length,
    online: systems.filter((s) => s.status === 'Online').length,
    maintenance: systems.filter((s) => s.status === 'Maintenance').length,
    offline: systems.filter((s) => s.status === 'Offline').length,
  }), [systems])

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    try {
      const data = await getNotifications({ limit: 100 })
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Failed to load notifications' })
    } finally {
      setNotificationsLoading(false)
    }
  }, [setNotice])

  useEffect(() => {
    if (!auth.signedIn) return
    const allowed = allowedNavLabels(auth.role)
    if (!allowed.includes(selectedNav)) {
      setSelectedNav('Dashboard')
      try { localStorage.setItem('trackdesk-selected-nav', 'Dashboard') } catch { /* ignore */ }
    }
  }, [auth.signedIn, auth.role, selectedNav])

  useEffect(() => {
    if (!auth.signedIn) return
    if (!/^\/employees\/\d+$/.test(location.pathname)) return
    setSelectedNav('Employees')
    try {
      localStorage.setItem('trackdesk-selected-nav', 'Employees')
    } catch {
      /* ignore */
    }
  }, [location.pathname, auth.signedIn])

  const detailRouteEmployee = useMemo(() => {
    const m = location.pathname.match(/^\/employees\/(\d+)$/)
    if (!m) return null
    return employees.find((e) => String(e.id) === m[1]) || null
  }, [location.pathname, employees])

  const dashboardBootstrapReady = useMemo(
    () => tasksFetchSettled && employeesFetchSettled && systemsFetchSettled,
    [tasksFetchSettled, employeesFetchSettled, systemsFetchSettled],
  )

  useEffect(() => {
    let mounted = true
    if (auth.signedIn) {
      setEmployeesFetchSettled(false)
      setTasksFetchSettled(false)
      setSystemsFetchSettled(false)
      getSystems()
        .then((data) => { if (mounted) setSystems(Array.isArray(data) ? data : []) })
        .catch((err) => { if (mounted) setNotice({ type: 'error', message: err.message }) })
        .finally(() => { if (mounted) setSystemsFetchSettled(true) })
      getTasks()
        .then((data) => { if (mounted) setTasks(Array.isArray(data) ? data : []) })
        .catch((err) => { if (mounted) setNotice({ type: 'error', message: err.message }) })
        .finally(() => { if (mounted) setTasksFetchSettled(true) })
      getEmployees()
        .then((data) => { if (mounted) setEmployees(Array.isArray(data) ? data : []) })
        .catch((err) => { if (mounted) setNotice({ type: 'error', message: err.message }) })
        .finally(() => { if (mounted) setEmployeesFetchSettled(true) })
      getNotifications({ limit: 100 })
        .then((data) => { if (mounted) setNotifications(Array.isArray(data) ? data : []) })
        .catch((err) => { if (mounted) setNotice({ type: 'error', message: err.message }) })
    } else if (mounted) {
      setNotifications([])
      setEmployeesFetchSettled(false)
      setTasksFetchSettled(false)
      setSystemsFetchSettled(false)
    }
    return () => { mounted = false }
  }, [auth.signedIn])

  useEffect(() => {
    if (!auth.signedIn || !auth.passwordResetRequired) return
    setChangePasswordOpen(true)
  }, [auth.signedIn, auth.passwordResetRequired])

  useEffect(() => {
    if (!auth.signedIn) return undefined
    const id = window.setInterval(() => {
      getTasks()
        .then((data) => setTasks(Array.isArray(data) ? data : []))
        .catch(() => {
          // Silent refresh; initial load already shows toast on failure.
        })
    }, 6000)
    return () => window.clearInterval(id)
  }, [auth.signedIn])

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const payload = await loginUser({
        email: loginForm.email,
        password: loginForm.password,
      })
      const next = {
        signedIn: true,
        keepSignedIn: loginForm.keepSignedIn,
        role: normalizeRole(payload.role),
        displayName: payload.displayName || payload.email || 'User',
        email: payload.email || loginForm.email,
        userId: payload.userId ?? null,
        passwordResetRequired: Boolean(payload.passwordResetRequired),
        token: String(payload.token || ''),
      }
      setAuthToken(next.token)
      setAuth(next)
      setSelectedNav('Dashboard')
      setSelectedTaskProject('all')
      try {
        localStorage.setItem('trackdesk-selected-nav', 'Dashboard')
      } catch {
        /* ignore */
      }
      setNotice({ type: 'success', message: `Welcome back${next.displayName ? `, ${next.displayName}` : ''}!` })
      if (loginForm.keepSignedIn) {
        try { localStorage.setItem('trackdesk-auth', JSON.stringify(next)) } catch (err) { console.warn('Failed to persist auth', err) }
      } else {
        try { localStorage.removeItem('trackdesk-auth') } catch (err) { console.warn('Failed to remove auth', err) }
      }
      if (next.passwordResetRequired) {
        setNotice({ type: 'warning', message: 'Please change your temporary password before continuing.' })
        setChangePasswordOpen(true)
      }
    } catch (error) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || 'Invalid credentials',
      })
      return
    }
  }

  function handleLogout() {
    clearAuthToken()
    setAuth({ signedIn: false, keepSignedIn: false })
    try { localStorage.removeItem('trackdesk-auth') } catch (err) { console.warn('Failed to remove auth', err) }
  }

  function openChangePasswordDialog() {
    setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setChangePasswordOpen(true)
  }

  async function handleChangePasswordSubmit(e) {
    e.preventDefault()
    const currentPassword = String(changePasswordForm.currentPassword || '')
    const newPassword = String(changePasswordForm.newPassword || '')
    const confirmPassword = String(changePasswordForm.confirmPassword || '')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotice({ type: 'warning', message: 'Please fill all password fields.' })
      return
    }
    if (newPassword.length < 8) {
      setNotice({ type: 'warning', message: 'New password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'warning', message: 'New password and confirm password do not match.' })
      return
    }

    setChangingPassword(true)
    try {
      await changePassword({
        email: auth.email,
        currentPassword,
        newPassword,
      })
      setChangePasswordOpen(false)
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      const nextAuth = { ...auth, passwordResetRequired: false }
      setAuth(nextAuth)
      if (nextAuth.keepSignedIn) {
        try { localStorage.setItem('trackdesk-auth', JSON.stringify(nextAuth)) } catch { /* ignore */ }
      }
      setNotice({ type: 'success', message: 'Password updated successfully.' })
    } catch (error) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || error?.message || 'Failed to change password',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  function handleSidebarNavChange(nextNav) {
    if (location.pathname.startsWith('/employees/')) {
      navigate('/')
    }
    setSelectedNav(nextNav)
    localStorage.setItem('trackdesk-selected-nav', nextNav)
    if (nextNav === 'Tasks') setSelectedTaskProject('all')
  }

  function handleOpenTasksForProject(projectName) {
    const normalized = String(projectName || '').trim().toLowerCase()
    setSelectedTaskProject(normalized || 'all')
    setSelectedNav('Tasks')
    localStorage.setItem('trackdesk-selected-nav', 'Tasks')
  }

  function handleOpenProjectsModule() {
    setSelectedNav('Projects')
    localStorage.setItem('trackdesk-selected-nav', 'Projects')
  }

  function handleOpenMyTasksModule() {
    setSelectedTaskProject('all')
    setSelectedNav('Tasks')
    localStorage.setItem('trackdesk-selected-nav', 'Tasks')
  }

  function handleOpenHelpSupportModule() {
    setSelectedNav('Help & Support')
    localStorage.setItem('trackdesk-selected-nav', 'Help & Support')
  }

  function handleOpenNotificationsModule() {
    setSelectedNav('Notifications')
    localStorage.setItem('trackdesk-selected-nav', 'Notifications')
  }

  async function handleMarkNotificationRead(id) {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
    } catch (error) {
      setNotice({ type: 'error', message: error?.message || 'Failed to mark notification as read' })
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch (error) {
      setNotice({ type: 'error', message: error?.message || 'Failed to mark all notifications as read' })
    }
  }

  async function handleMarkManyNotificationsRead(ids) {
    try {
      const cleanIds = Array.isArray(ids) ? ids.map((v) => Number(v)).filter(Number.isFinite) : []
      if (cleanIds.length === 0) return
      await markNotificationsRead(cleanIds)
      const idSet = new Set(cleanIds)
      setNotifications((prev) => prev.map((item) => (idSet.has(item.id) ? { ...item, read: true } : item)))
      setNotice({ type: 'success', message: `${cleanIds.length} notification(s) marked as read.` })
    } catch (error) {
      setNotice({ type: 'error', message: error?.message || 'Failed to mark selected notifications as read' })
    }
  }

  async function handleDeleteManyNotifications(ids) {
    try {
      const cleanIds = Array.isArray(ids) ? ids.map((v) => Number(v)).filter(Number.isFinite) : []
      if (cleanIds.length === 0) return
      await deleteNotifications(cleanIds)
      const idSet = new Set(cleanIds)
      setNotifications((prev) => prev.filter((item) => !idSet.has(item.id)))
      setNotice({ type: 'success', message: `${cleanIds.length} notification(s) deleted.` })
    } catch (error) {
      setNotice({ type: 'error', message: error?.message || 'Failed to delete selected notifications' })
    }
  }

  async function handleDownloadTracker() {
    try {
      window.open(TRACKER_DOWNLOAD_URL, '_blank', 'noopener,noreferrer')
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || 'Unable to download tracker app'
      setNotice({
        type: 'error',
        message,
      })
    }
  }

  function dashboardTaskBucket(status) {
    const s = String(status || '').toLowerCase().trim().replace(/_/g, ' ')
    if (s === 'completed' || s === 'in review') return 'done'
    if (s === 'in progress' || s === 'doing') return 'inprogress'
    return 'pending'
  }
  const dashboardTasks = useMemo(() => {
    if (auth.role !== 'Employee' || !String(auth.displayName || '').trim()) return tasks
    const want = String(auth.displayName).trim().toLowerCase()
    return tasks.filter((t) => String(t.assignee || '').trim().toLowerCase() === want)
  }, [tasks, auth.role, auth.displayName])

  const completedTasks = dashboardTasks.filter((t) => dashboardTaskBucket(t.status) === 'done').length
  const inProgressTasks = dashboardTasks.filter((t) => dashboardTaskBucket(t.status) === 'inprogress').length
  const pendingTasks = dashboardTasks.filter((t) => dashboardTaskBucket(t.status) === 'pending').length
  const formatTrend = (value) => `~ ${value > 0 ? '+' : ''}${value}%`
  const projectCompletionRows = useMemo(() => {
    const byProject = new Map()
    for (const task of dashboardTasks) {
      const name = String(task.project || '').trim() || 'Unassigned'
      const bucket = dashboardTaskBucket(task.status)
      const entry = byProject.get(name) || { name, total: 0, done: 0 }
      entry.total += 1
      if (bucket === 'done') entry.done += 1
      byProject.set(name, entry)
    }

    return [...byProject.values()]
      .map((entry, idx) => {
        const value = entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0
        const colors = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b']
        return { name: entry.name, value, color: colors[idx % colors.length] }
      })
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
      .slice(0, 3)
  }, [dashboardTasks])

  const teamRows = useMemo(() => {
    let list = employees
    if (auth.role === 'Employee' && auth.displayName) {
      const want = String(auth.displayName).trim().toLowerCase()
      list = employees.filter((emp) => String(emp.name || '').trim().toLowerCase() === want)
    }
    return list.map((emp, idx) => {
      const assigned = Number(emp.assignedTasks || 0)
      const completed = Number(emp.completedTasks || 0)
      const completionPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0
      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        tasks: assigned,
        completed,
        active: Math.max(assigned - completed, 0),
        completion: `${completionPct}%`,
        hours: emp.hours ?? '—',
        color: TEAM_ROW_AVATAR_COLORS[idx % TEAM_ROW_AVATAR_COLORS.length],
      }
    })
  }, [employees, auth.role, auth.displayName])

  /* Login screen + app shell */
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3800}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={5}
        style={{ zIndex: 9999 }}
      />
      {!auth.signedIn ? (
        <LoginPage
          onLogin={handleLogin}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
        />
      ) : (
        <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f0effe' }}>
          <Sidebar
            selectedNav={selectedNav}
            onNavChange={handleSidebarNavChange}
            onLogout={handleLogout}
            isMobile={isMobile}
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            userRole={auth.role}
            displayName={auth.displayName}
            roleLabel={roleNavLabel(auth.role)}
          />

          <Box
            sx={{
              flex: 1,
              ml: isMobile ? 0 : '228px',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TopBar
              isMobile={isMobile}
              onMenuOpen={() => setMobileDrawerOpen(true)}
              pageTitle={
                detailRouteEmployee
                  ? detailRouteEmployee.name
                  : selectedNav === 'Reports'
                    ? 'Reports & Analytics'
                    : selectedNav === 'Notifications'
                      ? 'Notifications'
                      : selectedNav
              }
              densePageHeader={
                Boolean(detailRouteEmployee) || selectedNav === 'Reports' || selectedNav === 'Notifications'
              }
              pageBreadcrumb={
                detailRouteEmployee
                  ? 'Employees · Profile'
                  : selectedNav === 'Dashboard'
                    ? 'Overview'
                    : selectedNav === 'Reports'
                      ? 'Reports'
                      : selectedNav === 'Notifications'
                        ? 'Notifications'
                        : selectedNav === 'Help & Support'
                          ? 'Support'
                          : 'Management'
              }
              unreadNotifications={unreadNotifications}
              displayName={auth.displayName}
              roleLabel={roleNavLabel(auth.role)}
              email={auth.email}
              userRole={auth.role}
              onLogout={handleLogout}
              onOpenNotifications={handleOpenNotificationsModule}
              onOpenHelpSupport={handleOpenHelpSupportModule}
              onDownloadTracker={handleDownloadTracker}
              onOpenChangePassword={openChangePasswordDialog}
            />

            {/* Page content */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                px: { xs: 2, sm: 2.5, md: 3 },
                pt:
                  selectedNav === 'Reports'
                    ? { xs: '56px', md: 1.25 }
                    : { xs: '62px', md: 2.5 },
                pb:
                  selectedNav === 'Tasks'
                    ? { xs: 2, sm: 2.5, md: 3 }
                    : selectedNav === 'Reports'
                      ? { xs: 2, sm: 2.5 }
                      : 4,
                overflowX: 'hidden',
                bgcolor: selectedNav === 'Tasks' ? '#f4f4fc' : 'transparent',
              }}
            >
              <Routes>
                <Route
                  path="/employees/:employeeId"
                  element={(
                    <EmployeeDetailPage
                      employees={employees}
                      employeesFetchSettled={employeesFetchSettled}
                      tasks={tasks}
                      setNotice={setNotice}
                      userRole={auth.role}
                      viewerName={auth.displayName}
                      onBack={() => {
                        navigate('/')
                        setSelectedNav('Employees')
                        try {
                          localStorage.setItem('trackdesk-selected-nav', 'Employees')
                        } catch {
                          /* ignore */
                        }
                      }}
                    />
                  )}
                />
                <Route
                  path="*"
                  element={(
                    selectedNav === 'Tasks' ? (
                      <>
                        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                          <TasksPage
                            tasks={tasks}
                            setTasks={setTasks}
                            employees={employees}
                            setNotice={setNotice}
                            initialProjectFilter={selectedTaskProject}
                            userRole={auth.role}
                            displayName={auth.displayName}
                            userId={auth.userId}
                          />
                        </Box>
                      </>
                    ) : (
                      <Stack spacing={2.5} sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>

                  {selectedNav === 'Projects' ? (
                    <ProjectsPage
                      employees={employees}
                      setNotice={setNotice}
                      onOpenTasksForProject={handleOpenTasksForProject}
                      accessMode={auth.role === 'Employee' ? 'member' : 'full'}
                      memberName={auth.displayName}
                    />
                  ) : selectedNav === 'Employees' ? (
                    canManageEmployees(auth.role) ? (
                      !employeesFetchSettled ? (
                        <EmployeesModuleSkeleton />
                      ) : (
                        <EmployeesPage employees={employees} tasks={tasks} setEmployees={setEmployees} setNotice={setNotice} />
                      )
                    ) : (
                      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(245,158,11,0.35)', boxShadow: 'var(--shadow-xs)' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b', mb: 1 }}>
                            Access restricted
                          </Typography>
                          <Typography sx={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
                            You do not have access to employee management. Only administrators can add or edit team members here.
                          </Typography>
                        </CardContent>
                      </Card>
                    )
                  ) : selectedNav === 'Reports' ? (
                    <ReportsPage canViewReports={canAccessReports(auth.role)} tasks={tasks} employees={employees} setNotice={setNotice} />
                  ) : selectedNav === 'Notifications' ? (
                    <NotificationsPage
                      notifications={notifications}
                      loading={notificationsLoading}
                      onRefresh={loadNotifications}
                      onMarkRead={handleMarkNotificationRead}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      onMarkManyRead={handleMarkManyNotificationsRead}
                      onDeleteMany={handleDeleteManyNotifications}
                    />
                  ) : selectedNav === 'Help & Support' ? (
                    <HelpSupportPage setNotice={setNotice} onDownloadTracker={handleDownloadTracker} />
                  ) : !dashboardBootstrapReady ? (
                    <DashboardPageSkeleton />
                  ) : (
                    <>
                      {/* Welcome Banner */}
                      <WelcomeBanner
                        completedTasks={completedTasks}
                        totalTasks={dashboardTasks.length}
                        displayName={auth.displayName}
                        onOpenProjects={handleOpenProjectsModule}
                        onOpenMyTasks={handleOpenMyTasksModule}
                      />

                      {/* Metric Cards */}
                      <SectionHeader label="Key Metrics" action="View All →" />
                      <Box
                        className="stagger"
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: 'repeat(2, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(2, 1fr)',
                            lg: 'repeat(4, 1fr)',
                          },
                          gap: { xs: 1.5, md: 2 },
                        }}
                      >
                        {[
                          (() => {
                            const ratio = stats.total > 0 ? stats.online / stats.total : 0
                            const v = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
                            return {
                              icon: <SpaceDashboardOutlinedIcon sx={{ fontSize: 20 }} />,
                              title: 'Total Systems',
                              value: stats.total,
                              hint: `${stats.online} online`,
                              tone: 'default',
                              delay: 0,
                              trend: formatTrend(v),
                            }
                          })(),
                          (() => {
                            const denom = dashboardTasks.length || 0
                            const ratio = denom > 0 ? completedTasks / denom : 0
                            const v = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
                            return {
                              icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 20 }} />,
                              title: 'Tasks Completed',
                              value: completedTasks,
                              hint: `${dashboardTasks.length} total`,
                              tone: 'success',
                              delay: 60,
                              trend: formatTrend(v),
                            }
                          })(),
                          (() => {
                            const denom = dashboardTasks.length || 0
                            const ratio = denom > 0 ? pendingTasks / denom : 0
                            const v = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
                            return {
                              icon: <HourglassEmptyRoundedIcon sx={{ fontSize: 20 }} />,
                              title: 'Pending Tasks',
                              value: pendingTasks,
                              hint: `${inProgressTasks} in progress`,
                              tone: 'warning',
                              delay: 120,
                              trend: formatTrend(v),
                            }
                          })(),
                          (() => {
                            const denom = employees.length || 0
                            const activeCount = denom > 0 ? employees.filter((e) => e.active !== false).length : 0
                            const ratio = denom > 0 ? activeCount / denom : 0
                            const v = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
                            return {
                              icon: <GroupOutlinedIcon sx={{ fontSize: 20 }} />,
                              title: 'Team Members',
                              value: employees.length,
                              hint: 'Active employees',
                              tone: 'default',
                              delay: 240,
                              trend: formatTrend(v),
                            }
                          })(),
                        ].map((card) => (
                          <MetricCard key={card.title} {...card} />
                        ))}
                      </Box>

                      {/* Analytics row */}
                      <SectionHeader label="Analytics" />
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                          gap: { xs: 1.75, md: 2 },
                        }}
                      >
                        {/* Donut Chart */}
                        <Card
                          className="animate-fade-in-up card-hover"
                          sx={{
                            borderRadius: '18px',
                            border: '1px solid rgba(124,58,237,0.07)',
                            boxShadow: 'var(--shadow-xs)',
                            bgcolor: '#fff',
                            animationDelay: '80ms',
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.2 }}
                              style={{ justifyContent: "space-between" }}>
                              <Box>
                                <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>Task Status</Typography>
                                <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', mt: 0.2 }}>Distribution overview</Typography>
                              </Box>
                              <Chip
                                label="Live"
                                size="small"
                                sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.68rem', height: 22, borderRadius: '7px' }}
                              />
                            </Stack>
                            <DonutChart completed={completedTasks} inProgress={inProgressTasks} pending={Math.max(pendingTasks - inProgressTasks, 0)} />
                          </CardContent>
                        </Card>

                        {/* Progress Bars */}
                        <Card
                          className="animate-fade-in-up card-hover"
                          sx={{
                            borderRadius: '18px',
                            border: '1px solid rgba(124,58,237,0.07)',
                            boxShadow: 'var(--shadow-xs)',
                            bgcolor: '#fff',
                            animationDelay: '160ms',
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}
                              style={{ justifyContent: "space-between" }}>
                              <Box>
                                <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>Project Progress</Typography>
                                <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', mt: 0.2 }}>Tasks completed per project</Typography>
                              </Box>
                              <Stack direction="row" spacing={1.5}>
                                {[
                                  { color: '#7c3aed', label: 'Total Tasks' },
                                  { color: '#059669', label: 'Completed' },
                                ].map((l) => (
                                  <Stack key={l.label} direction="row" spacing={0.5} alignItems="center">
                                    <FiberManualRecordRoundedIcon sx={{ fontSize: 12, color: l.color }} />
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>{l.label}</Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </Stack>
                            <ProgressBars systems={systems} />
                          </CardContent>
                        </Card>
                      </Box>

                      {/* Activity row */}
                      <SectionHeader label="Activity" />
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: { xs: 1.75, md: 2 },
                        }}
                      >
                        {/* Project Completion */}
                        <Card
                          className="animate-fade-in-up card-hover"
                          sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.07)', boxShadow: 'var(--shadow-xs)', bgcolor: '#fff', animationDelay: '100ms' }}
                        >
                          <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }} style={{ justifyContent: "space-between" }}>
                              <Box>
                                <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>Project Completion</Typography>
                                <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', mt: 0.2 }}>Progress by project</Typography>
                              </Box>
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed', cursor: 'pointer' }}>View All</Typography>
                            </Stack>

                            {projectCompletionRows.length > 0 ? (
                              projectCompletionRows.map((proj) => (
                                <Box key={proj.name} sx={{ mb: 2 }}>
                                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e1b4b' }}>{proj.name}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: proj.color }}>{proj.value}%</Typography>
                                  </Stack>
                                  <LinearProgress
                                    variant="determinate"
                                    value={proj.value}
                                    sx={{
                                      height: 8,
                                      borderRadius: '100px',
                                      bgcolor: '#f0effe',
                                      '& .MuiLinearProgress-bar': {
                                        background: `linear-gradient(90deg, ${proj.color} 0%, ${proj.color}cc 100%)`,
                                        borderRadius: '100px',
                                        boxShadow: `0 2px 8px ${proj.color}44`,
                                      },
                                    }}
                                  />
                                </Box>
                              ))
                            ) : (
                              <Box sx={{ py: 2, alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                                  No project task data yet.
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>

                      </Box>

                      {/* Team Productivity Table */}
                      <SectionHeader label="Team Productivity" action="Full Report →" />
                      <Card
                        className="animate-fade-in-up"
                        sx={{
                          borderRadius: '18px',
                          border: '1px solid rgba(124,58,237,0.07)',
                          boxShadow: 'var(--shadow-xs)',
                          bgcolor: '#fff',
                          overflow: 'hidden',
                          animationDelay: '120ms',
                        }}
                      >
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                          {/* Table header */}
                          <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>Team Productivity</Typography>
                            <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', mt: 0.2 }}>Hours logged & task completion per employee</Typography>
                          </Box>

                          <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#fafafe' }}>
                                  {['Employee', 'Role', 'Tasks', 'Completed', 'Active', 'Completion', 'Hours'].map((col) => (
                                    <TableCell
                                      key={col}
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: '0.7rem',
                                        color: '#64748b',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.8,
                                        py: 1.5,
                                        px: 2,
                                        borderColor: 'rgba(0,0,0,0.05)',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {col}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {teamRows.map((row) => (
                                  <TableRow
                                    key={row.id}
                                    sx={{
                                      borderColor: 'rgba(0,0,0,0.04)',
                                      transition: 'background 0.2s',
                                      '&:hover': { bgcolor: 'rgba(124,58,237,0.025)' },
                                      '&:last-child td': { border: 0 },
                                    }}
                                  >
                                    <TableCell sx={{ py: 1.35, px: 1.75 }}>
                                      <Stack direction="row" spacing={1.5} alignItems="center" style={{alignItems: 'center'}}>
                                        <Avatar
                                          sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: row.color,
                                            fontSize: '0.78rem',
                                            fontWeight: 800,
                                            boxShadow: `0 3px 10px ${row.color}50`,
                                            flexShrink: 0,
                                          }}
                                        >
                                          {row.name.charAt(0)}
                                        </Avatar>
                                        <Typography sx={{ fontSize: '0.83rem', fontWeight: 700, color: '#1e1b4b', whiteSpace: 'nowrap' }}>
                                          {row.name}
                                        </Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.35, px: 1.75 }}>
                                      <Chip
                                        label={row.role}
                                        size="small"
                                        sx={{
                                          bgcolor: row.role === 'Admin' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                                          color: row.role === 'Admin' ? '#7c3aed' : '#059669',
                                          fontWeight: 800,
                                          fontSize: '0.7rem',
                                          height: 24,
                                          borderRadius: '7px',
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ py: 1.35, px: 1.75, fontWeight: 700, color: '#475569', fontSize: '0.83rem' }}>{row.tasks}</TableCell>
                                    <TableCell sx={{ py: 1.35, px: 1.75, fontWeight: 800, color: '#059669', fontSize: '0.83rem' }}>{row.completed}</TableCell>
                                    <TableCell sx={{ py: 1.35, px: 1.75, fontWeight: 700, color: '#475569', fontSize: '0.83rem' }}>{row.active}</TableCell>
                                    <TableCell sx={{ py: 1.35, px: 1.75 }}>
                                      <Stack direction="row" spacing={1} alignItems="center" style={{alignItems: 'center'}}>
                                        <LinearProgress
                                          variant="determinate"
                                          value={Math.min(Number.parseInt(row.completion, 10), 100)}
                                          sx={{
                                            width: { xs: 60, sm: 90 },
                                            height: 6,
                                            borderRadius: '100px',
                                            bgcolor: '#ede9fe',
                                            '& .MuiLinearProgress-bar': {
                                              background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)',
                                              borderRadius: '100px',
                                            },
                                          }}
                                        />
                                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e1b4b', whiteSpace: 'nowrap' }}>
                                          {row.completion}
                                        </Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.35, px: 1.75 }}>
                                      <Chip
                                        label={row.hours}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(124,58,237,0.08)', color: '#7c3aed', fontWeight: 800, fontSize: '0.7rem', height: 24, borderRadius: '7px' }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {teamRows.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center' }}>
                                      <Typography sx={{ color: '#94a3b8', fontWeight: 800 }}>No employees found.</Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </Stack>
                    )
                  )}
                />
              </Routes>
            </Box>
          </Box>
        </Box>
      )}
      <Dialog
        open={changePasswordOpen}
        onClose={(_, reason) => {
          if (auth.passwordResetRequired && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return
          if (auth.passwordResetRequired) return
          setChangePasswordOpen(false)
        }}
        disableEscapeKeyDown={auth.passwordResetRequired}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              border: '1px solid rgba(124,58,237,0.14)',
              boxShadow: '0 30px 70px -24px rgba(76,29,149,0.45)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            color: '#1e1b4b',
            pb: 1.2,
            background: 'linear-gradient(180deg, rgba(124,58,237,0.10), rgba(124,58,237,0.02))',
          }}
        >
          <Stack spacing={0.35}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#312e81' }}>Change password</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
              Keep your account secure with a strong password.
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {auth.passwordResetRequired && (
            <Box
              sx={{
                mb: 1.25,
                p: 1.1,
                borderRadius: '10px',
                bgcolor: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.35)',
              }}
            >
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e' }}>
                Password change required for first login
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 600, mt: 0.2 }}>
                You must set a new password before continuing.
              </Typography>
            </Box>
          )}
          <Stack spacing={1.5} component="form" id="change-password-form" onSubmit={handleChangePasswordSubmit} sx={{ pt: 0.5 }}>
            <TextField
              label="Current password"
              type={showChangePassword ? 'text' : 'password'}
              size="small"
              value={changePasswordForm.currentPassword}
              onChange={(e) => setChangePasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowChangePassword((p) => !p)} size="small" edge="end">
                      {showChangePassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '13px',
                  bgcolor: '#fcfcff',
                },
              }}
            />
            <TextField
              label="New password"
              type={showChangePassword ? 'text' : 'password'}
              size="small"
              value={changePasswordForm.newPassword}
              onChange={(e) => setChangePasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              fullWidth
              helperText="Use at least 8 characters."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '13px',
                  bgcolor: '#fcfcff',
                },
                '& .MuiFormHelperText-root': {
                  ml: 0.5,
                  fontWeight: 600,
                  color: '#64748b',
                },
              }}
            />
            <TextField
              label="Confirm new password"
              type={showChangePassword ? 'text' : 'password'}
              size="small"
              value={changePasswordForm.confirmPassword}
              onChange={(e) => setChangePasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '13px',
                  bgcolor: '#fcfcff',
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.75 }}>
          {!auth.passwordResetRequired && (
            <Button
              onClick={() => setChangePasswordOpen(false)}
              sx={{ textTransform: 'none', fontWeight: 800, color: '#7c3aed' }}
            >
              Cancel
            </Button>
          )}
          <Button
            form="change-password-form"
            type="submit"
            variant="contained"
            disabled={changingPassword}
            sx={{
              textTransform: 'none',
              fontWeight: 900,
              px: 2.25,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              boxShadow: '0 10px 22px -8px rgba(124,58,237,0.6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6d28d9, #5b21b6)',
              },
            }}
          >
            {changingPassword ? 'Updating...' : 'Update password'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default App

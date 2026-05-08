import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  InputBase,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import NorthEastOutlinedIcon from '@mui/icons-material/NorthEastOutlined'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import LinkIcon from '@mui/icons-material/Link'
import CodeIcon from '@mui/icons-material/Code'
import TitleIcon from '@mui/icons-material/Title'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined'
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined'
import CodeBranchIcon from '@mui/icons-material/AccountTree'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation'
import ContentCopy from '@mui/icons-material/ContentCopy'
import LockIcon from '@mui/icons-material/Lock'
import PushPinIcon from '@mui/icons-material/PushPin'
import FeedbackIcon from '@mui/icons-material/Feedback'
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined'
import LabelIcon from '@mui/icons-material/Label'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import { createTask, deleteTask, getProjects, getTasks, startTrackerTimer, stopTrackerTimer, updateTask } from './services/api'
import { TasksBoardSkeleton } from './pageSkeletons.jsx'

/**
 * DigiTracker Kanban — light board (white / soft lavender), dark text; accent #7c4dff
 */
const PRIMARY = '#7c4dff'
const PRIMARY_DARK = '#6d28d9'
const PRIMARY_GLOW = 'rgba(124, 77, 255, 0.35)'
const PRIMARY_SOFT = 'rgba(124, 77, 255, 0.1)'
const PRIMARY_SOFT_STRONG = 'rgba(124, 77, 255, 0.16)'
const PRIMARY_BTN_GRADIENT = 'linear-gradient(135deg, #9d7cff 0%, #7c4dff 45%, #6338e0 100%)'
const PRIMARY_BTN_GRADIENT_HOVER = 'linear-gradient(135deg, #ad8fff 0%, #8b5cff 50%, #7042e8 100%)'

const BG_CHROME = '#f4f4fc'
const BG_PANEL = '#ffffff'
const BG_PANEL_GRADIENT = 'linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)'
const BG_COLUMN = '#f5f4fb'
const BG_COLUMN_ZONE = '#fbfbfe'
const BG_CARD = '#ffffff'
const BG_CARD_HOVER = '#faf9ff'
const BORDER_SUBTLE = 'rgba(124, 58, 237, 0.12)'
const BORDER_PANEL = 'rgba(124, 58, 237, 0.1)'
const BORDER_INPUT = 'rgba(124, 58, 237, 0.2)'
const BORDER_GHOST = 'rgba(15, 23, 42, 0.1)'
const TEXT_PRIMARY = '#1e1b4b'
const TEXT_MUTED = '#64748b'
const INPUT_BG = '#f8f7fc'
const DIALOG_BG = '#ffffff'
const MENU_SURFACE = '#ffffff'
const CHIP_BG = 'rgba(30, 27, 75, 0.06)'
const CARD_SHADOW = '0 1px 3px rgba(30, 27, 75, 0.06), 0 4px 12px rgba(30, 27, 75, 0.04)'
const CARD_SHADOW_HOVER = '0 4px 16px rgba(124, 77, 255, 0.12)'
const DETAIL_BG = '#0b1020'
const DETAIL_SURFACE = '#101a33'
const DETAIL_BORDER = 'rgba(148, 163, 184, 0.2)'
const DETAIL_TEXT = '#e2e8f0'
const DETAIL_MUTED = '#94a3b8'

const COLUMN_WIP_MAX = 5
const PRIORITY_ORDER = ['low', 'medium', 'high']
const STATUS_ORDER = ['backlog', 'ready', 'in progress', 'in review']

const COLUMNS = [
  {
    droppableId: 'column-backlog',
    status: 'backlog',
    title: 'Backlog',
    hint: "This item hasn't been started",
    accent: '#5EEAD4',
    hollowDot: true,
  },
  {
    droppableId: 'column-ready',
    status: 'ready',
    title: 'Ready',
    hint: 'Ready to be picked up',
    accent: '#7DD3FC',
    hollowDot: true,
  },
  {
    droppableId: 'column-in-progress',
    status: 'in progress',
    title: 'In progress',
    hint: 'Actively in flight',
    accent: '#FBBF24',
    hollowDot: false,
  },
  {
    droppableId: 'column-in-review',
    status: 'in review',
    title: 'In review',
    hint: 'Waiting on review',
    accent: '#D8B4FE',
    hollowDot: false,
  },
]

function canonicalStatus(raw) {
  const s = String(raw || '').toLowerCase().trim().replace(/_/g, ' ')
  if (s === 'completed' || s === 'done') return 'in review'
  if (s === 'in review') return 'in review'
  if (s === 'in progress' || s === 'doing') return 'in progress'
  if (s === 'ready') return 'ready'
  if (s === 'backlog' || s === 'pending' || s === '') return 'backlog'
  return 'backlog'
}

function projectSlug(name) {
  return String(name || 'project')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .replace(/^\.+|\.+$/g, '') || 'project'
}

function priorityAccent(priority) {
  const p = String(priority || '').toLowerCase()
  if (p === 'high') return '#dc2626'
  if (p === 'low') return '#059669'
  return PRIMARY
}

function detailStatusChip(status) {
  const s = canonicalStatus(status)
  if (s === 'in review') return { label: 'In review', sx: { bgcolor: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff' } }
  if (s === 'in progress') return { label: 'In progress', sx: { bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#fde68a' } }
  if (s === 'ready') return { label: 'Ready', sx: { bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#bfdbfe' } }
  return { label: 'Open', sx: { bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0' } }
}

function KanbanColumn({ column, tasks, onAddInColumn, children, showAddControls = true }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.droppableId })

  return (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: 260,
        maxWidth: 340,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'stretch',
        bgcolor: BG_COLUMN,
        borderRadius: '12px',
        border: `1px solid ${BORDER_SUBTLE}`,
        boxShadow: CARD_SHADOW,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                flexShrink: 0,
                border: column.hollowDot ? `2px solid ${column.accent}` : 'none',
                bgcolor: column.hollowDot ? 'transparent' : column.accent,
                boxShadow: column.hollowDot ? 'none' : `0 0 12px ${column.accent}66`,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: TEXT_PRIMARY, lineHeight: 1.25 }}>
                {column.title}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: TEXT_MUTED, mt: 0.35, lineHeight: 1.3 }}>
                {column.hint}
              </Typography>
            </Box>
          </Stack>
          {showAddControls && (
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <IconButton
                size="small"
                onClick={() => onAddInColumn(column.status)}
                sx={{
                  color: column.accent,
                  p: 0.5,
                  '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.08)' },
                }}
                aria-label="Add task to column"
              >
                <AddIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.75 }}>
          <Chip
            label={`${tasks.length} / ${COLUMN_WIP_MAX}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: CHIP_BG,
              color: TEXT_MUTED,
              border: `1px solid ${BORDER_GHOST}`,
            }}
          />
          <Chip
            label="Estimate: 0"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 600,
              bgcolor: CHIP_BG,
              color: TEXT_MUTED,
              border: `1px solid ${BORDER_GHOST}`,
            }}
          />
        </Stack>
      </Box>

      <Box
        ref={setNodeRef}
        sx={{
          flex: 1,
          minHeight: 0,
          px: 1.25,
          pb: 1.25,
          pt: 0.5,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: isOver ? PRIMARY_SOFT : BG_COLUMN_ZONE,
          borderTop: `1px solid ${BORDER_GHOST}`,
          transition: 'background 0.15s ease',
        }}
      >
        <Stack spacing={1.15} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.25, mb: 1.25 }}>
          {children} 
        </Stack>
        {showAddControls && (
          <Button
            fullWidth
            onClick={() => onAddInColumn(column.status)}
            startIcon={<AddIcon sx={{ fontSize: 18, opacity: 0.85 }} />}
            sx={{
              py: 1.15,
              flexShrink: 0,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              color: TEXT_MUTED,
              bgcolor: 'transparent',
              border: `1px dashed ${BORDER_GHOST}`,
              '&:hover': {
                bgcolor: PRIMARY_SOFT,
                borderColor: PRIMARY,
                borderStyle: 'dashed',
                color: PRIMARY_DARK,
              },
            }}
          >
            Add item
          </Button>
        )}
      </Box>
    </Box>
  )
}

function TaskCard({ task, onEdit, isAdmin, onAdminToggleTimer, busy = false, nowMs = Date.now() }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(task.id) })
  const slug = projectSlug(task.project)
  const pa = priorityAccent(task.priority)
  const isTimerRunning = Boolean(task?.activeTimer?.startedAt)
  const inProgress = canonicalStatus(task?.status) === 'in progress'
  const trackedSeconds = Number(task?.totalTrackedSeconds || 0)
  const liveDeltaSeconds = isTimerRunning
    ? Math.max(0, Math.floor((Number(nowMs) - new Date(task?.activeTimer?.startedAt || nowMs).getTime()) / 1000))
    : 0
  const shownTrackedSeconds = trackedSeconds + liveDeltaSeconds
  const trackedMinutesTotal = Math.floor(shownTrackedSeconds / 60)
  const trackedHours = Math.floor(trackedMinutesTotal / 60)
  const trackedMinutes = trackedMinutesTotal % 60
  const trackedTimeLabel = `${trackedHours}h ${trackedMinutes}min tracked`
  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.25 : 1 }
    : { opacity: isDragging ? 0.25 : 1 }

  return (
    <Paper
    className='task-card'
      ref={setNodeRef}
      elevation={0}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(task)}
      sx={{
        cursor: 'grab',
        touchAction: 'none',
        borderRadius: '10px',
        border: `1px solid ${BORDER_GHOST}`,
        bgcolor: BG_CARD,
        overflow: 'hidden',
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        boxShadow: CARD_SHADOW,
        '&:hover': {
          bgcolor: BG_CARD_HOVER,
          borderColor: BORDER_SUBTLE,
          boxShadow: CARD_SHADOW_HOVER,
        },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Stack sx={{ p: 1.35 }} spacing={0.9}>
        <Stack direction="row" alignItems="center" spacing={0.6} sx={{ minWidth: 0 }} className='task-card-header' style={{alignItems: 'center', justifyContent: 'space-between'}}>
          <Box style={{display: 'flex', alignItems: 'center', gap: 4}}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: `3px solid ${pa}`,
                bgcolor: 'transparent',
                boxShadow: `0 0 0 3px ${pa}1f`,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: TEXT_MUTED,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {slug}{" "}{" "}#{task.id}
            </Typography>
            </Box>
            {(task.assignee || (isAdmin && inProgress)) && (
              <Stack direction="row" alignItems="center" spacing={0.6}>
                {task.assignee ? (
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: PRIMARY,
                      color: '#fff',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    {task.assignee.charAt(0)}
                  </Avatar>
                ) : null}

                {/* {isAdmin && inProgress ? (
                  <IconButton
                    size="small"
                    disableRipple
                    disabled={busy}
                    title={isTimerRunning ? 'Stop timer' : 'Start timer'}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onAdminToggleTimer?.(task)
                    }}
                    sx={{
                      width: 24,
                      height: 24,
                      minWidth: 24,
                      p: 0,
                      borderRadius: '999px',
                      bgcolor: isTimerRunning ? 'rgba(220,38,38,0.10)' : 'rgba(124,58,237,0.10)',
                      color: isTimerRunning ? '#dc2626' : PRIMARY_DARK,
                      border: `1px solid ${isTimerRunning ? 'rgba(220,38,38,0.28)' : 'rgba(124,58,237,0.28)'}`,
                      boxShadow: isTimerRunning ? '0 4px 10px rgba(220,38,38,0.10)' : '0 4px 10px rgba(124,58,237,0.10)',
                      transition: 'transform 0.12s, box-shadow 0.12s, background-color 0.12s, border-color 0.12s',
                      '& .MuiSvgIcon-root': { fontSize: 18 },
                      '&:hover': {
                        bgcolor: isTimerRunning ? 'rgba(220,38,38,0.18)' : 'rgba(124,58,237,0.16)',
                        borderColor: isTimerRunning ? 'rgba(220,38,38,0.38)' : 'rgba(124,58,237,0.38)',
                        boxShadow: isTimerRunning ? '0 8px 18px rgba(220,38,38,0.16)' : '0 8px 18px rgba(124,58,237,0.16)',
                        transform: 'translateY(-1px)',
                      },
                      '&:disabled': {
                        opacity: 0.65,
                        transform: 'none',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {isTimerRunning ? (
                      <StopRoundedIcon sx={{ fontSize: 18, mb: '1px' }} />
                    ) : (
                      <PlayArrowRoundedIcon sx={{ fontSize: 18, mb: '1px' }} />
                    )}
                  </IconButton>
                ) : null} */}
              </Stack>
            )}
        </Stack>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.90rem',
            color: TEXT_PRIMARY,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.35,
          }}
        >
          {task.title}
        </Typography>
      </Stack>
    </Paper>
  )
}

function TaskCardPreview({ task }) {
  const slug = projectSlug(task.project)
  const pa = priorityAccent(task.priority)
  return (
    <Paper
      elevation={8}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${BORDER_SUBTLE}`,
        bgcolor: BG_CARD,
        width: 300,
        boxShadow: `0 20px 48px rgba(124, 77, 255, 0.2), 0 8px 24px rgba(30, 27, 75, 0.12)`,
      }}
    >
      <Stack sx={{ p: 1.25 }}>
        <Stack direction="row" alignItems="center" spacing={0.85} sx={{ mb: 1 }}>
          <Box sx={{ width: 11, height: 11, borderRadius: '50%', border: `3px solid ${pa}`, boxShadow: `0 0 0 3px ${pa}1f` }} />
          <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED, fontWeight: 700 }}>
            {slug} #{task.id}
          </Typography>
        </Stack>
        <Typography sx={{ fontWeight: 700, fontSize: '0.94rem', color: TEXT_PRIMARY, lineHeight: 1.45 }}>
          {task.title}
        </Typography>
      </Stack>
    </Paper>
  )
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT_BG,
    color: TEXT_PRIMARY,
    '& fieldset': { borderColor: BORDER_INPUT },
    '&:hover fieldset': { borderColor: PRIMARY },
    '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 1 },
  },
  '& .MuiInputLabel-root': { color: TEXT_MUTED },
  '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY },
  '& .MuiOutlinedInput-input::placeholder': { color: 'rgba(100, 116, 139, 0.65)', opacity: 1 },
}

/** Kanban board toolbar: keep outlined inputs and primary button the same visual height */
const BOARD_TOOLBAR_INPUT_HEIGHT = 40
const boardToolbarFieldSx = {
  ...fieldSx,
  mt: 0,
  '& .MuiOutlinedInput-root': {
    ...fieldSx['& .MuiOutlinedInput-root'],
    height: BOARD_TOOLBAR_INPUT_HEIGHT,
    minHeight: BOARD_TOOLBAR_INPUT_HEIGHT,
  },
}

const formFieldTitleSx = {
  display: 'block',
  mb: 0.6,
  fontWeight: 700,
  fontSize: '0.7rem',
  color: TEXT_MUTED,
}

const emptyForm = () => ({
  title: '',
  description: '',
  project: '',
  priority: 'medium',
  status: 'backlog',
  assignee: null,
  loggedHours: '',
  loggedDate: '',
  deadline: '',
  attachments: [],
})

function isLikelyImageUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return false
  if (/^data:image\//i.test(value)) return true
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(value)
}

function renderInlineMarkdown(text, resolveAttachmentUrl) {
  const src = String(text || '')
  const parts = []
  let i = 0
  let key = 0
  while (i < src.length) {
    if (src.startsWith('![', i)) {
      const closeAlt = src.indexOf(']', i + 2)
      if (closeAlt !== -1 && src[closeAlt + 1] === '(') {
        const closeHref = src.indexOf(')', closeAlt + 2)
        if (closeHref !== -1) {
          const alt = src.slice(i + 2, closeAlt) || 'image'
          const hrefRaw = src.slice(closeAlt + 2, closeHref)
          const href = resolveAttachmentUrl ? (resolveAttachmentUrl(hrefRaw) || hrefRaw) : hrefRaw
          parts.push(
            <Box
              key={`img-${key++}`}
              component="img"
              src={href}
              alt={alt}
              sx={{
                display: 'block',
                maxWidth: '100%',
                width: 'auto',
                maxHeight: 260,
                borderRadius: '8px',
                border: `1px solid ${BORDER_INPUT}`,
                my: 0.8,
              }}
            />,
          )
          i = closeHref + 1
          continue
        }
      }
    }

    if (src.startsWith('**', i)) {
      const end = src.indexOf('**', i + 2)
      if (end !== -1) {
        parts.push(<strong key={`b-${key++}`}>{src.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }
    if (src[i] === '*' && !src.startsWith('**', i)) {
      const end = src.indexOf('*', i + 1)
      if (end !== -1) {
        parts.push(<em key={`i-${key++}`}>{src.slice(i + 1, end)}</em>)
        i = end + 1
        continue
      }
    }
    if (src[i] === '`') {
      const end = src.indexOf('`', i + 1)
      if (end !== -1) {
        parts.push(
          <Box
            key={`c-${key++}`}
            component="code"
            sx={{ px: 0.5, py: 0.15, borderRadius: '4px', bgcolor: 'rgba(30,27,75,0.08)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.78rem' }}
          >
            {src.slice(i + 1, end)}
          </Box>,
        )
        i = end + 1
        continue
      }
    }
    if (src[i] === '[') {
      const closeText = src.indexOf(']', i + 1)
      if (closeText !== -1 && src[closeText + 1] === '(') {
        const closeHref = src.indexOf(')', closeText + 2)
        if (closeHref !== -1) {
          const label = src.slice(i + 1, closeText)
          const href = src.slice(closeText + 2, closeHref)
          parts.push(
            <Box
              key={`a-${key++}`}
              component="a"
              href={href}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: PRIMARY_DARK,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                fontWeight: 600,
                cursor: 'pointer !important',
                pointerEvents: 'auto',
                '&:hover': { color: PRIMARY, textDecorationThickness: '2px' },
              }}
            >
              {label}
            </Box>,
          )
          i = closeHref + 1
          continue
        }
      }
    }
    const nextSpecial = (() => {
      const candidates = [
        src.indexOf('![', i),
        src.indexOf('**', i),
        src.indexOf('*', i),
        src.indexOf('`', i),
        src.indexOf('[', i),
      ].filter((n) => n !== -1)
      return candidates.length ? Math.min(...candidates) : -1
    })()
    const end = nextSpecial === -1 ? src.length : nextSpecial
    parts.push(<span key={`t-${key++}`}>{src.slice(i, end)}</span>)
    i = end
  }
  return parts
}

function renderMarkdownPreview(text, resolveAttachmentUrl) {
  const lines = String(text || '').split('\n')
  const out = []
  let idx = 0
  while (idx < lines.length) {
    const line = lines[idx]
    if (!line.trim()) {
      idx += 1
      continue
    }
    if (isLikelyImageUrl(line.trim())) {
      out.push(
        <Box
          key={`img-url-${idx}`}
          component="img"
          src={line.trim()}
          alt="attachment"
          sx={{
            display: 'block',
            maxWidth: '100%',
            width: 'auto',
            maxHeight: 260,
            borderRadius: '8px',
            border: `1px solid ${BORDER_INPUT}`,
            my: 0.8,
          }}
        />,
      )
      idx += 1
      continue
    }
    if (line.startsWith('## ')) {
      out.push(
        <Typography key={`h2-${idx}`} sx={{ fontSize: '1rem', fontWeight: 800, color: TEXT_PRIMARY, mt: 1, mb: 0.6 }}>
          {renderInlineMarkdown(line.slice(3), resolveAttachmentUrl)}
        </Typography>,
      )
      idx += 1
      continue
    }
    if (line.startsWith('- ')) {
      const items = []
      let j = idx
      while (j < lines.length && lines[j].startsWith('- ')) {
        items.push(lines[j].slice(2))
        j += 1
      }
      out.push(
        <Box key={`ul-${idx}`} component="ul" sx={{ pl: 2.5, my: 0.6 }}>
          {items.map((it, n) => (
            <Box key={`uli-${idx}-${n}`} component="li" sx={{ color: TEXT_PRIMARY, fontSize: '0.85rem', lineHeight: 1.6 }}>
              {renderInlineMarkdown(it, resolveAttachmentUrl)}
            </Box>
          ))}
        </Box>,
      )
      idx = j
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      const items = []
      let j = idx
      while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
        items.push(lines[j].replace(/^\d+\.\s/, ''))
        j += 1
      }
      out.push(
        <Box key={`ol-${idx}`} component="ol" sx={{ pl: 2.8, my: 0.6 }}>
          {items.map((it, n) => (
            <Box key={`oli-${idx}-${n}`} component="li" sx={{ color: TEXT_PRIMARY, fontSize: '0.85rem', lineHeight: 1.6 }}>
              {renderInlineMarkdown(it, resolveAttachmentUrl)}
            </Box>
          ))}
        </Box>,
      )
      idx = j
      continue
    }
    out.push(
      <Typography key={`p-${idx}`} sx={{ color: TEXT_PRIMARY, fontSize: '0.85rem', lineHeight: 1.65, mb: 0.6 }}>
        {renderInlineMarkdown(line, resolveAttachmentUrl)}
      </Typography>,
    )
    idx += 1
  }
  return out
}

export default function TasksPage({
  tasks,
  setTasks,
  employees = [],
  setNotice,
  initialProjectFilter = 'all',
  userRole = 'Admin',
  displayName = '',
  userId = null,
}) {
  const isEmployee = userRole === 'Employee'
  const selfName = String(displayName || '').trim()
  const isAdmin = userRole === 'Admin'
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuTask, setMenuTask] = useState(null)
  const [descTab, setDescTab] = useState(0)
  const [createMore, setCreateMore] = useState(false)
  const [detailScrollKey, setDetailScrollKey] = useState(0)
  const [assigneeAnchor, setAssigneeAnchor] = useState(null)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [adminTimerBusyTaskId, setAdminTimerBusyTaskId] = useState(null)
  const [nowMs, setNowMs] = useState(Date.now())
  const descriptionInputRef = useRef(null)
  const attachmentInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const data = await getProjects()
          if (mounted) setProjects(Array.isArray(data) ? data : [])
        } catch (err) {
          if (mounted) {
            setProjects([])
            setNotice?.({ type: 'error', message: err?.message || 'Failed to load projects' })
          }
        } finally {
          if (mounted) setLoadingProjects(false)
        }
      })()
    return () => { mounted = false }
  }, [setNotice])

  useEffect(() => {
    const normalized = String(initialProjectFilter || 'all').trim().toLowerCase() || 'all'
    setSelectedProject(normalized)
  }, [initialProjectFilter])

  const projectOptions = useMemo(() => {
    const byName = new Map()
    for (const p of projects) {
      const name = String(p?.name || '').trim()
      if (!name) continue
      byName.set(name.toLowerCase(), name)
    }
    return Array.from(byName.values()).sort((a, b) => a.localeCompare(b))
  }, [projects])

  const employeeFilterOptions = useMemo(() => {
    const byKey = new Map()
    for (const e of employees || []) {
      const name = String(e?.name || '').trim()
      if (!name) continue
      byKey.set(name.toLowerCase(), name)
    }
    for (const t of tasks) {
      const name = String(t?.assignee || '').trim()
      if (!name) continue
      if (!byKey.has(name.toLowerCase())) byKey.set(name.toLowerCase(), name)
    }
    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b))
  }, [employees, tasks])

  useEffect(() => {
    if (selectedEmployee === 'all') return
    if (!employeeFilterOptions.includes(selectedEmployee)) setSelectedEmployee('all')
  }, [employeeFilterOptions, selectedEmployee])

  const visibleTasks = useMemo(() => {
    let list = tasks
    if (selectedProject !== 'all') {
      list = list.filter((t) => String(t.project || '').trim().toLowerCase() === selectedProject)
    }
    if (isEmployee && selfName) {
      const want = selfName.toLowerCase()
      list = list.filter((t) => String(t.assignee || '').trim().toLowerCase() === want)
    } else if (selectedEmployee !== 'all') {
      const want = String(selectedEmployee || '').trim().toLowerCase()
      list = list.filter((t) => String(t.assignee || '').trim().toLowerCase() === want)
    }
    return list
  }, [tasks, selectedProject, selectedEmployee, isEmployee, selfName])

  const resolveAssigneeEmployee = useCallback(
    (task) => {
      const assigneeName = String(task?.assignee || '').trim()
      if (!assigneeName) return null
      const want = assigneeName.toLowerCase()
      return (employees || []).find((e) => String(e?.name || '').trim().toLowerCase() === want) || null
    },
    [employees],
  )

  async function refreshTasks() {
    try {
      const latest = await getTasks()
      setTasks(Array.isArray(latest) ? latest : [])
    } catch (err) {
      setNotice?.({ type: 'error', message: err?.message || 'Failed to refresh tasks' })
    }
  }

  // Keep task state synced with desktop start/stop events quickly.
  useEffect(() => {
    let mounted = true
    const id = window.setInterval(async () => {
      try {
        const latest = await getTasks()
        if (mounted) setTasks(Array.isArray(latest) ? latest : [])
      } catch {
        // Silent background refresh; avoid noisy toasts.
      }
    }, 3000)
    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [setTasks])

  const hasRunningTimers = useMemo(
    () => visibleTasks.some((t) => Boolean(t?.activeTimer?.startedAt)),
    [visibleTasks],
  )

  useEffect(() => {
    if (!hasRunningTimers) return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [hasRunningTimers])

  const handleAdminToggleTimer = async (task) => {
    if (!isAdmin) return
    if (!task?.id) return
    setAdminTimerBusyTaskId(String(task.id))
    try {
      const running = Boolean(task?.activeTimer?.startedAt)
      if (running) {
        const timerId = task?.activeTimer?.timerId ?? task?.activeTimer?.id ?? null
        await stopTrackerTimer({
          sessionId: timerId,
          taskId: task.id,
          userId: String(task?.activeTimer?.userId ?? userId ?? '0'),
          source: 'web-admin',
        })
        setNotice?.({ type: 'success', message: 'Timer stopped.' })
      } else {
        const targetEmp = resolveAssigneeEmployee(task)
        await startTrackerTimer({
          userId: String(targetEmp?.id ?? userId ?? 0),
          userName: String(targetEmp?.name ?? displayName ?? 'Administrator'),
          projectName: task.project,
          taskId: task.id,
          taskTitle: task.title,
          source: 'web-admin',
        })
        setNotice?.({ type: 'success', message: 'Timer started.' })
      }
      await refreshTasks()
    } catch (err) {
      setNotice?.({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to control timer' })
    } finally {
      setAdminTimerBusyTaskId(null)
    }
  }

  const grouped = useMemo(() => {
    const g = { backlog: [], ready: [], 'in progress': [], 'in review': [] }
    for (const t of visibleTasks) {
      const key = canonicalStatus(t.status)
      if (g[key]) g[key].push(t)
      else g.backlog.push(t)
    }
    for (const key of Object.keys(g)) {
      g[key].sort((a, b) => Number(b.id) - Number(a.id))
    }
    return g
  }, [visibleTasks])

  const activeTask = activeId ? visibleTasks.find((t) => String(t.id) === activeId) : null

  const repoLabel = form.project
    ? `${projectSlug(form.project) /* mimic org/repo */}`
    : 'select-project'
  const detailsStatus = detailStatusChip(form.status)
  const detailsPriorityColor = priorityAccent(form.priority)
  const currentFormProject = useMemo(
    () => projects.find((p) => String(p.name || '').trim().toLowerCase() === String(form.project || '').trim().toLowerCase()) || null,
    [projects, form.project],
  )
  const attachmentUrlById = useMemo(() => {
    const map = new Map()
    for (const a of Array.isArray(form.attachments) ? form.attachments : []) {
      if (!a?.id || !a?.url) continue
      map.set(String(a.id), String(a.url))
    }
    return map
  }, [form.attachments])

  const isProjectMember = useCallback((project, name) => {
    const want = String(name || '').trim().toLowerCase()
    if (!want) return false
    const members = Array.isArray(project?.members) ? project.members : []
    return members.some((member) => String(member || '').trim().toLowerCase() === want)
  }, [])

  function resolveAttachmentUrl(rawHref) {
    const raw = String(rawHref || '')
    if (!raw.startsWith('attachment:')) return raw
    const id = raw.slice('attachment:'.length)
    return attachmentUrlById.get(id) || ''
  }

  useEffect(() => {
    if (!form.assignee) return
    if (!currentFormProject || !isProjectMember(currentFormProject, form.assignee)) {
      setForm((f) => ({ ...f, assignee: null }))
    }
  }, [currentFormProject, form.assignee, isProjectMember])

  function updateDescriptionWithSelection(nextText, selectionStart, selectionEnd) {
    setForm((f) => ({ ...f, description: nextText }))
    requestAnimationFrame(() => {
      const el = descriptionInputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  function wrapSelection(before, after = before, placeholder = 'text') {
    const el = descriptionInputRef.current
    const current = form.description || ''
    if (!el) {
      const next = `${current}${before}${placeholder}${after}`
      setForm((f) => ({ ...f, description: next }))
      return
    }
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    const selected = current.slice(start, end)
    const content = selected || placeholder
    const next = `${current.slice(0, start)}${before}${content}${after}${current.slice(end)}`
    const cursorStart = start + before.length
    const cursorEnd = cursorStart + content.length
    updateDescriptionWithSelection(next, cursorStart, cursorEnd)
  }

  function prefixLines(prefixBuilder) {
    const el = descriptionInputRef.current
    const current = form.description || ''
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const selected = current.slice(start, end) || 'Item'
    const lines = selected.split('\n')
    const nextSelected = lines.map((line, idx) => `${prefixBuilder(idx)}${line}`).join('\n')
    const next = `${current.slice(0, start)}${nextSelected}${current.slice(end)}`
    updateDescriptionWithSelection(next, start, start + nextSelected.length)
  }

  function insertDescriptionAtCursor(snippet) {
    const el = descriptionInputRef.current
    const current = form.description || ''
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`
    const cursor = start + snippet.length
    updateDescriptionWithSelection(next, cursor, cursor)
  }

  function cyclePriority() {
    const current = String(form.priority || 'medium').toLowerCase()
    const idx = PRIORITY_ORDER.indexOf(current)
    const next = PRIORITY_ORDER[(idx + 1 + PRIORITY_ORDER.length) % PRIORITY_ORDER.length]
    setForm((f) => ({ ...f, priority: next }))
  }

  function cycleStatus() {
    const current = canonicalStatus(form.status)
    const idx = STATUS_ORDER.indexOf(current)
    const next = STATUS_ORDER[(idx + 1 + STATUS_ORDER.length) % STATUS_ORDER.length]
    setForm((f) => ({ ...f, status: next }))
  }

  function cycleProject() {
    const options = Array.isArray(projectOptions) ? projectOptions : []
    if (options.length === 0) return
    const current = String(form.project || '').trim().toLowerCase()
    const idx = options.findIndex((name) => String(name || '').trim().toLowerCase() === current)
    const next = options[(idx + 1 + options.length) % options.length]
    setForm((f) => ({ ...f, project: next }))
  }

  async function fileToDataUrl(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function embedImageFiles(files) {
    const imageFiles = Array.from(files || []).filter((f) => String(f.type || '').startsWith('image/'))
    if (imageFiles.length === 0) return
    try {
      const prepared = await Promise.all(
        imageFiles.map(async (file) => {
          const dataUrl = await fileToDataUrl(file)
          const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const alt = String(file.name || 'image').replace(/\.[^.]+$/, '')
          return {
            id,
            alt,
            url: dataUrl,
            name: file.name || alt,
            type: file.type || 'image/*',
            size: Number(file.size || 0),
          }
        }),
      )
      setForm((f) => ({ ...f, attachments: [...(Array.isArray(f.attachments) ? f.attachments : []), ...prepared] }))
      const markdownParts = prepared.map((a) => `![${a.alt}](attachment:${a.id})`)
      const prefix = form.description ? '\n' : ''
      insertDescriptionAtCursor(`${prefix}${markdownParts.join('\n')}\n`)
      setNotice?.({ type: 'success', message: `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} attached.` })
    } catch {
      setNotice?.({ type: 'error', message: 'Failed to attach image.' })
    }
  }

  function resolveDropStatus(overId) {
    if (!overId) return null
    const col = COLUMNS.find((c) => c.droppableId === overId)
    if (col) return col.status
    const overTaskId = Number(overId)
    if (!Number.isFinite(overTaskId)) return null
    const t = tasks.find((x) => x.id === overTaskId)
    return t ? canonicalStatus(t.status) : null
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const taskId = Number(active.id)
    if (!Number.isFinite(taskId)) return

    const nextStatus = resolveDropStatus(over.id)
    if (!nextStatus) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    if (canonicalStatus(task.status) === nextStatus) return

    try {
      await updateTask(taskId, { status: nextStatus })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)))
    } catch (err) {
      setNotice?.({ type: 'error', message: err?.message || 'Failed to move card' })
    }
  }

  function openCreate(initialStatus = 'backlog') {
    setEditingId(null)
    const firstProject = projectOptions[0] || ''
    const defaultProject = selectedProject === 'all'
      ? firstProject
      : (projectOptions.find((n) => n.toLowerCase() === selectedProject) || firstProject)
    setForm({
      ...emptyForm(),
      project: defaultProject,
      status: initialStatus,
      assignee: isEmployee && selfName ? selfName : null,
    })
    setDescTab(0)
    setAssigneeSearch('')
    setDialogOpen(true)
  }

  function openEdit(task) {
    setEditingId(task.id)
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      project: task.project ?? '',
      priority: String(task.priority || 'medium').toLowerCase(),
      status: canonicalStatus(task.status),
      assignee: task.assignee || null,
      loggedHours: task.loggedHours != null && task.loggedHours !== '' ? String(task.loggedHours) : '',
      loggedDate: task.loggedDate ? String(task.loggedDate).slice(0, 10) : '',
      deadline: task.deadline ? String(task.deadline).slice(0, 10) : '',
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
    })
    setDescTab(0)
    setAssigneeSearch('')
    setDetailScrollKey((v) => v + 1)
    setDialogOpen(true)
  }

  async function handleSubmitDialog() {
    const title = form.title.trim()
    const project = form.project.trim()
    if (!title || !project) {
      setNotice?.({ type: 'error', message: 'Title and project are required.' })
      return
    }
    if (form.deadline && form.loggedDate && form.loggedDate > form.deadline) {
      setNotice?.({ type: 'error', message: 'Work date cannot be after task deadline.' })
      return
    }
    const assigneeForSave = isEmployee && selfName ? selfName : form.assignee
    if (assigneeForSave && currentFormProject && !isProjectMember(currentFormProject, assigneeForSave)) {
      setNotice?.({ type: 'error', message: 'Assignee must be a member of the selected project.' })
      return
    }
    setSubmitting(true)
    try {
      if (editingId == null) {
        const rawHours =
          form.loggedHours === '' || form.loggedHours == null ? null : Number(form.loggedHours)
        const created = await createTask({
          title,
          project,
          priority: form.priority,
          status: form.status,
          description: form.description.trim(),
          attachments: form.attachments || [],
          assignee: assigneeForSave,
          loggedHours: rawHours != null && Number.isFinite(rawHours) ? rawHours : undefined,
          loggedDate: form.loggedDate || undefined,
          deadline: form.deadline || undefined,
        })
        setTasks((prev) => [created, ...prev])
        setNotice?.({ type: 'success', message: 'Task created.' })
        if (createMore) {
          setForm((f) => ({
            ...emptyForm(),
            project: f.project,
            status: f.status,
            priority: f.priority,
          }))
          setDescTab(0)
        } else {
          setDialogOpen(false)
        }
      } else {
        const rawHoursEdit =
          form.loggedHours === '' || form.loggedHours == null ? null : Number(form.loggedHours)
        const updated = await updateTask(editingId, {
          title,
          project,
          priority: form.priority,
          status: form.status,
          description: form.description.trim(),
          attachments: form.attachments || [],
          assignee: assigneeForSave,
          loggedHours: rawHoursEdit != null && Number.isFinite(rawHoursEdit) ? rawHoursEdit : null,
          loggedDate: form.loggedDate || null,
          deadline: form.deadline || null,
        })
        setTasks((prev) => prev.map((t) => (t.id === editingId ? updated : t)))
        setNotice?.({ type: 'success', message: 'Task updated.' })
        setDialogOpen(false)
      }
    } catch (err) {
      setNotice?.({ type: 'error', message: err?.message || 'Request failed' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteTask(id) {
    setMenuAnchor(null)
    setMenuTask(null)
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setNotice?.({ type: 'success', message: 'Task removed.' })
    } catch (err) {
      setNotice?.({ type: 'error', message: err?.message || 'Delete failed' })
    }
  }

  const menuPaperSx = {
    bgcolor: MENU_SURFACE,
    border: `1px solid ${BORDER_SUBTLE}`,
    '& .MuiMenuItem-root': { color: TEXT_PRIMARY, fontSize: '0.85rem', '&:hover': { bgcolor: PRIMARY_SOFT } },
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: BG_CHROME,
      }}
    >
      {loadingProjects ? (
        <TasksBoardSkeleton />
      ) : (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: BG_PANEL,
          backgroundImage: BG_PANEL_GRADIENT,
          borderRadius: '16px',
          border: `1px solid ${BORDER_PANEL}`,
          p: { xs: 1.75, sm: 2, md: 2.25 },
          boxShadow: '0 4px 24px rgba(30, 27, 75, 0.07), 0 1px 0 rgba(255, 255, 255, 0.9) inset',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent={{ md: 'space-between' }}
          sx={{
            mb: 2,
            flexShrink: 0,
            gap: { xs: 2, md: 2.5 },
            columnGap: { md: 3 },
            rowGap: 2,
          }}
          style={{ alignItems: 'center' }}
        >
          <Box sx={{ minWidth: 0, flex: { md: '1 1 auto' }, pr: { md: 2 } }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1rem', sm: '1.05rem' },
                color: TEXT_PRIMARY,
                letterSpacing: '-0.02em',
              }}
            >
              Board
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.72rem' },
                color: TEXT_MUTED,
                mt: 0.35,
                lineHeight: 1.5,
                maxWidth: { md: 520, lg: 580 },
              }}
            >
              Move tasks between columns to reflect progress - from Backlog through Ready and In progress to In review.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            flexWrap="wrap"
            sx={{
              width: { xs: '100%', md: 'auto' },
              flexShrink: 0,
              gap: { xs: 1.75, sm: 2 },
            }}
          >
            <FormControl
              size="small"
              sx={{
                ...boardToolbarFieldSx,
                width: { xs: '100%', sm: 'auto' },
                minWidth: { sm: 168, md: 188 },
                flex: { sm: '1 1 168px' },
                maxWidth: { sm: 320, md: 248 },
              }}
            >
              <InputLabel id="board-project-filter-label" shrink>
                Project
              </InputLabel>
              <Select
                labelId="board-project-filter-label"
                label="Project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(String(e.target.value))}
                notched
              >
                <MenuItem value="all" sx={{ bgcolor: DIALOG_BG, color: TEXT_PRIMARY }}>All projects</MenuItem>
                {projectOptions.map((name) => (
                  <MenuItem key={name} value={name.toLowerCase()} sx={{ bgcolor: DIALOG_BG, color: TEXT_PRIMARY }}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!isEmployee ? (
              <FormControl
                size="small"
                sx={{
                  ...boardToolbarFieldSx,
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: 168, md: 188 },
                  flex: { sm: '1 1 168px' },
                  maxWidth: { sm: 320, md: 248 },
                }}
              >
                <InputLabel id="board-employee-filter-label" shrink>
                  Employee
                </InputLabel>
                <Select
                  labelId="board-employee-filter-label"
                  label="Employee"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(String(e.target.value))}
                  notched
                >
                  <MenuItem value="all" sx={{ bgcolor: DIALOG_BG, color: TEXT_PRIMARY }}>All employees</MenuItem>
                  {employeeFilterOptions.map((name) => (
                    <MenuItem key={name} value={name} sx={{ bgcolor: DIALOG_BG, color: TEXT_PRIMARY }}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT_MUTED, alignSelf: 'center', flexShrink: 0 }}>
                My tasks
              </Typography>
            )}
            {!isEmployee && (
              <Button
                variant="contained"
                size="small"
                disableElevation
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                onClick={() => openCreate('backlog')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  borderRadius: '10px',
                  px: 2.25,
                  minHeight: BOARD_TOOLBAR_INPUT_HEIGHT,
                  height: BOARD_TOOLBAR_INPUT_HEIGHT,
                  color: '#fff',
                  backgroundColor: 'transparent',
                  backgroundImage: PRIMARY_BTN_GRADIENT,
                  border: '1px solid rgba(124, 77, 255, 0.35)',
                  boxShadow: `0 4px 20px ${PRIMARY_GLOW}`,
                  width: { xs: '100%', sm: 'auto' },
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  '& .MuiButton-startIcon': { ml: '-2px', mr: 0.5 },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    backgroundImage: PRIMARY_BTN_GRADIENT_HOVER,
                    boxShadow: `0 6px 28px ${PRIMARY_GLOW}`,
                  },
                }}
              >
                Add new task
              </Button>
            )}
          </Stack>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={({ active }) => setActiveId(String(active.id))}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                overflowY: 'hidden',
                pb: 0.5,
                alignItems: 'stretch',
                mx: -0.25,
              }}
            >
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.droppableId}
                  column={col}
                  tasks={grouped[col.status] || []}
                  onAddInColumn={openCreate}
                  showAddControls={!isEmployee}
                >
                  {(grouped[col.status] || []).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      nowMs={nowMs}
                      onEdit={openEdit}
                      isAdmin={isAdmin}
                      busy={String(task.id) === String(adminTimerBusyTaskId)}
                      onAdminToggleTimer={handleAdminToggleTimer}
                    />
                  ))}
                </KanbanColumn>
              ))}
            </Box>

            <DragOverlay dropAnimation={null}>
              {activeTask ? <TaskCardPreview task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </Box>
      </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => { setMenuAnchor(null); setMenuTask(null) }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        <MenuItem
          onClick={() => {
            if (menuTask) openEdit(menuTask)
            setMenuAnchor(null)
            setMenuTask(null)
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          sx={{ color: '#dc2626 !important', fontWeight: 700 }}
          onClick={() => menuTask && handleDeleteTask(menuTask.id)}
        >
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: { xs: '100vh', md: 'auto' },
            maxHeight: { xs: 'none', md: '90vh' },
            borderRadius: { xs: 0, md: '16px' },
            bgcolor: DIALOG_BG,
            color: TEXT_PRIMARY,
            border: `1px solid ${BORDER_SUBTLE}`,
            backgroundImage: 'none',
            boxShadow: '0 24px 64px rgba(30, 27, 75, 0.16), 0 0 0 1px rgba(124, 58, 237, 0.08)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <>
          <DialogTitle sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                size="small"
                onClick={() => !submitting && setDialogOpen(false)}
                sx={{ color: TEXT_MUTED, mr: 0.5 }}
                aria-label="Back"
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: TEXT_PRIMARY }}>
                {editingId == null ? (
                  <>
                    Create new task in <Box component="span" sx={{ color: PRIMARY }}>{repoLabel}</Box>
                  </>
                ) : (
                  <>Edit task #{editingId}</>
                )}
              </Typography>
              <IconButton size="small" onClick={() => !submitting && setDialogOpen(false)} sx={{ color: TEXT_MUTED }} aria-label="Close">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 2.75, pt: 2.75, pb: 2, overflowY: 'auto' }} style={{paddingTop:"20px"}}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT_PRIMARY, mb: 0.75 }}>
              Add a title <Box component="span" sx={{ color: '#dc2626' }}>*</Box>
            </Typography>
            <TextField
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              size="small"
              sx={{ ...fieldSx, mb: 3 }}
            />

            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT_PRIMARY, mb: 0.75 }}>
              Add a description
            </Typography>
            <Box sx={{ border: `1px solid ${BORDER_INPUT}`, borderRadius: '10px', overflow: 'hidden', mb: 2.75 }}>
              <Tabs
                value={descTab}
                onChange={(_, v) => setDescTab(v)}
                sx={{
                  minHeight: 38,
                  bgcolor: INPUT_BG,
                  borderBottom: `1px solid ${BORDER_INPUT}`,
                  '& .MuiTab-root': { color: TEXT_MUTED, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 38 },
                  '& .Mui-selected': { color: TEXT_PRIMARY },
                  '& .MuiTabs-indicator': { bgcolor: PRIMARY, height: 2 },
                }}
              >
                <Tab label="Write" />
                <Tab label="Preview" />
              </Tabs>
              {descTab === 0 ? (
                <>
                  <Stack direction="row" flexWrap="wrap" gap={0.25} sx={{ px: 1, py: 0.75, bgcolor: INPUT_BG, borderBottom: `1px solid ${BORDER_INPUT}` }}>
                    {[
                      { Icon: TitleIcon, label: 'Heading', onClick: () => prefixLines(() => '## ') },
                      { Icon: FormatBoldIcon, label: 'Bold', onClick: () => wrapSelection('**') },
                      { Icon: FormatItalicIcon, label: 'Italic', onClick: () => wrapSelection('*') },
                      { Icon: CodeIcon, label: 'Inline code', onClick: () => wrapSelection('`') },
                      {
                        Icon: LinkIcon,
                        label: 'Link',
                        onClick: () => {
                          const href = window.prompt('Enter URL', 'https://')
                          if (!href) return
                          wrapSelection('[', `](${href})`, 'link text')
                        },
                      },
                      { Icon: FormatListBulletedIcon, label: 'Bulleted list', onClick: () => prefixLines(() => '- ') },
                      { Icon: FormatListNumberedIcon, label: 'Numbered list', onClick: () => prefixLines((idx) => `${idx + 1}. `) },
                    ].map(({ Icon, label, onClick }) => (
                      <IconButton key={label} size="small" sx={{ color: TEXT_MUTED, p: 0.5 }} aria-label={label} onClick={onClick}>
                        <Icon sx={{ fontSize: 18 }} />
                      </IconButton>
                    ))}
                  </Stack>
                  <TextField
                    placeholder="Type your description here..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    inputRef={descriptionInputRef}
                    onPaste={async (e) => {
                      const files = Array.from(e.clipboardData?.files || [])
                      const hasImage = files.some((f) => String(f.type || '').startsWith('image/'))
                      if (hasImage) {
                        e.preventDefault()
                        await embedImageFiles(files)
                        return
                      }
                      const pastedText = String(e.clipboardData?.getData('text/plain') || '').trim()
                      if (isLikelyImageUrl(pastedText)) {
                        e.preventDefault()
                        const alt = pastedText.split('/').pop()?.split('?')[0] || 'image'
                        insertDescriptionAtCursor(`![${alt}](${pastedText})\n`)
                      }
                    }}
                    onDrop={async (e) => {
                      const files = Array.from(e.dataTransfer?.files || [])
                      const hasImage = files.some((f) => String(f.type || '').startsWith('image/'))
                      if (!hasImage) return
                      e.preventDefault()
                      await embedImageFiles(files)
                    }}
                    onDragOver={(e) => {
                      if (Array.from(e.dataTransfer?.types || []).includes('Files')) e.preventDefault()
                    }}
                    fullWidth
                    multiline
                    minRows={4}
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      bgcolor: INPUT_BG,
                      '& .MuiInputBase-input': { color: TEXT_PRIMARY, fontSize: '0.85rem', lineHeight: 1.6 },
                      '& .MuiInputBase-input::placeholder': { color: 'rgba(100, 116, 139, 0.55)' },
                    }}
                  />
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    onClick={() => attachmentInputRef.current?.click()}
                    onDrop={async (e) => {
                      const files = Array.from(e.dataTransfer?.files || [])
                      const hasImage = files.some((f) => String(f.type || '').startsWith('image/'))
                      if (!hasImage) return
                      e.preventDefault()
                      await embedImageFiles(files)
                    }}
                    onDragOver={(e) => {
                      if (Array.from(e.dataTransfer?.types || []).includes('Files')) e.preventDefault()
                    }}
                    sx={{
                      px: 1.5,
                      py: 1,
                      bgcolor: INPUT_BG,
                      borderTop: `1px solid ${BORDER_INPUT}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f3f1fb' },
                    }}
                  >
                    <AttachFileOutlinedIcon sx={{ fontSize: 18, color: TEXT_MUTED }} />
                    <Typography sx={{ fontSize: '0.75rem', color: TEXT_MUTED }}>Upload, drop, or paste image URL</Typography>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        await embedImageFiles(e.target.files || [])
                        e.target.value = ''
                      }}
                    />
                  </Stack>
                </>
              ) : (
                <Box sx={{ minHeight: 200, p: 2, bgcolor: INPUT_BG }}>
                  {form.description.trim() ? (
                    <Box>{renderMarkdownPreview(form.description, resolveAttachmentUrl)}</Box>
                  ) : (
                    <Typography sx={{ color: TEXT_MUTED, fontSize: '0.85rem' }}>Nothing to preview yet.</Typography>
                  )}
                </Box>
              )}
            </Box>

            <Stack direction="row" flexWrap="wrap" gap={1.15} sx={{ mb: 2.5 }}>
              {isEmployee ? (
                <Chip
                  size="small"
                  label={selfName ? `Assignee: ${selfName}` : 'Assignee'}
                  sx={{ fontWeight: 600, bgcolor: PRIMARY_SOFT, color: PRIMARY_DARK }}
                />
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => setAssigneeAnchor(e.currentTarget)}
                  startIcon={
                    form.assignee ? (
                      <Avatar sx={{ width: 18, height: 18, fontSize: '0.65rem', bgcolor: PRIMARY }}>
                        {form.assignee.charAt(0)}
                      </Avatar>
                    ) : (
                      <PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                    )
                  }
                  sx={{
                    borderColor: BORDER_INPUT,
                    color: form.assignee ? PRIMARY_DARK : TEXT_MUTED,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '999px',
                    '&:hover': { borderColor: PRIMARY, bgcolor: PRIMARY_SOFT },
                  }}
                >
                  {form.assignee || 'Assignee'}
                </Button>
              )}
              {!isEmployee && (
              <Popover
                open={Boolean(assigneeAnchor)}
                anchorEl={assigneeAnchor}
                onClose={() => setAssigneeAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    width: 250,
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(124,58,237,0.15)',
                    border: `1px solid ${BORDER_SUBTLE}`,
                    overflow: 'hidden',
                  },
                }}
              >
                <Box sx={{ p: 1, borderBottom: `1px solid ${BORDER_SUBTLE}`, bgcolor: '#f8fafc' }}>
                  <InputBase
                    size="small"
                    fullWidth
                    placeholder="Search members..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    startAdornment={<SearchIcon sx={{ fontSize: 16, color: TEXT_MUTED, mr: 1 }} />}
                    sx={{
                      fontSize: '0.8rem',
                      px: 1,
                      py: 0.5,
                      borderRadius: '6px',
                      bgcolor: '#fff',
                      border: `1px solid ${BORDER_INPUT}`,
                    }}
                  />
                </Box>
                <List sx={{ pt: 0, pb: 0, maxHeight: 300, overflowY: 'auto' }}>
                  <ListItemButton
                    onClick={() => {
                      setForm((f) => ({ ...f, assignee: null }))
                      setAssigneeAnchor(null)
                    }}
                    sx={{ py: 1 }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: '#f1f5f9' }}>
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 16, color: TEXT_MUTED }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Unassigned"
                      primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500, color: TEXT_MUTED }}
                    />
                  </ListItemButton>
                  {(() => {
                    const filteredByMember = (employees || [])
                      .filter((e) => e.name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                      .filter((e) => {
                        if (!currentFormProject) return false
                        return isProjectMember(currentFormProject, e.name)
                      })

                    if (filteredByMember.length === 0) {
                      return (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '0.75rem', color: TEXT_MUTED }}>
                            No members found for this project.
                          </Typography>
                        </Box>
                      )
                    }

                    return filteredByMember.map((emp) => (
                      <ListItemButton
                        key={emp.id}
                        onClick={() => {
                          setForm((f) => ({ ...f, assignee: emp.name }))
                          setAssigneeAnchor(null)
                        }}
                        sx={{ py: 1 }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: PRIMARY, fontSize: '0.75rem' }}>
                            {emp.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={emp.name}
                          secondary={emp.role}
                          primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600, color: TEXT_PRIMARY }}
                          secondaryTypographyProps={{ fontSize: '0.65rem' }}
                        />
                      </ListItemButton>
                    ))
                  })()}
                </List>
              </Popover>
              )}
              <Button
                size="small"
                variant="outlined"
                startIcon={<LabelOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={cyclePriority}
                sx={{
                  borderColor: BORDER_INPUT,
                  color: priorityAccent(form.priority),
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '999px',
                  '&:hover': { borderColor: PRIMARY, bgcolor: PRIMARY_SOFT_STRONG },
                }}
              >
                Label: {String(form.priority || 'medium').replace(/^./, (c) => c.toUpperCase())}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FlagOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={cycleStatus}
                sx={{
                  borderColor: BORDER_INPUT,
                  color: TEXT_MUTED,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '999px',
                  '&:hover': { borderColor: PRIMARY, bgcolor: PRIMARY_SOFT_STRONG },
                }}
              >
                Type: {String(canonicalStatus(form.status || 'backlog')).replace(/\b\w/g, (m) => m.toUpperCase())}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FolderOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={cycleProject}
                sx={{
                  borderColor: BORDER_INPUT,
                  color: TEXT_MUTED,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '999px',
                  '&:hover': { borderColor: PRIMARY, bgcolor: PRIMARY_SOFT_STRONG },
                }}
              >
                Project: {form.project || 'Select'}
              </Button>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1.35 }}>
              <Box sx={{ flex: 1, minWidth: { md: 220 } }}>
                <Typography component="label" htmlFor="task-hours" sx={formFieldTitleSx}>
                  Hours (timesheet)
                </Typography>
                <TextField
                  id="task-hours"
                  type="number"
                  inputProps={{ min: 0, step: 0.25, 'aria-label': 'Hours (timesheet)' }}
                  value={form.loggedHours}
                  onChange={(e) => setForm((f) => ({ ...f, loggedHours: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="Default 1 if empty"
                  sx={{ ...fieldSx, minWidth: { md: 0 } }}
                  helperText="Used in timesheet reports"
                  FormHelperTextProps={{ sx: { color: TEXT_MUTED } }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: { md: 220 } }}>
                <Typography
                  component="label"
                  htmlFor="task-work-date"
                  sx={{
                    display: 'block',
                    mb: 0.6,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: TEXT_MUTED,
                  }}
                >
                  Work date
                </Typography>
                <TextField
                  id="task-work-date"
                  type="date"
                  value={form.loggedDate}
                  onChange={(e) => setForm((f) => ({ ...f, loggedDate: e.target.value }))}
                  fullWidth
                  size="small"
                  variant="outlined"
                  inputProps={{ 'aria-label': 'Work date' }}
                  sx={{
                    ...fieldSx,
                    '& .MuiFormHelperText-root': { mt: 0.75 },
                  }}
                  helperText="Used for timesheet date filtering"
                  FormHelperTextProps={{ sx: { color: TEXT_MUTED } }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: { md: 220 } }}>
                <Typography
                  component="label"
                  htmlFor="task-deadline"
                  sx={{
                    display: 'block',
                    mb: 0.6,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: TEXT_MUTED,
                  }}
                >
                  Deadline
                </Typography>
                <TextField
                  id="task-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  fullWidth
                  size="small"
                  variant="outlined"
                  inputProps={{ 'aria-label': 'Task deadline' }}
                  sx={{
                    ...fieldSx,
                    '& .MuiFormHelperText-root': { mt: 0.75 },
                  }}
                  helperText="Used for planning and due-date tracking"
                  FormHelperTextProps={{ sx: { color: TEXT_MUTED } }}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              px: 2.5,
              py: 2,
              borderTop: `1px solid ${BORDER_SUBTLE}`,
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {editingId == null ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={createMore}
                    onChange={(e) => setCreateMore(e.target.checked)}
                    sx={{ color: TEXT_MUTED, '&.Mui-checked': { color: PRIMARY } }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: TEXT_MUTED }}>Create more</Typography>}
              />
            ) : (
              <Box />
            )}
            <Stack direction="row" spacing={1.25}>
              <Button
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
                sx={{
                  color: TEXT_PRIMARY,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: BORDER_INPUT,
                  '&:hover': { borderColor: PRIMARY, bgcolor: PRIMARY_SOFT },
                }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={() => void handleSubmitDialog()}
                disabled={submitting}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2,
                  color: '#fff',
                  backgroundColor: 'transparent',
                  backgroundImage: PRIMARY_BTN_GRADIENT,
                  border: '1px solid rgba(124, 77, 255, 0.35)',
                  boxShadow: `0 4px 20px ${PRIMARY_GLOW}`,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    backgroundImage: PRIMARY_BTN_GRADIENT_HOVER,
                    boxShadow: `0 6px 28px ${PRIMARY_GLOW}`,
                  },
                }}
              >
                {editingId == null ? 'Create' : 'Save changes'}
              </Button>
            </Stack>
          </DialogActions>
        </>
      </Dialog>
    </Box>
  )
}

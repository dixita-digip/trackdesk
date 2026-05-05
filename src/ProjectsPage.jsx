import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
} from '@mui/material'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import AddIcon from '@mui/icons-material/Add'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { createProject, deleteProject, getProjects, updateProject } from './services/api'
import { DataTableSkeleton } from './pageSkeletons.jsx'

function emptyForm() {
  return {
    name: '',
    owner: '',
    description: '',
    priority: 'medium',
    startDate: '',
    endDate: '',
    totalTasks: 0,
    completedTasks: 0,
    status: 'active',
    members: [],
  }
}

function uniqueNames(list) {
  const out = []
  for (const item of Array.isArray(list) ? list : []) {
    const name = String(item || '').trim()
    if (!name) continue
    if (!out.includes(name)) out.push(name)
  }
  return out
}

function toIsoDateInput(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dmy) {
    const [, dd, mm, yyyy] = dmy
    return `${yyyy}-${mm}-${dd}`
  }
  return ''
}

function priorityChipSx(priority) {
  if (priority === 'high') return { bgcolor: 'rgba(239,68,68,0.10)', color: '#dc2626' }
  if (priority === 'low') return { bgcolor: 'rgba(34,197,94,0.10)', color: '#16a34a' }
  return { bgcolor: 'rgba(124,58,237,0.10)', color: '#7c3aed' } // medium/default
}

export default function ProjectsPage({
  employees = [],
  setNotice,
  onOpenTasksForProject,
  accessMode = 'full',
  memberName = '',
}) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState(emptyForm)
  const [localError, setLocalError] = useState('')

  async function loadProjects() {
    setLoading(true)
    setLocalError('')
    try {
      const data = await getProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err?.message || 'Failed to load projects'
      setLocalError(message)
      setNotice?.({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleProjects = useMemo(() => {
    if (accessMode !== 'member' || !String(memberName || '').trim()) return projects
    const me = String(memberName).trim().toLowerCase()
    return projects.filter((p) => {
      const owner = String(p.owner || '').trim().toLowerCase()
      const members = Array.isArray(p.members) ? p.members : []
      if (owner === me) return true
      return members.some((m) => String(m || '').trim().toLowerCase() === me)
    })
  }, [projects, accessMode, memberName])

  const totals = useMemo(() => {
    return {
      total: visibleProjects.length,
      active: visibleProjects.filter((p) => p.status === 'active').length,
    }
  }, [visibleProjects])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setLocalError('')
    setDialogOpen(true)
  }

  function openEdit(project) {
    setEditingId(project.id)
    setForm({
      name: project.name ?? '',
      owner: project.owner ?? '',
      description: project.description ?? '',
      priority: project.priority ?? 'medium',
      startDate: toIsoDateInput(project.startDate),
      endDate: toIsoDateInput(project.endDate),
      totalTasks: project.totalTasks ?? 0,
      completedTasks: project.completedTasks ?? 0,
      status: project.status ?? 'active',
      members: project.members || [],
    })
    setLocalError('')
    setDialogOpen(true)
  }

  function normalizePayload() {
    // Backend expects: name + owner are required; other fields are optional.
    const totalTasks = Number(form.totalTasks || 0)
    const completedTasks = Number(form.completedTasks || 0)

    const cleanMembers = uniqueNames(form.members)
    const normalizedStartDate = toIsoDateInput(form.startDate)
    const normalizedEndDate = toIsoDateInput(form.endDate)
    return {
      name: form.name.trim(),
      owner: (form.owner || 'System Admin').trim(),
      description: form.description ?? '',
      priority: form.priority ?? 'medium',
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      totalTasks,
      completedTasks,
      status: form.status ?? 'active',
      members: cleanMembers,
    }
  }

  async function handleSubmit() {
    setLocalError('')
    setSubmitting(true)
    try {
      const payload = normalizePayload()
      if (!payload.name || !payload.owner) {
        throw new Error('Project "name" and "owner" are required.')
      }
      if (payload.members.length === 0) {
        throw new Error('Please assign at least one employee to the project.')
      }
      if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
        throw new Error('Start date cannot be after end date.')
      }

      if (editingId == null) {
        await createProject(payload)
        setNotice?.({ type: 'success', message: 'Project created successfully.' })
      } else {
        await updateProject(editingId, payload)
        setNotice?.({ type: 'success', message: 'Project updated successfully.' })
      }

      setDialogOpen(false)
      setEditingId(null)
      await loadProjects()
    } catch (err) {
      const message = err?.message || 'Failed to save project'
      setLocalError(message)
      setNotice?.({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenDeleteConfirm(project) {
    setProjectToDelete(project)
    setConfirmDeleteOpen(true)
  }

  function handleCloseDeleteConfirm() {
    if (deleting) return
    setConfirmDeleteOpen(false)
    setProjectToDelete(null)
  }

  async function handleDeleteConfirm() {
    if (!projectToDelete?.id) return
    setDeleting(true)
    setLocalError('')
    try {
      await deleteProject(projectToDelete.id)
      setNotice?.({ type: 'success', message: 'Project deleted successfully.' })
      await loadProjects()
      setConfirmDeleteOpen(false)
      setProjectToDelete(null)
    } catch (err) {
      const message = err?.message || 'Failed to delete project'
      setLocalError(message)
      setNotice?.({ type: 'error', message })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ pb: 1.75 }}>
      <Box
        sx={{
          mb: 1.6,
          p: 0,
          borderRadius: '14px',
          border: '1px solid rgba(124,58,237,0.08)',
          background: 'linear-gradient(180deg, #f8f7ff 0%, #f4f3ff 100%)',
          boxShadow: '0 4px 14px rgba(30,27,75,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
      <Stack direction="row" justifyContent="space-between" alignItems="stretch" gap={0}>
        <Box sx={{ flex: 1, p: { xs: 1.4, md: 1.7 } }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e1b4b' }}>Projects</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.2, mb: 1.5 }}>
            Plan, assign and monitor project execution from one place.
          </Typography>
          <Stack direction="row" spacing={0.7} sx={{ mt: 0.55 }}>
            <Chip
              label={`${totals.total} total`}
              size="small"
              sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700, bgcolor: 'rgba(59,130,246,0.10)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.16)' }}
            />
            <Chip
              label={`${totals.active} active`}
              size="small"
              sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.16)' }}
            />
          </Stack>
        </Box>
        {accessMode === 'full' && (
          <Box
            sx={{
              minWidth: { xs: 112, md: 126 },
              px: { xs: 0.9, md: 1.1 },
              display: 'grid',
              placeItems: 'center',
              borderLeft: '1px solid rgba(124,58,237,0.10)',
              clipPath: { xs: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)', md: 'polygon(16% 0, 100% 0, 100% 100%, 0 100%)' },
            }}
          >
            <Button
              variant="contained"
              onClick={openCreate}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: '9px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(124,58,237,0.22)',
                textTransform: 'none',
                minHeight: 32,
                fontSize: '0.72rem',
                px: 1.35,
              }}
            >
              Add Project
            </Button>
          </Box>
        )}
      </Stack>
      </Box>

      {localError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError('')}>
          {localError}
        </Alert>
      )}

      <Card
        sx={{
          borderRadius: '16px',
          border: '1px solid rgba(124,58,237,0.10)',
          boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
          bgcolor: '#fff',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ overflowX: 'auto' }}>
              <DataTableSkeleton columns={8} rows={7} />
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f7ff' }}>
                    {['Name', 'Owner', 'Priority', 'Status', 'Start', 'End', 'Tasks', 'Actions'].map((col) => (
                      <TableCell
                        key={col}
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          py: 1.25,
                          px: 1.75,
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
                  {visibleProjects.map((p) => {
                    const total = Number(p.totalTasks || 0)
                    const completed = Number(p.completedTasks || 0)
                    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

                    return (
                      <TableRow
                        key={p.id}
                        hover
                        sx={{
                          '&:last-child td': { border: 0 },
                          transition: 'background 0.22s ease',
                          '&:hover': { bgcolor: 'rgba(124,58,237,0.03)' },
                        }}
                      >
                        <TableCell sx={{ py: 1.35, px: 1.75, fontWeight: 800, color: '#1e1b4b', whiteSpace: 'nowrap' }}>
                          <Button
                            variant="text"
                            onClick={() => onOpenTasksForProject?.(p.name)}
                            sx={{
                              textTransform: 'none',
                              p: 0,
                              minWidth: 0,
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: '#1e1b4b',
                              justifyContent: 'flex-start',
                              '&:hover': { color: '#7c3aed', bgcolor: 'transparent', textDecoration: 'underline' },
                            }}
                          >
                            {p.name}
                          </Button>
                        </TableCell>
                        <TableCell sx={{ py: 1.35, px: 1.75, color: '#475569' }}>{p.owner}</TableCell>
                        <TableCell sx={{ py: 1.35, px: 1.75 }}>
                          <Chip label={p.priority} size="small" sx={priorityChipSx(p.priority)} />
                        </TableCell>
                        <TableCell sx={{ py: 1.35, px: 1.75 }}>
                          <Chip
                            label={p.status}
                            size="small"
                            sx={{
                              bgcolor: p.status === 'active' ? 'rgba(16,185,129,0.10)' : 'rgba(124,58,237,0.10)',
                              color: p.status === 'active' ? '#059669' : '#7c3aed',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.35, px: 1.75, color: '#334155' }}>{p.startDate || '—'}</TableCell>
                        <TableCell sx={{ py: 1.35, px: 1.75, color: '#334155' }}>{p.endDate || '—'}</TableCell>
                        <TableCell sx={{ py: 1.35, px: 1.75 }}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e1b4b' }}>
                            {completed}/{total}
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{completionPct}%</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.35, px: 1.75 }}>
                          {accessMode === 'full' ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <IconButton
                                size="small"
                                onClick={() => openEdit(p)}
                                sx={{ color: '#7c3aed', bgcolor: 'rgba(124,58,237,0.08)', '&:hover': { bgcolor: 'rgba(124,58,237,0.14)' } }}
                                disabled={submitting}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteConfirm(p)}
                                sx={{ color: '#dc2626', bgcolor: 'rgba(220,38,38,0.08)', '&:hover': { bgcolor: 'rgba(220,38,38,0.14)' } }}
                                disabled={submitting || deleting}
                              >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          ) : (
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>View only</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {visibleProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 4, textAlign: 'center' }}>
                        <Typography sx={{ color: '#94a3b8', fontWeight: 500 }}>No projects found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!submitting) setDialogOpen(false)
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            overflow: 'hidden',
            border: '1px solid rgba(124,58,237,0.10)',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 1.5,
            pb: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {editingId == null ? 'Create New Project' : 'Edit Project'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => {
              if (!submitting) setDialogOpen(false)
            }}
            sx={{
              color: 'rgba(30,27,75,0.55)',
              bgcolor: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.06)',
              '&:hover': { bgcolor: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.22)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.65, px: 1 }}>
            <Stack spacing={0.65}>

              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1 }}>
                PROJECT NAME
              </Typography>
              <TextField
                required
                value={form.name}
                placeholder="e.g., Website Redesign, Mobile App v2..."
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Stack spacing={0.65}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" style={{ gap: '5px' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1 }}>
                  Description
                </Typography>
              </Stack>
              <TextField
                multiline
                rows={2}
                className='project-description-textarea'
                value={form.description}
                placeholder="What is this project about? What are the main goals?"
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack spacing={0.65}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1 }}>
                Project Members
              </Typography>
              <Autocomplete
                multiple
                options={employees}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                value={employees.filter(e => (form.members || []).includes(e.name))}
                onChange={(_, newValue) => {
                  setForm(f => ({ ...f, members: newValue.map(v => v.name) }))
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{option.role}</Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={form.members?.length ? "" : "Select team members..."}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      size="small"
                      {...getTagProps({ index })}
                      sx={{ borderRadius: '6px', fontWeight: 600, bgcolor: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}
                    />
                  ))
                }
              />
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                width: '100%',
                alignItems: 'start',
              }}
            >
              <Stack spacing={0.65} sx={{ minWidth: 0, width: '100%' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1 }}>
                  Status
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={form.status}
                  onChange={(_, v) => {
                    if (!v) return
                    setForm((f) => ({ ...f, status: v }))
                  }}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 1,
                    width: '100%',
                    '& .MuiToggleButtonGroup-grouped': {
                      margin: 0,
                      borderRadius: '999px !important',
                    },
                  }}
                >
                  <ToggleButton
                    value="active"
                    sx={{
                      borderRadius: '999px !important',
                      border: '1px solid rgba(16,185,129,0.25) !important',
                      px: 2,
                      py: 0.8,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: '#059669',
                      bgcolor: 'rgba(16,185,129,0.04)',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(16,185,129,0.14)',
                        borderColor: 'rgba(16,185,129,0.50)',
                        color: '#059669',
                      },
                    }}
                  >
                    Active
                  </ToggleButton>
                  <ToggleButton
                    value="paused"
                    sx={{
                      borderRadius: '999px !important',
                      border: '1px solid rgba(124,58,237,0.25) !important',
                      px: 2,
                      py: 0.8,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: '#7c3aed',
                      bgcolor: 'rgba(124,58,237,0.04)',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(124,58,237,0.14)',
                        borderColor: 'rgba(124,58,237,0.50)',
                        color: '#7c3aed',
                      },
                    }}
                  >
                    On Hold
                  </ToggleButton>
                  <ToggleButton
                    value="completed"
                    sx={{
                      borderRadius: '999px !important',
                      border: '1px solid rgba(124,58,237,0.25) !important',
                      px: 2,
                      py: 0.8,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: '#7c3aed',
                      bgcolor: 'rgba(124,58,237,0.04)',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(124,58,237,0.14)',
                        borderColor: 'rgba(124,58,237,0.50)',
                        color: '#7c3aed',
                      },
                    }}
                  >
                    Completed
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Stack spacing={0.65} sx={{ minWidth: 0, width: '100%' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1 }}>
                  Priority
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={form.priority}
                  onChange={(_, v) => {
                    if (!v) return
                    setForm((f) => ({ ...f, priority: v }))
                  }}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 1,
                    width: '100%',
                    '& .MuiToggleButtonGroup-grouped': {
                      margin: 0,
                      borderRadius: '999px !important',
                    },
                  }}
                >
                  {[
                    { value: 'low', label: 'Low', color: '#16a34a', border: 'rgba(34,197,94,0.25)', bg: 'rgba(34,197,94,0.04)' },
                    { value: 'medium', label: 'Medium', color: '#7c3aed', border: 'rgba(124,58,237,0.25)', bg: 'rgba(124,58,237,0.04)' },
                    { value: 'high', label: 'High', color: '#dc2626', border: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.04)' },
                  ].map((opt) => (
                    <ToggleButton
                      key={opt.value}
                      value={opt.value}
                      sx={{
                        borderRadius: '999px !important',
                        border: `1px solid ${opt.border} !important`,
                        px: 2,
                        py: 0.8,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: opt.color,
                        bgcolor: opt.bg,
                        '&.Mui-selected': {
                          bgcolor: opt.bg.replace('0.04', '0.14').replace('0.25', '0.50'),
                          borderColor: opt.border.replace('0.25', '0.50'),
                          color: opt.color,
                        },
                      }}
                    >
                      {opt.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                width: '100%',
                alignItems: 'start',
              }}
            >
              <Box sx={{ minWidth: 0, width: '100%' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1 }}>START DATE</Typography>
                <TextField
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: 'rgba(124,58,237,0.9)' }} />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Box>
              <Box sx={{ minWidth: 0, width: '100%' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1 }}>END DATE</Typography>
                <TextField
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: 'rgba(124,58,237,0.9)' }} />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2, pt: 0.2, justifyContent: 'space-between' }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
            sx={{ color: '#475569', fontWeight: 800 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={submitting || !form.name.trim()}
            sx={{ bgcolor: '#7c3aed', fontWeight: 700 }}
            startIcon={editingId == null ? <AddIcon /> : undefined}
          >
            {editingId == null ? 'Create Project' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid rgba(239,68,68,0.18)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1e1b4b' }}>
          Delete project?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#475569', fontSize: '0.92rem' }}>
            This will permanently delete
            {' '}
            <strong>{projectToDelete?.name || 'this project'}</strong>
            .
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={handleCloseDeleteConfirm} disabled={deleting} sx={{ color: '#64748b', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleDeleteConfirm()}
            disabled={deleting}
            sx={{ bgcolor: '#dc2626', fontWeight: 700, '&:hover': { bgcolor: '#b91c1c' } }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}


import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Stack,
  Button,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined'
import { createEmployee, updateEmployee, deleteEmployee } from './services/api'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'


const TEAM_ROW_AVATAR_COLORS = [
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
]

function EmployeesPage({ employees, tasks = [], setEmployees, setNotice }) {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Employee',
    assignedTasks: 0,
    completedTasks: 0,
    hours: '0h 00m',
    active: true
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm({ name: '', email: '', role: 'Employee', assignedTasks: 0, completedTasks: 0, hours: '0h 00m', active: true })
    setDialogOpen(true)
  }

  const handleOpenEdit = (emp) => {
    setEditingId(emp.id)
    setForm({ ...emp })
    setDialogOpen(true)
  }

  const handleOpenDeleteConfirm = (employee) => {
    setEmployeeToDelete(employee)
    setConfirmDeleteOpen(true)
  }

  const handleOpenViewDetails = (emp) => {
    navigate(`/employees/${emp.id}`)
  }

  const handleCloseDeleteConfirm = () => {
    if (deleting) return
    setConfirmDeleteOpen(false)
    setEmployeeToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete?.id) return
    setDeleting(true)
    try {
      await deleteEmployee(employeeToDelete.id)
      setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id))
      setNotice({ type: 'success', message: 'Employee deleted successfully!' })
      setConfirmDeleteOpen(false)
      setEmployeeToDelete(null)
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setNotice({ type: 'error', message: 'Name is required' })
      return
    }
    if (!String(form.email || '').trim()) {
      setNotice({ type: 'error', message: 'Email is required' })
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        const updated = await updateEmployee(editingId, form)
        setEmployees(prev => prev.map(e => e.id === editingId ? updated : e))
        setNotice({ type: 'success', message: 'Employee updated successfully!' })
      } else {
        const created = await createEmployee(form)
        setEmployees(prev => [created, ...prev])
        const deliveryMessage = created?.emailDelivery?.message || ''
        if (created?.emailDelivery?.sent) {
          setNotice({ type: 'success', message: `Employee created and email sent. ${deliveryMessage}` })
        } else {
          const detail = deliveryMessage ? ` (${deliveryMessage})` : ''
          setNotice({
            type: 'warning',
            message: `Employee created, but email not sent.${detail} Temporary password: ${created?.tempPassword || 'N/A'}`,
          })
        }
      }
      setDialogOpen(false)
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to save employee' })
    } finally {
      setSubmitting(false)
    }
  }

  const totals = {
    total: employees.length,
    active: employees.filter((e) => Boolean(e.active)).length,
  }

  const showAssignmentFields = Boolean(editingId)

  function isTaskCompletedStatus(status) {
    const s = String(status || '')
      .toLowerCase()
      .trim()
      .replace(/_/g, ' ')
    if (s === 'completed' || s === 'done' || s === 'in review') return true
    return false
  }

  const assignedAndCompletedTotals = useMemo(() => {
    const assigned = new Map()
    const completed = new Map()
    const keyOf = (v) => String(v || '').trim().toLowerCase()

    for (const t of Array.isArray(tasks) ? tasks : []) {
      const empKey = keyOf(t?.assignee)
      if (!empKey) continue
      assigned.set(empKey, (assigned.get(empKey) || 0) + 1)
      if (isTaskCompletedStatus(t?.status)) completed.set(empKey, (completed.get(empKey) || 0) + 1)
    }

    return { assigned, completed }
  }, [tasks])

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
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
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e1b4b' }}>
              Team Members
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.2, mb: 1.5 }}>
              Manage your employees and roles
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
          <Box
            sx={{
              minWidth: { xs: 112, md: 126 },
              px: { xs: 0.9, md: 1.1 },
              display: 'grid',
              placeItems: 'center',
              clipPath: 'none',
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
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
              Add Employee
            </Button>
          </Box>
        </Stack>
      </Box>

      <Card
        sx={{
          borderRadius: '16px',
          border: '1px solid rgba(124,58,237,0.08)',
          boxShadow: 'var(--shadow-xs)',
          bgcolor: '#fff',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafe' }}>
                {['Employee', 'Role', 'Email', 'Tasks', 'Completed', 'Status', ''].map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      py: 1.8,
                      px: 2.5,
                      borderColor: 'rgba(0,0,0,0.05)',
                      whiteSpace: 'nowrap',
                      ...(col === '' ? { width: 124 } : {})
                    }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((row, idx) => {
                const color = TEAM_ROW_AVATAR_COLORS[idx % TEAM_ROW_AVATAR_COLORS.length]
                return (
                  <TableRow
                    key={row.id}
                    sx={{
                      borderColor: 'rgba(0,0,0,0.04)',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: 'rgba(124,58,237,0.02)' },
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 1.5, px: 2.5 }}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        onClick={() => handleOpenViewDetails(row)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleOpenViewDetails(row)
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          width: 'fit-content',
                          maxWidth: '100%',
                          borderRadius: '8px',
                          outline: 'none',
                          '&:focus-visible': { boxShadow: '0 0 0 2px rgba(124,58,237,0.45)' },
                          '&:hover .emp-name': { color: '#7c3aed', textDecoration: 'underline' },
                        }}
                        style={{alignItems: 'center'}}
                      >
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: color,
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            boxShadow: `0 3px 10px ${color}40`
                          }}
                        >
                          {String(row.name).charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                          className="emp-name"
                          sx={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: '#1e1b4b',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.15s',
                          }}
                        >
                          {row.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2.5 }}>
                      <Chip
                        label={row.role || 'Employee'}
                        size="small"
                        sx={{
                          bgcolor: row.role === 'Admin' || row.role === 'Manager' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                          color: row.role === 'Admin' || row.role === 'Manager' ? '#7c3aed' : '#059669',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          height: 24,
                          borderRadius: '6px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2.5 }}>
                      <Typography
                        sx={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: '#334155',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 220,
                        }}
                      >
                        {row.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2.5, fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                      {assignedAndCompletedTotals.assigned.get(String(row.name || '').trim().toLowerCase()) || 0}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2.5, fontWeight: 800, color: '#059669', fontSize: '0.85rem' }}>
                      {assignedAndCompletedTotals.completed.get(String(row.name || '').trim().toLowerCase()) || 0}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2.5 }}>
                      <Chip
                        label={row.active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          bgcolor: row.active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                          color: row.active ? '#059669' : '#64748b',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          height: 24,
                          borderRadius: '6px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2.5, textAlign: 'right' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                title="View details"
                                onClick={() => handleOpenViewDetails(row)}
                                sx={{ color: '#475569', bgcolor: 'rgba(71,85,105,0.08)', '&:hover': { bgcolor: 'rgba(71,85,105,0.14)' } }}
                                disabled={submitting}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                title="Edit"
                                onClick={() => handleOpenEdit(row)}
                                sx={{ color: '#7c3aed', bgcolor: 'rgba(124,58,237,0.08)', '&:hover': { bgcolor: 'rgba(124,58,237,0.14)' } }}
                                disabled={submitting}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteConfirm(row)}
                                sx={{ color: '#dc2626', bgcolor: 'rgba(220,38,38,0.08)', '&:hover': { bgcolor: 'rgba(220,38,38,0.14)' } }}
                                disabled={submitting || deleting}
                              >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No employees found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: '#fff',
            border: 'none',
            overflow: 'hidden',
            boxShadow: '0 24px 60px -12px rgba(124,58,237,0.25), 0 0 0 1px rgba(124,58,237,0.08)',
            position: 'relative'
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',

          }}
        />
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5, m: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" style={{ justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e1b4b', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {editingId ? 'Edit Employee Profile' : 'Add New Employee'}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.4 }}>
                Please provide the details for the employee profile below.
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => !submitting && setDialogOpen(false)}
              sx={{
                color: '#94a3b8',
                bgcolor: '#f8f9fc',
                transition: 'all 0.2s',
                '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2, pt: '12px !important' }}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', mb: 0.8, ml: 0.5 }}>
                Employee Full Name
              </Typography>
              <TextField
                placeholder="e.g. John Smith"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', bgcolor: '#f8f9fc', transition: 'all 0.2s',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: '2px' },
                    '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 4px rgba(124,58,237,0.1)' }
                  }
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', mb: 0.8, ml: 0.5 }}>
                Employee Email
              </Typography>
              <TextField
                placeholder="e.g. john@company.com"
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmailOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', bgcolor: '#f8f9fc', transition: 'all 0.2s',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: '2px' },
                    '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 4px rgba(124,58,237,0.1)' }
                  }
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', mb: 0.8, ml: 0.5 }}>
                Job Role / Position
              </Typography>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px', bgcolor: '#f8f9fc', transition: 'all 0.2s',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: '2px' },
                  '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 4px rgba(124,58,237,0.1)' }
                },
                '& .MuiSelect-select': { pl: '40px !important', display: 'flex', alignItems: 'center' }
              }}>
                <Select
                  value={form.role}
                  onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  startAdornment={
                    <InputAdornment position="start" sx={{ position: 'absolute', left: 12, pointerEvents: 'none' }}>
                      <WorkOutlineOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="Employee">Employee</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Designer">Designer</MenuItem>
                  <MenuItem value="Developer">Developer</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {showAssignmentFields && (
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', mb: 0.8, ml: 0.5 }}>
                    Assigned
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={form.assignedTasks}
                    onChange={(e) => setForm(f => ({ ...f, assignedTasks: Number(e.target.value) }))}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AssignmentTurnedInOutlinedIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px', bgcolor: '#f8f9fc', transition: 'all 0.2s',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: '2px' },
                        '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 4px rgba(124,58,237,0.1)' }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', mb: 0.8, ml: 0.5 }}>
                    Completed
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={form.completedTasks}
                    onChange={(e) => setForm(f => ({ ...f, completedTasks: Number(e.target.value) }))}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TaskAltOutlinedIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px', bgcolor: '#f8f9fc', transition: 'all 0.2s',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: '2px' },
                        '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 4px rgba(124,58,237,0.1)' }
                      }
                    }}
                  />
                </Box>
              </Stack>
            )}


            <Box
              sx={{
                mt: 0.5,
                display: 'flex',
                alignItems: 'center',
                p: 1,
                px: 1.5,
                borderRadius: '10px',
                border: '1.5px solid rgba(124,58,237,0.12)',
                bgcolor: form.active ? 'rgba(124,58,237,0.04)' : '#f8f9fc',
                transition: 'all 0.2s',
                ...(form.active && { boxShadow: '0 2px 12px rgba(124,58,237,0.06)', borderColor: '#7c3aed' })
              }}
            >
              <FormControlLabel
                control={<Checkbox checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} sx={{ color: '#c4b5fd', '&.Mui-checked': { color: '#7c3aed' }, p: 0.5 }} />}
                label={<Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: form.active ? '#1e1b4b' : '#64748b' }}>Active Profile</Typography>}
                sx={{ m: 0, width: '100%' }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.04)', bgcolor: '#fafafa' }}>
          <Stack direction="row" spacing={1.5} sx={{ w: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              sx={{
                color: '#64748b',
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                py: 1,
                borderRadius: '10px',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant="contained"
              disableElevation
              sx={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 800,
                letterSpacing: '0.01em',
                px: 3,
                py: 1,
                borderRadius: '10px',
                boxShadow: '0 8px 20px rgba(124,58,237,0.3)',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
                  boxShadow: '0 12px 28px rgba(124,58,237,0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {editingId ? 'Save Changes' : 'Create Employee'}
            </Button>
          </Stack>
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
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#1e1b4b' }}>
          Delete employee?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#475569', fontSize: '0.92rem' }}>
            This will permanently delete
            {' '}
            <strong>{employeeToDelete?.name || 'this employee'}</strong>
            .
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={handleCloseDeleteConfirm} disabled={deleting} sx={{ fontWeight: 700, color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            variant="contained"
            sx={{
              bgcolor: '#dc2626',
              fontWeight: 700,
              '&:hover': { bgcolor: '#b91c1c' }
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeesPage

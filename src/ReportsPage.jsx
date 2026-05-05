import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import { getProjects, getReports, getTimesheetReport } from './services/api'
import { ReportsPerformanceSkeleton } from './pageSkeletons.jsx'

function formatDdMmYyyy(iso) {
  if (!iso || iso === '—') return '—'
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return String(iso)
  return `${d}-${m}-${y}`
}

function formatHoursToHhMm(hours) {
  const n = Number(hours)
  if (!Number.isFinite(n)) return String(hours ?? '—')
  const minutesTotal = Math.round(n * 60)
  const h = Math.floor(minutesTotal / 60)
  const m = minutesTotal % 60
  return `${h}h ${m}min`
}

const TIMESHEET_FILTER_LABEL_SX = {
  display: 'block',
  mb: 0.6,
  fontWeight: 800,
  fontSize: '0.65rem',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.7,
}

function metricIcon(key) {
  const k = String(key || '').toLowerCase()
  if (k.includes('system')) return <DnsOutlinedIcon sx={{ fontSize: 22, color: '#7c3aed' }} />
  if (k.includes('project')) return <FolderOpenOutlinedIcon sx={{ fontSize: 22, color: '#3b82f6' }} />
  if (k.includes('completed')) return <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 22, color: '#059669' }} />
  if (k.includes('in progress')) return <HourglassEmptyOutlinedIcon sx={{ fontSize: 22, color: '#d97706' }} />
  if (k.includes('pending')) return <PendingActionsOutlinedIcon sx={{ fontSize: 22, color: '#64748b' }} />
  if (k.includes('completion')) return <TrendingUpOutlinedIcon sx={{ fontSize: 22, color: '#7c3aed' }} />
  if (k.includes('task')) return <AssignmentOutlinedIcon sx={{ fontSize: 22, color: '#8b5cf6' }} />
  return <AssignmentOutlinedIcon sx={{ fontSize: 22, color: '#94a3b8' }} />
}

function downloadSummaryCsv(rows) {
  const header = 'Metric,Value\n'
  const body = rows
    .map((r) => {
      const key = String(r.key ?? '').replace(/"/g, '""')
      const val = String(r.value ?? '').replace(/"/g, '""')
      return `"${key}","${val}"`
    })
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `system-tracking-summary-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadTimesheetCsv(rows) {
  const header = 'Date (dd-mm-yyyy),Employee,Project,Task,Status,Hours\n'
  const body = rows
    .map((r) => {
      const cells = [
        formatDdMmYyyy(r.date),
        r.employee,
        r.project,
        r.task,
        r.status,
        formatHoursToHhMm(r.hours),
      ].map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
      return cells.join(',')
    })
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timesheet-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function buildTimesheetPreviewHtml(title, rows, totalHours, filtersLabel) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  const tableRows = rows
    .map(
      (r) =>
        `<tr><td>${esc(formatDdMmYyyy(r.date))}</td><td>${esc(r.employee)}</td><td>${esc(r.project)}</td><td>${esc(r.task)}</td><td>${esc(r.status)}</td><td style="text-align:right">${esc(formatHoursToHhMm(r.hours))}</td></tr>`,
    )
    .join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(title)}</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#1e1b4b}
    h1{font-size:1.25rem;margin:0 0 8px}
    .meta{color:#64748b;font-size:0.85rem;margin-bottom:20px}
    .toolbar{display:flex;justify-content:flex-end;margin-bottom:16px;gap:12px}
    .btn{appearance:none;border:1px solid #e2e8f0;background:#fff;padding:8px 12px;border-radius:10px;font-weight:700;color:#1e1b4b;cursor:pointer}
    .btn:hover{border-color:#cbd5e1;background:#fafafe}
    table{border-collapse:collapse;width:100%;font-size:0.88rem}
    th,td{border:1px solid #e2e8f0;padding:10px 12px;text-align:left}
    th{background:#fafafe;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.06em;color:#64748b}
    tfoot td{font-weight:700;border-top:2px solid #7c3aed}
    @media print { body { padding: 12px } .toolbar { display:none } }
  </style></head><body>
  <h1>${esc(title)}</h1>
  <div class="meta">${esc(filtersLabel)} · Total hours: <strong>${esc(formatHoursToHhMm(totalHours))}</strong></div>
  <table><thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Task</th><th>Status</th><th style="text-align:right">Hours</th></tr></thead>
  <tbody>${tableRows}</tbody>
  <tfoot><tr><td colspan="5">Total</td><td style="text-align:right">${esc(formatHoursToHhMm(totalHours))}</td></tr></tfoot>
  </table></body></html>`
  return html
}

export default function ReportsPage({ canViewReports, tasks = [], employees = [], setNotice }) {
  const [tab, setTab] = useState(0)
  const [projects, setProjects] = useState([])

  const [filterEmployeeId, setFilterEmployeeId] = useState('all')
  const [filterProjectId, setFilterProjectId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [timesheetRows, setTimesheetRows] = useState([])
  const [timesheetTotal, setTimesheetTotal] = useState(0)
  const [timesheetGenerated, setTimesheetGenerated] = useState(false)
  const [timesheetLoading, setTimesheetLoading] = useState(false)

  const [printPreviewOpen, setPrintPreviewOpen] = useState(false)
  const [printPreviewHtml, setPrintPreviewHtml] = useState('')
  const iframeRef = useRef(null)

  const [summaryRows, setSummaryRows] = useState([])
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getProjects()
        if (mounted) setProjects(Array.isArray(data) ? data : [])
      } catch {
        if (mounted) setProjects([])
      }
    })()
    return () => { mounted = false }
  }, [])

  const loadPerformance = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const data = await getReports()
      setSummaryRows(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load performance data'
      setNotice?.({ type: 'error', message })
      setSummaryRows([])
    } finally {
      setSummaryLoading(false)
    }
  }, [setNotice])

  useEffect(() => {
    if (!canViewReports || tab !== 2) return
    loadPerformance()
  }, [canViewReports, tab, loadPerformance])

  const completionPct = useMemo(() => {
    const row = summaryRows.find((r) => String(r.key).toLowerCase().includes('completion rate'))
    if (!row) return 0
    const n = Number.parseInt(String(row.value).replace(/%/g, ''), 10)
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 0
  }, [summaryRows])

  const filtersSummary = useMemo(() => {
    const emp =
      filterEmployeeId === 'all'
        ? 'All employees'
        : employees.find((e) => String(e.id) === String(filterEmployeeId))?.name || 'Employee'
    const proj =
      filterProjectId === 'all'
        ? 'All projects'
        : projects.find((p) => String(p.id) === String(filterProjectId))?.name || 'Project'
    const dr =
      dateFrom || dateTo
        ? `${dateFrom ? formatDdMmYyyy(dateFrom) : '…'} – ${dateTo ? formatDdMmYyyy(dateTo) : '…'}`
        : 'All dates'
    return `${emp} · ${proj} · ${dr}`
  }, [filterEmployeeId, filterProjectId, dateFrom, dateTo, employees, projects])

  async function handleGenerateTimesheet() {
    setTimesheetLoading(true)
    try {
      const data = await getTimesheetReport({
        employeeId: filterEmployeeId,
        projectId: filterProjectId,
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {}),
      })
      setTimesheetRows(Array.isArray(data?.rows) ? data.rows : [])
      setTimesheetTotal(Number(data?.totalHours) || 0)
      setTimesheetGenerated(true)
      setNotice?.({ type: 'success', message: 'Timesheet generated.' })
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to generate timesheet'
      setNotice?.({ type: 'error', message })
      setTimesheetRows([])
      setTimesheetTotal(0)
    } finally {
      setTimesheetLoading(false)
    }
  }

  const employeeTasksRows = useMemo(() => {
    const list = [...tasks].sort((a, b) => Number(b.id) - Number(a.id))
    return list
  }, [tasks])

  if (!canViewReports) {
    return (
      <Box sx={{ width: '100%', maxWidth: 560, mx: 'auto', py: 6 }}>
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.12)', boxShadow: 'var(--shadow-xs)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography fontWeight={800} sx={{ fontSize: '1.1rem', color: '#1e1b4b', mb: 1 }}>
              Reports are restricted
            </Typography>
            <Typography sx={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
              Timesheets, exports, and analytics on this page are available to administrators and managers only. Contact your admin if you need a copy of your hours.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-end' },
          justifyContent: 'space-between',
          gap: { xs: 0.75, sm: 1 },
          mb: 1.25,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 36,
            borderBottom: 1,
            borderColor: 'rgba(124, 58, 237, 0.12)',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              minHeight: 36,
              py: 0.5,
              color: '#64748b',
              '&.Mui-selected': { color: '#7c3aed' },
            },
            '& .MuiTabs-indicator': { bgcolor: '#7c3aed', height: 2, borderRadius: '2px 2px 0 0' },
          }}
        >
          <Tab label="Timesheet" />
          <Tab label="Employee Tasks" />
          <Tab label="Performance" />
        </Tabs>
        
      </Box>

      {tab === 0 && (
        <>
          <Card
            sx={{
              borderRadius: '14px',
              border: '1px solid rgba(124,58,237,0.08)',
              boxShadow: 'var(--shadow-xs)',
              bgcolor: '#fff',
              mb: 1.75,
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 1.75 }, '&:last-child': { pb: { xs: 1.5, sm: 1.75 } } }}>
              <Stack direction="row"  gap={1.5} style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <Box>
              <Typography fontWeight={800} sx={{ fontSize: '0.9rem', color: '#1e1b4b', mb: 0.35 }}>
                Filter timesheet
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mb: 1.25, lineHeight: 1.45, maxWidth: 720 }}>
                Date range is optional. The calendar uses your browser’s layout; the report still filters using the dates you pick.
              </Typography>
              </Box>
              <Box>
              <Button
                  variant="contained"
                  startIcon={timesheetLoading ? <CircularProgress size={18} color="inherit" /> : <SearchOutlinedIcon />}
                  disabled={timesheetLoading}
                  onClick={handleGenerateTimesheet}
                  sx={{
                    bgcolor: '#7c3aed',
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '10px',
                    px: 2.25,
                    py: 1.3,
                    boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
                    '&:hover': { bgcolor: '#6d28d9' },
                  }}
                >
                  Generate report
                </Button>
              </Box>
              </Stack>
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={1.25}
                alignItems={{ xs: 'stretch', lg: 'flex-end' }}
                flexWrap="wrap"
                useFlexGap
              >
                <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                  <Typography component="label" htmlFor="report-ts-employee" sx={TIMESHEET_FILTER_LABEL_SX}>
                    Employee
                  </Typography>
                  <FormControl fullWidth size="small" variant="outlined">
                    <Select
                      id="report-ts-employee"
                      value={filterEmployeeId}
                      onChange={(e) => setFilterEmployeeId(e.target.value)}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Employee' }}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiSelect-select': { py: 1 },
                      }}
                    >
                      <MenuItem value="all">All employees</MenuItem>
                      {employees.map((e) => (
                        <MenuItem key={e.id} value={String(e.id)}>
                          {e.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                  <Typography component="label" htmlFor="report-ts-project" sx={TIMESHEET_FILTER_LABEL_SX}>
                    Project
                  </Typography>
                  <FormControl fullWidth size="small" variant="outlined">
                    <Select
                      id="report-ts-project"
                      value={filterProjectId}
                      onChange={(e) => setFilterProjectId(e.target.value)}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Project' }}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiSelect-select': { py: 1 },
                      }}
                    >
                      <MenuItem value="all">All projects</MenuItem>
                      {projects.map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: { xs: '100%', sm: 184 } }}>
                  <Typography component="label" htmlFor="report-ts-start" sx={TIMESHEET_FILTER_LABEL_SX}>
                    Start date
                  </Typography>
                  <TextField
                    id="report-ts-start"
                    type="date"
                    size="small"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    fullWidth
                    variant="outlined"
                    inputProps={{ 'aria-label': 'Start date' }}
                    sx={{
                      '& .MuiOutlinedInput-root': { pr: 0.75 },
                      '& .MuiInputBase-input': {
                        py: 1,
                        fontVariantNumeric: 'tabular-nums',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: { xs: '100%', sm: 184 } }}>
                  <Typography component="label" htmlFor="report-ts-end" sx={TIMESHEET_FILTER_LABEL_SX}>
                    End date
                  </Typography>
                  <TextField
                    id="report-ts-end"
                    type="date"
                    size="small"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    fullWidth
                    variant="outlined"
                    inputProps={{ 'aria-label': 'End date' }}
                    sx={{
                      '& .MuiOutlinedInput-root': { pr: 0.75 },
                      '& .MuiInputBase-input': {
                        py: 1,
                        fontVariantNumeric: 'tabular-nums',
                      },
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {!timesheetGenerated ? (
            <Card
              sx={{
                borderRadius: '14px',
                border: '1px dashed rgba(124,58,237,0.25)',
                bgcolor: '#fff',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ py: 4, px: 2, textAlign: 'center' }}>
                <AccessTimeOutlinedIcon sx={{ fontSize: 44, color: 'rgba(124,58,237,0.22)', mb: 1 }} />
                <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>
                  Generate a timesheet
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', mt: 0.5 }}>
                  Select filters above and click &quot;Generate report&quot;.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)', bgcolor: '#fff' }}>
              <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <Stack direction="row"  flexWrap="wrap" gap={1.5} style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <Box>
                    <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>
                      Timesheet results
                    </Typography>
                    <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', mt: 0.3 }}>{filtersSummary}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintOutlinedIcon />}
                      disabled={timesheetRows.length === 0}
                      onClick={() => {
                        const html = buildTimesheetPreviewHtml('Timesheet report', timesheetRows, timesheetTotal, filtersSummary)
                        setPrintPreviewHtml(html)
                        setPrintPreviewOpen(true)
                      }}
                      sx={{ textTransform: 'none', fontWeight: 800, borderColor: 'rgba(124,58,237,0.35)', color: '#7c3aed' }}
                    >
                      Print preview
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadOutlinedIcon />}
                      disabled={timesheetRows.length === 0}
                      onClick={() => downloadTimesheetCsv(timesheetRows)}
                      sx={{ textTransform: 'none', fontWeight: 800, borderColor: 'rgba(124,58,237,0.35)', color: '#7c3aed' }}
                    >
                      Export CSV
                    </Button>
                  </Stack>
                </Stack>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#7c3aed', mt: 1.5 }}>
                  Total hours: {formatHoursToHhMm(timesheetTotal)}
                </Typography>
              </Box>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" style={{marginBottom: '10px'}}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fafafe' }}>
                      {['Date', 'Employee', 'Project', 'Task', 'Status', 'Hours'].map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            py: 1.5,
                            px: 2,
                            borderColor: 'rgba(0,0,0,0.05)',
                            ...(col === 'Hours' ? { textAlign: 'right' } : {}),
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timesheetRows.map((r, idx) => (
                      <TableRow key={`${r.date}-${r.task}-${idx}`} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem' }}>{formatDdMmYyyy(r.date)}</TableCell>
                        <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem', fontWeight: 700 }}>{r.employee}</TableCell>
                        <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem' }}>{r.project}</TableCell>
                        <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem' }}>{r.task}</TableCell>
                        <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem', textTransform: 'capitalize' }}>{r.status}</TableCell>
                        <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem', fontWeight: 800, textAlign: 'right' }}>{formatHoursToHhMm(r.hours)}</TableCell>
                      </TableRow>
                    ))}
                    {timesheetRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 5, textAlign: 'center' }}>
                          <Typography sx={{ color: '#94a3b8', fontWeight: 700 }}>No rows match these filters.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          )}
        </>
      )}

      {tab === 1 && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)', bgcolor: '#fff' }}>
          <Box sx={{ px: 2.5, pt: 2, pb: 1, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>
              All tasks
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', mt: 0.2 }}>
              Task list with assignee and project for operational review
            </Typography>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" style={{marginBottom: '10px'}}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafe' }}>
                  {['Task', 'Project', 'Assignee', 'Status', 'Priority'].map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        py: 1.5,
                        px: 2,
                        borderColor: 'rgba(0,0,0,0.05)',
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeTasksRows.map((t) => (
                  <TableRow key={t.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ py: 1.2, px: 2, fontWeight: 700, fontSize: '0.85rem' }}>{t.title}</TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem' }}>{t.project}</TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem' }}>{t.assignee || '—'}</TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem', textTransform: 'capitalize' }}>{t.status}</TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.85rem', textTransform: 'capitalize' }}>{t.priority}</TableCell>
                  </TableRow>
                ))}
                {employeeTasksRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 5, textAlign: 'center' }}>
                      <Typography sx={{ color: '#94a3b8', fontWeight: 700 }}>No tasks yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {tab === 2 && (
        <>
          {summaryLoading && summaryRows.length === 0 ? (
            <ReportsPerformanceSkeleton />
          ) : (
            <>
              <Card
                sx={{
                  borderRadius: '16px',
                  border: '1px solid rgba(124,58,237,0.08)',
                  boxShadow: 'var(--shadow-xs)',
                  bgcolor: '#fff',
                  mb: 2.5,
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
                  <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b', mb: 0.5 }}>
                    Task completion
                  </Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', mb: 2 }}>
                    Overall completion rate across all tasks
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={completionPct}
                      sx={{
                        flex: 1,
                        height: 10,
                        borderRadius: '100px',
                        bgcolor: '#ede9fe',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: '100px',
                          background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e1b4b', minWidth: 44, textAlign: 'right' }}>
                      {completionPct}%
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadOutlinedIcon />}
                  disabled={summaryRows.length === 0}
                  onClick={() => downloadSummaryCsv(summaryRows)}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 800,
                    borderColor: 'rgba(124,58,237,0.35)',
                    color: '#7c3aed',
                  }}
                >
                  Export summary CSV
                </Button>
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 1.75,
                  mb: 2.5,
                }}
              >
                {summaryRows.map((row) => (
                  <Card
                    key={row.key}
                    sx={{
                      borderRadius: '14px',
                      border: '1px solid rgba(124,58,237,0.07)',
                      boxShadow: 'var(--shadow-xs)',
                      bgcolor: '#fff',
                    }}
                  >
                    <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: 'rgba(124,58,237,0.06)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {metricIcon(row.key)}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            {row.key}
                          </Typography>
                          <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e1b4b', mt: 0.5, lineHeight: 1.2 }}>
                            {row.value}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </>
          )}
        </>
      )}
    <Dialog
      open={printPreviewOpen}
      onClose={() => setPrintPreviewOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#1e1b4b' }}>Timesheet preview</DialogTitle>
      <DialogContent sx={{ p: 0, height: { xs: 420, md: 520 } }}>
        <iframe
          ref={iframeRef}
          title="Timesheet preview"
          style={{ width: '100%', height: '100%', border: 0 }}
          srcDoc={printPreviewHtml}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => setPrintPreviewOpen(false)}
          sx={{ fontWeight: 800, color: '#64748b', textTransform: 'none' }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            const win = iframeRef.current?.contentWindow
            if (win && typeof win.print === 'function') win.print()
          }}
          sx={{ bgcolor: '#7c3aed', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#6d28d9' } }}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  )
}

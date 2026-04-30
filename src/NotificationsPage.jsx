import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

function timeAgoLabel(isoString) {
  const ts = new Date(isoString).getTime()
  if (!Number.isFinite(ts)) return 'Unknown time'
  const diffMs = Date.now() - ts
  const diffMin = Math.max(1, Math.floor(diffMs / 60000))
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} hr ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `${diffD} day ago`
  return new Date(isoString).toLocaleDateString()
}

function cleanNotificationMessage(message) {
  const raw = String(message || '').trim()
  if (!raw) return 'No details available.'
  const withoutIds = raw
    .replace(/\b[a-zA-Z_]*id\s*:\s*[^|,;]+(\s*[|,;]\s*)?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[|,;:-]+\s*/, '')
    .replace(/\s*[|,;:-]+\s*$/, '')
    .trim()
  return withoutIds || 'No details available.'
}

export default function NotificationsPage({
  notifications = [],
  loading = false,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onMarkManyRead,
  onDeleteMany,
}) {
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )
  const allNotificationIds = useMemo(() => notifications.map((item) => item.id), [notifications])
  const pagedNotifications = useMemo(() => {
    const start = page * rowsPerPage
    return notifications.slice(start, start + rowsPerPage)
  }, [notifications, page, rowsPerPage])
  const pageIds = useMemo(() => pagedNotifications.map((item) => item.id), [pagedNotifications])
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
  const someSelected = pageIds.some((id) => selectedIds.includes(id))
  const selectedCount = selectedIds.length

  useEffect(() => {
    const allowed = new Set(allNotificationIds)
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)))
  }, [allNotificationIds])

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(notifications.length / rowsPerPage) - 1)
    if (page > maxPage) setPage(maxPage)
  }, [notifications.length, rowsPerPage, page])

  function toggleSelectOne(id) {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ))
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allSelected) return prev.filter((id) => !pageIds.includes(id))
      const next = new Set(prev)
      for (const id of pageIds) next.add(id)
      return [...next]
    })
  }

  async function handleMarkSelectedRead() {
    await onMarkManyRead?.(selectedIds)
    setSelectedIds([])
  }

  async function handleDeleteSelected() {
    await onDeleteMany?.(selectedIds)
    setSelectedIds([])
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Card sx={{ borderRadius: '14px', border: '1px solid rgba(124,58,237,0.10)', boxShadow: 'var(--shadow-xs)', mb: 1.75 }}>
        <CardContent sx={{ p: { xs: 1.8, sm: 2.2 }, '&:last-child': { pb: { xs: 1.8, sm: 2.2 } } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}>
            <Box>
              <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b', mb: 0.35 }}>
                All notifications
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Updates are visible to all signed-in users.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Chip
                icon={<NotificationsActiveOutlinedIcon sx={{ color: '#7c3aed !important', fontSize: '16px' }} />}
                label={`${unreadCount} unread`}
                variant="outlined"
                sx={{
                  height: 32,
                  borderColor: 'rgba(124,58,237,0.3)',
                  color: '#7c3aed',
                  fontWeight: 700,
                  bgcolor: 'rgba(124,58,237,0.04)',
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={onRefresh}
                disabled={loading}
                startIcon={<RefreshRoundedIcon />}
                sx={{
                  minHeight: 32,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: 'rgba(124,58,237,0.3)',
                  color: '#7c3aed',
                }}
              >
                Refresh
              </Button>
              {selectedCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DoneAllOutlinedIcon />}
                  onClick={handleMarkSelectedRead}
                  disabled={loading}
                  sx={{ textTransform: 'none', fontWeight: 800, borderColor: 'rgba(124,58,237,0.3)', color: '#7c3aed' }}
                >
                  Mark all read
                </Button>
              )}
              {selectedCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDeleteSelected}
                  disabled={loading}
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  sx={{ textTransform: 'none', fontWeight: 700, borderColor: 'rgba(220,38,38,0.35)', color: '#dc2626' }}
                >
                  Delete all notifications ({selectedCount})
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {loading && notifications.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7c3aed' }} />
        </Box>
      ) : notifications.length === 0 ? (
        <Card sx={{ borderRadius: '14px', border: '1px dashed rgba(124,58,237,0.25)', bgcolor: 'rgba(124,58,237,0.02)', boxShadow: 'none' }}>
          <CardContent sx={{ py: 5, textAlign: 'center' }}>
            <Typography fontWeight={800} sx={{ fontSize: '1rem', color: '#1e1b4b' }}>
              No notifications yet
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', mt: 0.5 }}>
              Actions like project or task updates will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ borderRadius: '14px', border: '1px solid rgba(124,58,237,0.12)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafe' }}>
                  <TableCell sx={{ width: 56, py: 1.3, px: 1.2, borderColor: 'rgba(0,0,0,0.05)' }}>
                    <Checkbox size="small" checked={allSelected} indeterminate={!allSelected && someSelected} onChange={toggleSelectAll} />
                  </TableCell>
                  <TableCell sx={{ py: 1.3, px: 1.5, borderColor: 'rgba(0,0,0,0.05)', minWidth: 180 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Title
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.3, px: 1.5, borderColor: 'rgba(0,0,0,0.05)', minWidth: 360 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Details
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.3, px: 1.5, borderColor: 'rgba(0,0,0,0.05)', width: 130 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Time
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.3, px: 1.5, borderColor: 'rgba(0,0,0,0.05)', width: 140, textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Action
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedNotifications.map((item) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      bgcolor: item.read ? '#fff' : 'rgba(124,58,237,0.045)',
                      '&:hover': { bgcolor: item.read ? '#fafafe' : 'rgba(124,58,237,0.07)' },
                      '& td': { borderColor: 'rgba(0,0,0,0.04)' },
                    }}
                  >
                    <TableCell sx={{ py: 1.2, px: 1.2 }}>
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 1.5 }}>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Typography fontWeight={800} sx={{ fontSize: '0.88rem', color: '#1e1b4b' }}>
                          {item.title || 'Notification'}
                        </Typography>
                        {!item.read && (
                          <Chip
                            label="New"
                            size="small"
                            sx={{
                              height: 19,
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(124,58,237,0.14)',
                              color: '#7c3aed',
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 1.5 }}>
                      <Typography sx={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                        {cleanNotificationMessage(item.message)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 1.5 }}>
                      <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                        {timeAgoLabel(item.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 1.5, textAlign: 'right' }}>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<MarkEmailReadOutlinedIcon />}
                        onClick={() => onMarkRead?.(item.id)}
                        disabled={loading || item.read}
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#7c3aed' }}
                      >
                        {item.read ? 'Read' : 'Mark read'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{
              px: 1,
              borderTop: '1px solid rgba(0,0,0,0.05)',
              bgcolor: '#fcfbff',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 0.4,
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', px: 1.1 }}>
              {selectedCount} selected • {unreadCount} unread
            </Typography>
            <TablePagination
              component="div"
              count={notifications.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
              labelRowsPerPage="Rows"
              sx={{
                '& .MuiTablePagination-toolbar': { minHeight: 44, px: 0.8 },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.76rem',
                  color: '#64748b',
                },
              }}
            />
          </Stack>
        </Card>
      )}
    </Box>
  )
}

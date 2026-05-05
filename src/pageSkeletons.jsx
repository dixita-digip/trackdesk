import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'

/** Matches list/table skeleton tone used across TrackDesk */
const sk = {
  bgcolor: 'rgba(148, 163, 184, 0.22)',
  animation: 'wave',
}

const GRADIENT_HEADER_SX = {
  mb: 1.6,
  p: 0,
  borderRadius: '14px',
  border: '1px solid rgba(124,58,237,0.08)',
  background: 'linear-gradient(180deg, #f8f7ff 0%, #f4f3ff 100%)',
  boxShadow: '0 4px 14px rgba(30,27,75,0.05)',
  overflow: 'hidden',
}

export function ModuleGradientHeaderSkeleton({ showActionSlot = true }) {
  return (
    <Box sx={GRADIENT_HEADER_SX}>
      <Stack direction="row" justifyContent="space-between" alignItems="stretch" gap={0}>
        <Box sx={{ flex: 1, p: { xs: 1.4, md: 1.7 } }}>
          <Skeleton width={160} height={22} sx={sk} />
          <Skeleton width="72%" height={14} sx={{ ...sk, mt: 1 }} />
          <Stack direction="row" spacing={0.7} sx={{ mt: 1.5 }}>
            <Skeleton width={72} height={20} sx={{ ...sk, borderRadius: '10px' }} />
            <Skeleton width={72} height={20} sx={{ ...sk, borderRadius: '10px' }} />
          </Stack>
        </Box>
        {showActionSlot ? (
          <Box
            sx={{
              minWidth: { xs: 112, md: 126 },
              px: { xs: 0.9, md: 1.1 },
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Skeleton width={108} height={32} sx={{ ...sk, borderRadius: '9px' }} />
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}

export function DataTableSkeleton({ columns = 7, rows = 6 }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: '#fafafe' }}>
          {Array.from({ length: columns }).map((_, i) => (
            <TableCell key={`h-${String(i)}`} sx={{ py: 1.25, px: 1.75, borderColor: 'rgba(0,0,0,0.05)' }}>
              <Skeleton width={56 + (i % 3) * 12} height={12} sx={sk} />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, ri) => (
          <TableRow key={`r-${String(ri)}`} sx={{ '&:last-child td': { border: 0 } }}>
            {Array.from({ length: columns }).map((_, ci) => (
              <TableCell key={`c-${String(ri)}-${String(ci)}`} sx={{ py: 1, px: 1.75, borderColor: 'rgba(0,0,0,0.04)' }}>
                <Skeleton
                  variant="rounded"
                  height={ci === 0 ? 20 : 16}
                  width={ci === 0 ? '78%' : `${55 + ((ri + ci) % 5) * 8}%`}
                  sx={{ ...sk, borderRadius: '6px' }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Dashboard: welcome strip, metric grid, analytics row, activity block, team table */
export function DashboardPageSkeleton() {
  return (
    <Stack spacing={2.5} sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
      <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.12)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(30,27,75,0.06)' }}>
        <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton width={200} height={28} sx={sk} />
              <Skeleton width="90%" height={16} sx={{ ...sk, mt: 1.25 }} />
              <Skeleton width="60%" height={16} sx={{ ...sk, mt: 1 }} />
              <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
                <Skeleton width={120} height={40} sx={{ ...sk, borderRadius: '12px' }} />
                <Skeleton width={120} height={40} sx={{ ...sk, borderRadius: '12px' }} />
              </Stack>
            </Box>
            <Skeleton variant="rounded" width={{ xs: '100%', md: 200 }} height={120} sx={{ ...sk, borderRadius: '14px', flexShrink: 0 }} />
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Skeleton width={110} height={18} sx={{ ...sk, mb: 1.5 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`m-${String(i)}`} sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)' }}>
              <CardContent sx={{ p: 2 }}>
                <Skeleton width={36} height={36} sx={{ ...sk, borderRadius: '10px' }} />
                <Skeleton width="55%" height={14} sx={{ ...sk, mt: 1.5 }} />
                <Skeleton width={48} height={32} sx={{ ...sk, mt: 1 }} />
                <Skeleton width="70%" height={12} sx={{ ...sk, mt: 1.25 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      <Box>
        <Skeleton width={88} height={18} sx={{ ...sk, mb: 1.5 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.07)', boxShadow: 'var(--shadow-xs)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Skeleton width="50%" height={20} sx={sk} />
              <Skeleton width="40%" height={14} sx={{ ...sk, mt: 0.75 }} />
              <Skeleton variant="rounded" height={200} sx={{ ...sk, mt: 2, borderRadius: '12px' }} />
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.07)', boxShadow: 'var(--shadow-xs)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Skeleton width="55%" height={20} sx={sk} />
              <Skeleton width="45%" height={14} sx={{ ...sk, mt: 0.75 }} />
              <Stack spacing={1.25} sx={{ mt: 2.5 }}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <Box key={`pb-${String(j)}`}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Skeleton width="35%" height={14} sx={sk} />
                      <Skeleton width={32} height={14} sx={sk} />
                    </Stack>
                    <Skeleton variant="rounded" height={8} sx={{ ...sk, borderRadius: '100px' }} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box>
        <Skeleton width={72} height={18} sx={{ ...sk, mb: 1.5 }} />
        <Card sx={{ borderRadius: '18px', border: '1px solid rgba(124,58,237,0.07)', boxShadow: 'var(--shadow-xs)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton width={160} height={20} sx={sk} />
                <Skeleton width={220} height={14} sx={{ ...sk, mt: 0.75 }} />
              </Box>
              <Skeleton width={56} height={18} sx={sk} />
            </Stack>
            {Array.from({ length: 3 }).map((_, k) => (
              <Box key={`pc-${String(k)}`} sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                  <Skeleton width="30%" height={14} sx={sk} />
                  <Skeleton width={36} height={14} sx={sk} />
                </Stack>
                <Skeleton variant="rounded" height={8} sx={{ ...sk, borderRadius: '100px' }} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: '#fafafe' }}>
          <Skeleton width={140} height={18} sx={sk} />
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <DataTableSkeleton columns={7} rows={5} />
        </Box>
      </Card>
    </Stack>
  )
}

/** Projects + Employees list: gradient strip + white table card */
export function ProjectsTableCardSkeleton() {
  return (
    <Box sx={{ pb: 1.75 }}>
      <ModuleGradientHeaderSkeleton />
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.10)', boxShadow: '0 8px 24px rgba(15,23,42,0.05)', bgcolor: '#fff', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <DataTableSkeleton columns={8} rows={7} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export function EmployeesModuleSkeleton() {
  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <ProjectsTableCardSkeleton />
    </Box>
  )
}

const TASKS_BG_CHROME = '#f4f4fc'
const TASKS_BORDER = 'rgba(124, 58, 237, 0.12)'

/** Kanban board shell — matches Tasks page panel */
export function TasksBoardSkeleton() {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: TASKS_BG_CHROME,
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#ffffff',
          backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)',
          borderRadius: '16px',
          border: `1px solid ${TASKS_BORDER}`,
          p: { xs: 1.75, sm: 2, md: 2.25 },
          boxShadow: '0 4px 24px rgba(30, 27, 75, 0.07), 0 1px 0 rgba(255, 255, 255, 0.9) inset',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent={{ md: 'space-between' }}
          spacing={2}
          sx={{ mb: 2, flexShrink: 0 }}
        >
          <Box sx={{ minWidth: 0, flex: { md: '1 1 auto' } }}>
            <Skeleton width={100} height={22} sx={sk} />
            <Skeleton width={{ xs: '100%', md: 420 }} height={14} sx={{ ...sk, mt: 1 }} />
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Skeleton variant="rounded" height={40} sx={{ ...sk, borderRadius: '10px', minWidth: { sm: 188 } }} />
            <Skeleton variant="rounded" height={40} sx={{ ...sk, borderRadius: '10px', minWidth: { sm: 188 } }} />
            <Skeleton variant="rounded" height={40} sx={{ ...sk, borderRadius: '10px', minWidth: { sm: 140 } }} />
          </Stack>
        </Stack>
        <Box sx={{ flex: 1, display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, minHeight: 320 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box
              key={`col-${String(i)}`}
              sx={{
                flex: '0 0 260px',
                bgcolor: '#f5f4fb',
                borderRadius: '14px',
                border: `1px solid ${TASKS_BORDER}`,
                p: 1.25,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Skeleton width="55%" height={18} sx={sk} />
              <Skeleton variant="rounded" height={72} sx={{ ...sk, borderRadius: '12px' }} />
              <Skeleton variant="rounded" height={72} sx={{ ...sk, borderRadius: '12px' }} />
              <Skeleton variant="rounded" height={72} sx={{ ...sk, borderRadius: '12px' }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

/** Reports → Performance tab initial load */
export function ReportsPerformanceSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: 'var(--shadow-xs)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Skeleton width={160} height={20} sx={sk} />
          <Skeleton width="55%" height={14} sx={{ ...sk, mt: 1 }} />
          <Skeleton variant="rounded" height={10} sx={{ ...sk, mt: 2.5, borderRadius: '100px' }} />
        </CardContent>
      </Card>
      <Skeleton variant="rounded" width={160} height={40} sx={{ ...sk, borderRadius: '10px', alignSelf: 'flex-end' }} />
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <DataTableSkeleton columns={6} rows={8} />
        </Box>
      </Card>
    </Stack>
  )
}

/** Notifications: toolbar card + table */
export function NotificationsListSkeleton() {
  return (
    <Stack spacing={2}>
      <Card sx={{ borderRadius: '14px', border: '1px solid rgba(124,58,237,0.1)', boxShadow: 'var(--shadow-xs)' }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Skeleton width={200} height={22} sx={sk} />
            <Stack direction="row" spacing={1}>
              <Skeleton width={88} height={32} sx={{ ...sk, borderRadius: '8px' }} />
              <Skeleton width={88} height={32} sx={{ ...sk, borderRadius: '8px' }} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: '14px', border: '1px solid rgba(124,58,237,0.12)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <DataTableSkeleton columns={5} rows={8} />
        </Box>
      </Card>
    </Stack>
  )
}

export function EmployeeDetailFiveColTableSkeleton() {
  return <DataTableSkeleton columns={5} rows={5} />
}

export function EmployeeDetailTimesheetToolbarSkeleton() {
  return (
    <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Skeleton width={28} height={28} sx={{ ...sk, borderRadius: '8px' }} />
        <Skeleton width={180} height={20} sx={sk} />
      </Stack>
      <Skeleton width={96} height={28} sx={{ ...sk, borderRadius: '8px' }} />
    </Box>
  )
}
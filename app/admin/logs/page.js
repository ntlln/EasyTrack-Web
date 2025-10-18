"use client";
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TablePagination, IconButton } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin?action=audit-logs');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch logs');
        setLogs(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setError(e.message || 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  const paginated = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => router.push('/admin')} color="primary" size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>System Logs</Typography>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Table Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Event Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Row Data</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Old Data</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No logs found.</TableCell>
                  </TableRow>
                ) : (
                  paginated.map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{log.table_name || 'N/A'}</TableCell>
                      <TableCell>{log.event_type || 'N/A'}</TableCell>
                      <TableCell><pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{typeof log.row_data === 'object' ? JSON.stringify(log.row_data) : String(log.row_data || '')}</pre></TableCell>
                      <TableCell><pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{typeof log.old_data === 'object' ? JSON.stringify(log.old_data) : String(log.old_data || '')}</pre></TableCell>
                      <TableCell>{log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>{log.action_by_name || log.action_by || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {logs.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
                component="div"
                count={logs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, IconButton, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';

export default function Page() {
  const supabase = createClientComponentClient();
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [logType, setLogType] = useState('all');
  const [totalCount, setTotalCount] = useState(0);

  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch logs with pagination and filters
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      console.log('Fetching logs with params:', {
        page: page + 1,
        per_page: rowsPerPage,
        search: searchTerm,
        type: logType !== 'all' ? logType : undefined
      });

      // Fetch logs using the admin API
      const response = await fetch(`/api/admin?action=logs&page=${page + 1}&per_page=${rowsPerPage}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}${logType !== 'all' ? `&type=${encodeURIComponent(logType)}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch logs');
      }

      const data = await response.json();
      console.log('Received logs data:', { count: data.logs?.length, total: data.total });
      
      setLogs(data.logs || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh on filter changes
  useEffect(() => {
    if (mounted) {
      fetchLogs();
    }
  }, [mounted, page, rowsPerPage, searchTerm, logType]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle log type filter
  const handleLogTypeChange = (event) => {
    setLogType(event.target.value);
    setPage(0);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch (err) {
      return timestamp;
    }
  };

  // Log type options
  const logTypes = [
    { value: 'all', label: 'All Severities' },
    { value: 'error', label: 'Error' },
    { value: 'info', label: 'Info' },
    { value: 'log', label: 'Log' },
    { value: 'warning', label: 'Warning' }
  ];

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  return (
    <Box sx={{ p: 4, maxWidth: "1400px", mx: "auto" }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Postgres Logs & Analytics
        </Typography>
        <IconButton onClick={fetchLogs} color="primary" title="Refresh logs">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search in logs..."
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={logType}
            label="Severity"
            onChange={handleLogTypeChange}
          >
            {logTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Logs Table */}
      {!loading && (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, idx) => (
                <TableRow key={log.id || idx}>
                  <TableCell>{formatTimestamp(log.timestamp || log.inserted_at)}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color:
                          log.severity === 'ERROR' ? 'error.main' :
                          log.severity === 'WARNING' ? 'warning.main' :
                          log.severity === 'INFO' ? 'info.main' :
                          log.severity === 'LOG' ? 'primary.main' :
                          'text.primary',
                        fontWeight: log.severity === 'ERROR' ? 'bold' : 'normal',
                        textTransform: 'capitalize'
                      }}
                    >
                      {log.severity || log.level || 'Log'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {log.event_message || log.event_type || log.event || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        maxWidth: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                        fontSize: 13
                      }}
                    >
                      {log.message || log.event_message || log.payload || log.metadata || 'No message'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>
      )}
    </Box>
  );
}

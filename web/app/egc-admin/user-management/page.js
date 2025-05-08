"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, MenuItem, TextField, Typography, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Menu, Pagination } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchStatusOptions();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          middle_initial,
          last_name,
          role_id,
          user_status_id,
          profiles_status (
            status_name
          ),
          profiles_roles (
            role_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAccounts = data.map(account => ({
        id: account.id,
        name: `${account.first_name || ''} ${account.middle_initial || ''} ${account.last_name || ''}`.trim() || account.email,
        role: account.profiles_roles?.role_name || 'No Role',
        email: account.email,
        status: account.profiles_status?.status_name || 'Inactive',
        user_status_id: account.user_status_id
      }));

      setAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusOptions = async () => {
    const { data, error } = await supabase
      .from('profiles_status')
      .select('id, status_name');
    if (!error && data) {
      // Exclude Online, Offline, Pending
      setStatusOptions(data.filter(opt => !['Online', 'Offline', 'Pending'].includes(opt.status_name)));
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || account.role === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenMenu = (event, account) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedAccount(null);
  };

  const handleEdit = () => {
    if (selectedAccount) {
      router.push(`/egc-admin/user-management/edit-account/${selectedAccount.id}`);
    }
    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (selectedAccount) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', selectedAccount.id);

        if (error) throw error;

        // Refresh the accounts list
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
        setError('Failed to delete account');
      }
    }
    handleCloseMenu();
  };

  const handleCreateAccount = () => {
    router.push("/egc-admin/user-management/create-account");
  };

  const handleRefresh = () => {
    fetchAccounts();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const totalPages = Math.ceil(filteredAccounts.length / rowsPerPage);

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={4} display="flex" flexDirection="column" gap={4}>
      <Box>
        <Typography variant="h3" color="primary.main" fontWeight="bold">
          User Management
        </Typography>
      </Box>

      {/* Filter and Actions */}
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Box display="flex" gap={2}>
          <TextField
            label="Search"
            sx={{ width: "250px" }}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name..."
          />
          <TextField
            label="All Departments"
            sx={{ width: "200px" }}
            select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
          >
            <MenuItem value="All Departments">All Departments</MenuItem>
            <MenuItem value="Administrator">Administrator</MenuItem>
            <MenuItem value="Contractor">Contractor</MenuItem>
            <MenuItem value="Delivery Personnel">Delivery Personnel</MenuItem>
          </TextField>
        </Box>

        <Box display="flex" gap={2} ml="auto">
          <Button variant="contained" sx={{ height: "50px", width: "170px" }} onClick={handleCreateAccount}>
            Create Account
          </Button>
          <Button variant="outlined" sx={{ height: "50px", width: "150px" }} onClick={handleRefresh}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.id}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{account.role}</TableCell>
                  <TableCell>{account.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={(event) => handleOpenMenu(event, account)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
            <TextField select label="Rows per page" value={rowsPerPage} onChange={handleChangeRowsPerPage} size="small" sx={{ width: "120px" }}>
              {[5, 10, 15].map((rows) => (
                <MenuItem key={rows} value={rows}>
                  {rows}
                </MenuItem>
              ))}
            </TextField>

            <Pagination count={totalPages} page={page + 1} onChange={handleChangePage} color="primary" shape="rounded" showFirstButton showLastButton />
          </Box>
        </TableContainer>
      </Box>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu} anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
        {statusOptions.map(opt => (
          <MenuItem
            key={opt.id}
            onClick={async () => {
              if (selectedAccount) {
                await supabase
                  .from('profiles')
                  .update({ user_status_id: opt.id })
                  .eq('id', selectedAccount.id);
                await fetchAccounts();
              }
              handleCloseMenu();
            }}
          >
            {opt.status_name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
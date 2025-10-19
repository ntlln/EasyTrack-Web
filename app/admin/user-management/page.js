"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, MenuItem, TextField, Typography, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, TablePagination, TableSortLabel, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createUser } from './create-account/actions';

export default function Page() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [statusOptions, setStatusOptions] = useState([]);
  const [verifyStatusOptions, setVerifyStatusOptions] = useState([]);
  const [verifyStatusLoading, setVerifyStatusLoading] = useState(false);
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState('asc');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null });
  const [editForm, setEditForm] = useState({ user_status_name: '', verify_status_id: '', corporation_id: '' });
  const [createDialog, setCreateDialog] = useState({ open: false });
  const [createForm, setCreateForm] = useState({ email: "", role_id: "", corporation_id: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [corporations, setCorporations] = useState([]);

  const getEgcGheCorporation = () => {
    return corporations.find(c => (c.corporation_name || '').toLowerCase() === 'egc-ghe');
  };
  const getRoleNameById = (roleId) => {
    const role = roles.find(r => String(r.id) === String(roleId));
    return role ? (role.role_name || '') : '';
  };
  const isAdminOrDeliveryByRoleId = (roleId) => {
    const rn = getRoleNameById(roleId);
    return rn === 'Administrator' || rn === 'Delivery Personnel';
  };
  const isAirlineByRoleId = (roleId) => {
    const rn = getRoleNameById(roleId);
    return rn === 'Contractor' || rn === 'Airline';
  };

  useEffect(() => { fetchAccounts(); fetchStatusOptions(); fetchVerifyStatusOptions(); fetchUsers(); fetchRoles(); fetchCorporations(); }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select(`id, email, first_name, middle_initial, last_name, role_id, user_status_id, verify_status_id, corporation_id, profiles_status (status_name), profiles_roles (role_name), created_at, last_sign_in_at, updated_at`).order('created_at', { ascending: false });
      if (error) throw error;
      const formattedAccounts = data.map(account => ({
        id: account.id,
        name: `${account.first_name || ''} ${account.middle_initial || ''} ${account.last_name || ''}`.trim() || account.email,
        role: account.role_id === 3 ? 'Contractor' : (account.profiles_roles?.role_name || 'No Role'),
        role_id: account.role_id,
        email: account.email,
        status: account.profiles_status?.status_name || 'Inactive',
        user_status_id: account.user_status_id,
        verify_status_id: account.verify_status_id,
        created_at: account.created_at,
        last_sign_in_at: account.last_sign_in_at,
        updated_at: account.updated_at,
        corporation_id: account.corporation_id || ''
      }));
      setAccounts(formattedAccounts);
    } catch (error) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusOptions = async () => {
    const { data, error } = await supabase.from('profiles_status').select('id, status_name');
    if (!error && data) setStatusOptions(data.filter(opt => !['Online', 'Offline', 'Pending'].includes(opt.status_name)));
  };

  const fetchVerifyStatusOptions = async () => {
    try {
      setVerifyStatusLoading(true);
      const { data, error } = await supabase.from('verify_status').select('id, status_name');
      if (error) {
        setSnackbar({ open: true, message: 'Error fetching verification status options', severity: 'error' });
        return;
      }
      setVerifyStatusOptions(data || []);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error fetching verification status options', severity: 'error' });
    } finally {
      setVerifyStatusLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase.from('profiles').select(`id, email, role_id, profiles_roles (role_name)`);
      if (usersError) throw usersError;
      setUsers(usersData);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error fetching users', severity: 'error' });
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('profiles_roles').select('*');
      if (error) throw error;
      setRoles(data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error fetching roles', severity: 'error' });
    }
  };

  const fetchCorporations = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_corporation')
        .select('id, corporation_name')
        .order('corporation_name', { ascending: true });
      if (error) throw error;
      setCorporations(data || []);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error fetching corporations', severity: 'error' });
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || account.role === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleRequestSort = (property) => {
    if (orderBy === property) {
      if (order === 'asc') setOrder('desc');
      else if (order === 'desc') { setOrderBy(null); setOrder('asc'); }
    } else { setOrderBy(property); setOrder('asc'); }
  };

  const sortAccounts = (accounts) => {
    if (!orderBy) return accounts;
    return [...accounts].sort((a, b) => {
      const isAsc = order === 'asc';
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (typeof aValue === 'string' && typeof bValue === 'string') return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      if (typeof aValue === 'number' && typeof bValue === 'number') return isAsc ? aValue - bValue : bValue - aValue;
      if (!aValue) return isAsc ? -1 : 1;
      if (!bValue) return isAsc ? 1 : -1;
      return 0;
    });
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
  const handleOpenMenu = (event, account) => { setAnchorEl(event.currentTarget); setSelectedAccount(account); };
  const handleCloseMenu = () => { setAnchorEl(null); setSelectedAccount(null); };
  const handleEdit = () => { if (selectedAccount) router.push(`/admin/user-management/edit-account/${selectedAccount.id}`); handleCloseMenu(); };
  const handleDelete = async () => {
    if (selectedAccount) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', selectedAccount.id);
        if (error) throw error;
        fetchAccounts();
      } catch (error) {
        setError('Failed to delete account');
      }
    }
    handleCloseMenu();
  };
  const handleCreateAccount = () => setCreateDialog({ open: true });
  const handleRefresh = () => fetchAccounts();
  const handleSearchChange = (event) => { setSearchQuery(event.target.value); setPage(0); };
  const handleDepartmentChange = (event) => { setSelectedDepartment(event.target.value); setPage(0); };
  const handleMenuClick = (event, user) => { setAnchorEl(event.currentTarget); setSelectedAccount(user); };
  const handleEditClick = (accountParam) => {
    const acc = accountParam || selectedAccount;
    if (!acc) return;
    setEditDialog({ open: true, user: acc });
    const selectedStatus = statusOptions.find(opt => opt.id === acc.user_status_id);
    const selectedVerifyStatus = verifyStatusOptions.find(opt => opt.id === acc.verify_status_id);
    
    if (verifyStatusOptions.length === 0 && !verifyStatusLoading) {
      fetchVerifyStatusOptions();
    }
    
    const nextForm = {
      user_status_name: selectedStatus ? selectedStatus.status_name : '',
      verify_status_id: acc.verify_status_id || '',
      corporation_id: acc.corporation_id || ''
    };
    const egc = getEgcGheCorporation();
    const roleName = getRoleNameById(acc.role_id);
    if (egc && (roleName === 'Administrator' || roleName === 'Delivery Personnel')) {
      nextForm.corporation_id = String(egc.id);
    }
    setEditForm(nextForm);
    handleCloseMenu();
  };
  const handleDeleteClick = () => { setDeleteDialog({ open: true, userId: selectedAccount.id }); handleCloseMenu(); };
  const handleEditSubmit = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUserStatus',
          params: {
            userId: editDialog.user.id,
            statusName: editForm.user_status_name,
            verifyStatusId: editForm.verify_status_id,
            corporationId: editForm.corporation_id,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update status');
      setSnackbar({ open: true, message: 'User status updated successfully', severity: 'success' });
      await fetchAccounts();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating user status', severity: 'error' });
    } finally {
      setEditDialog({ open: false, user: null });
    }
  };
  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', deleteDialog.userId);
      if (error) throw error;
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      fetchAccounts();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error deleting user', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, userId: null });
    }
  };
  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));
  
  const handleCreateFormChange = (e) => setCreateForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  useEffect(() => {
    if (!createDialog.open) return;
    if (!createForm.role_id) return;
    const egc = getEgcGheCorporation();
    if (isAdminOrDeliveryByRoleId(createForm.role_id)) {
      if (egc && String(createForm.corporation_id) !== String(egc.id)) {
        setCreateForm(prev => ({ ...prev, corporation_id: String(egc.id) }));
      }
    } else if (isAirlineByRoleId(createForm.role_id)) {
      if (egc && String(createForm.corporation_id) === String(egc.id)) {
        setCreateForm(prev => ({ ...prev, corporation_id: '' }));
      }
    }
  }, [createDialog.open, createForm.role_id, corporations]);
  const handleCreateSubmit = async () => {
    if (!createForm.email || !createForm.role_id || !createForm.corporation_id) {
      setSnackbar({ open: true, message: "Please fill in all required fields", severity: 'error' });
      return;
    }
    
    setCreateLoading(true);
    try {
      await createUser(createForm);
      setSnackbar({ open: true, message: "Account created successfully! Login credentials have been sent to the user's email.", severity: 'success' });
      setCreateForm({ email: "", role_id: "", corporation_id: "" });
      setCreateDialog({ open: false });
      fetchAccounts(); // Refresh the accounts list
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "An error occurred during signup", severity: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };
  const handleCreateClose = () => {
    setCreateDialog({ open: false });
    setCreateForm({ email: "", role_id: "", corporation_id: "" });
  };

  const containerStyles = { display: "flex", flexDirection: "column", gap: 4 };
  const titleStyles = { color: "primary.main", fontWeight: "bold" };
  const titleContainerStyles = { display: "flex", alignItems: "center", gap: 1 };
  const searchContainerStyles = { display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" };
  const searchBoxStyles = { display: "flex", gap: 2 };
  const buttonContainerStyles = { display: "flex", gap: 2, ml: "auto" };
  const buttonStyles = { height: "50px", width: "170px" };
  const refreshButtonStyles = { height: "50px", width: "150px" };
  const searchFieldStyles = { width: "250px" };
  const departmentFieldStyles = { width: "200px" };
  const paginationContainerStyles = { display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 };
  const rowsPerPageStyles = { width: "120px" };
  const iconStyles = { mr: 1 };
  const dialogFieldStyles = { mt: 2 };
  const alertStyles = { width: '100%' };

  if (loading) return <Box p={4} display="flex" justifyContent="center" alignItems="center"><Typography>Loading...</Typography></Box>;
  if (error) return <Box p={4} display="flex" justifyContent="center" alignItems="center"><Typography color="error">{error}</Typography></Box>;

  const filteredAndSortedAccounts = sortAccounts(filteredAccounts);
  const totalPages = Math.ceil(filteredAndSortedAccounts.length / rowsPerPage);

  return (
    <Box sx={containerStyles}>
      <Box sx={titleContainerStyles}>
        <IconButton onClick={() => router.push('/admin')} size="small" color="primary">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h4" sx={titleStyles}>User Management</Typography>
      </Box>

      <Box sx={searchContainerStyles}>
        <Box sx={searchBoxStyles}>
          <TextField label="Search" sx={searchFieldStyles} value={searchQuery} onChange={handleSearchChange} placeholder="Search by name..." />
          <TextField label="All Departments" sx={departmentFieldStyles} select value={selectedDepartment} onChange={handleDepartmentChange}>
            <MenuItem value="All Departments">All Departments</MenuItem>
            <MenuItem value="Administrator">Administrator</MenuItem>
            <MenuItem value="Contractor">Contractor</MenuItem>
            <MenuItem value="Delivery Personnel">Delivery Personnel</MenuItem>
          </TextField>
        </Box>

        <Box sx={buttonContainerStyles}>
          <Button variant="contained" sx={buttonStyles} onClick={handleCreateAccount}>Create Account</Button>
          <Button variant="outlined" sx={refreshButtonStyles} onClick={handleRefresh}>Refresh</Button>
        </Box>
      </Box>

      <Box>
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200 }}>
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : undefined} onClick={() => handleRequestSort('id')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>ID</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : undefined} onClick={() => handleRequestSort('name')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>Name</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'email'} direction={orderBy === 'email' ? order : undefined} onClick={() => handleRequestSort('email')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>Email</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'role'} direction={orderBy === 'role' ? order : undefined} onClick={() => handleRequestSort('role')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>Role</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? order : undefined} onClick={() => handleRequestSort('status')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>Status</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'created_at'} direction={orderBy === 'created_at' ? order : undefined} onClick={() => handleRequestSort('created_at')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>Created At</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'last_sign_in_at'} direction={orderBy === 'last_sign_in_at' ? order : undefined} onClick={() => handleRequestSort('last_sign_in_at')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>Last Sign In</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}><TableSortLabel active={orderBy === 'updated_at'} direction={orderBy === 'updated_at' ? order : undefined} onClick={() => handleRequestSort('updated_at')} sx={{ color: 'white', '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>Updated At</TableSortLabel></TableCell>
                <TableCell sx={{ color: 'white' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedAccounts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.id}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{account.role}</TableCell>
                  <TableCell>{account.status}</TableCell>
                  <TableCell>{account.created_at ? new Date(account.created_at).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{account.last_sign_in_at ? new Date(account.last_sign_in_at).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{account.updated_at ? new Date(account.updated_at).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => router.push(`/admin/user-management/view-profile/${account.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => handleEditClick(account)}
                      >
                        Edit User
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredAndSortedAccounts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
            />
          </Box>
        </TableContainer>
      </Box>


      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Status" value={editForm.user_status_name} onChange={e => setEditForm(prev => ({ ...prev, user_status_name: e.target.value }))} sx={dialogFieldStyles}>
            {statusOptions.map((status) => <MenuItem key={status.id} value={status.status_name}>{status.status_name}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Verification Status" value={editForm.verify_status_id} onChange={e => setEditForm(prev => ({ ...prev, verify_status_id: e.target.value }))} sx={dialogFieldStyles} disabled={verifyStatusLoading}>
            {verifyStatusLoading ? (
              <MenuItem disabled>Loading verification status options...</MenuItem>
            ) : verifyStatusOptions.length > 0 ? (
              verifyStatusOptions.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.status_name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No verification status options available</MenuItem>
            )}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this user?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null })}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialog.open} onClose={handleCreateClose} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Account</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField 
              fullWidth 
              label="Email Address" 
              name="email" 
              type="email" 
              value={createForm.email} 
              onChange={handleCreateFormChange} 
              required 
            />
            <TextField 
              fullWidth 
              select 
              label="Role" 
              name="role_id" 
              value={createForm.role_id} 
              onChange={handleCreateFormChange} 
              required
            >
              <MenuItem value="" disabled>Select a role</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
              ))}
            </TextField>
            <TextField 
              fullWidth 
              select 
              label="Corporation" 
              name="corporation_id" 
              value={createForm.corporation_id} 
              onChange={handleCreateFormChange} 
              required
            >
              <MenuItem value="" disabled>Select a corporation</MenuItem>
              {(() => {
                const egc = getEgcGheCorporation();
                const rn = getRoleNameById(createForm.role_id);
                const isFixedEgc = egc && (rn === 'Administrator' || rn === 'Delivery Personnel');
                const list = isFixedEgc
                  ? (egc ? corporations.filter(c => String(c.id) === String(egc.id)) : corporations)
                  : corporations.filter(c => (c.corporation_name || '').toLowerCase() !== 'egc-ghe');
                return list.map((corp) => (
                  <MenuItem key={corp.id} value={corp.id}>{corp.corporation_name}</MenuItem>
                ));
              })()}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose} disabled={createLoading}>Cancel</Button>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained" 
            color="primary" 
            disabled={createLoading}
          >
            {createLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={alertStyles}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
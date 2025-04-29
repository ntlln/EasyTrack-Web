"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, MenuItem, TextField, Typography, Button, TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody, Paper,
  IconButton, Menu, Pagination
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function Page() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const accounts = [
    { id: "1", name: "John Doe", role: "IT", status: "Active" },
    { id: "2", name: "Jane Doe", role: "IT", status: "Active" },
    { id: "3", name: "Michael Scott", role: "Sales", status: "Inactive" },
    { id: "4", name: "Dwight Schrute", role: "Sales", status: "Active" },
    { id: "5", name: "Pam Beesly", role: "Receptionist", status: "Active" },
    { id: "6", name: "Jim Halpert", role: "Sales", status: "Active" },
    { id: "7", name: "Stanley Hudson", role: "Sales", status: "Inactive" },
    { id: "8", name: "Angela Martin", role: "Accounting", status: "Active" },
    { id: "9", name: "Kevin Malone", role: "Accounting", status: "Active" },
    { id: "10", name: "Oscar Martinez", role: "Accounting", status: "Active" },
    { id: "11", name: "Ryan Howard", role: "Temp", status: "Inactive" },
    { id: "12", name: "Kelly Kapoor", role: "Customer Service", status: "Active" },
    { id: "13", name: "Creed Bratton", role: "Quality Assurance", status: "Unknown" },
    { id: "14", name: "Toby Flenderson", role: "HR", status: "Active" },
    { id: "15", name: "Darryl Philbin", role: "Warehouse", status: "Active" },
  ];

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
    console.log("Edit", selectedAccount);
    handleCloseMenu();
  };

  const handleDelete = () => {
    console.log("Delete", selectedAccount);
    handleCloseMenu();
  };

  const handleCreateAccount = () => {
    router.push("/egc-admin/user-management/create-account");
  };

  const totalPages = Math.ceil(accounts.length / rowsPerPage);

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
          <TextField label="Search" sx={{ width: "250px" }} />
          <TextField label="All Departments" sx={{ width: "200px" }} select>
            <MenuItem value="All Departments">All Departments</MenuItem>
            <MenuItem value="IT Personnel">IT Personnel</MenuItem>
            <MenuItem value="Delivery Personnel">Delivery Personnel</MenuItem>
            <MenuItem value="Airline Staff">Airline Staff</MenuItem>
            <MenuItem value="Customer">Customer</MenuItem>
          </TextField>
        </Box>

        <Box display="flex" gap={2} ml="auto">
          <Button variant="contained" sx={{ width: "170px" }} onClick={handleCreateAccount}>
            Create Account
          </Button>
          <Button variant="outlined" sx={{ width: "150px" }}>
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
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.id}</TableCell>
                    <TableCell>{account.name}</TableCell>
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
            <TextField
              select
              label="Rows per page"
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              size="small"
              sx={{ width: "120px" }}
            >
              {[5, 10, 15].map((rows) => (
                <MenuItem key={rows} value={rows}>
                  {rows}
                </MenuItem>
              ))}
            </TextField>

            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={handleChangePage}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </TableContainer>
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Box>
  );
}
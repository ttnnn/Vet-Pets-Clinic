import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Button, Select, MenuItem, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, TablePagination, Snackbar, Alert 
} from '@mui/material';
import { styled } from '@mui/system';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const roles = ['เจ้าหน้าที่คลินิก', 'สัตวแพทย์'];

const api = 'http://localhost:8080/api/clinic';

const FormRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '20px',
});

const ManageRoles = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // State สำหรับ Dialog ยืนยันการลบ
  const [deleteAdminId, setDeleteAdminId] = useState(null); // เก็บ ID ของผู้ดูแลที่ต้องการลบ
  const [newAdmin, setNewAdmin] = useState({
    first_name: '',
    last_name: '',
    password_encrip: '',
    user_name: '',
    role: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const resetPage = () => setPage(0);
  
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleOldPasswordToggle = () => {
    setShowOldPassword(!showOldPassword);
  };

  const handleNewPasswordToggle = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleChangePasswordDialogOpen = () => {
    setChangePasswordDialogOpen(true);
  };
  
  const handleChangePasswordDialogClose = () => {
    setChangePasswordDialogOpen(false);
    setOldPassword('');
    setNewPassword('');
    setPasswordError('');
  };
  
  const handleChangePassword = async () => {
    if (!newAdmin.user_name || !oldPassword || !newPassword) {
      setPasswordError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
  
    try {
      // เรียก API เพื่อเปลี่ยนรหัสผ่าน
      const response = await axios.put(`${api} `, {
        user_name: newAdmin.user_name,
        oldPassword,
        newPassword,
      });
      if (response.status === 200) {
        console.log("Password changed successfully!");
        // Handle success, e.g., show a success message to the user
      } else {
        console.warn("Password change failed.");
        // Handle error, e.g., show an error message to the user
      }
  
      setSnackbar({ open: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ', severity: 'success' });
      handleChangePasswordDialogClose();
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', severity: 'error' });
    }
  };
  
    
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${api}/personnel`);
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
    resetPage();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    resetPage();
  };

  const handleDialogOpen = (mode, admin = null) => {
    if (mode === 'add') {
      setDialogOpen(true);
      setNewAdmin({
        first_name: '',
        last_name: '',
        user_name: '',
        password_encrip: '',
        role: '',
      });
    } else if (mode === 'edit') {
      setDialogOpen(true);
      setNewAdmin({
        personnel_id: admin.personnel_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        user_name: admin.user_name,
        role: admin.role,
        // password_encrip: '', 
      });
    }
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewAdmin({  
      first_name: '',
      last_name: '',
      user_name: '',
      password_encrip: '',
      role: '', });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin({ ...newAdmin, [name]: value });
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.first_name || !newAdmin.last_name || !newAdmin.role) {
    setSnackbar({ open: true, message: 'กรุณากรอกข้อมูลให้ครบ', severity: 'warning' });
    return;
  }
    try {
      // console.log('Adding new admin:', newAdmin); // ดูค่าที่บันทึก
      await axios.post(`${api}/personnel`, newAdmin);
      fetchAdmins();
      setSnackbar({ open: true, message: 'เพิ่มผู้ดูแลสำเร็จ!', severity: 'success' });
      handleDialogClose();
    } catch (error) {
      console.error('Error adding admin:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการเพิ่มผู้ดูแล', severity: 'error' });
    }
  };

  const handleUpdateAdmin = async () => {
    try {
      console.log('Updating admin:', newAdmin); // ดูค่าที่ถูกแก้ไข
      const response = await axios.put(`${api}/personnel/${newAdmin.personnel_id}`, newAdmin);
      if (response.status === 200) {
        // รีเฟรชข้อมูลผู้ดูแลจากฐานข้อมูล
        setAdmins((prevAdmins) => 
          prevAdmins.map((admin) => 
            admin.personnel_id === newAdmin.personnel_id ? { ...admin, ...newAdmin } : admin
          )
        );
        setSnackbar({ open: true, message: 'แก้ไขผู้ดูแลสำเร็จ!', severity: 'success' });
        handleDialogClose();
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการแก้ไขผู้ดูแล', severity: 'error' });
    }
  };
  
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${api}/personnel/${id}`);
      if (response.status === 200) {
        fetchAdmins();
        setSnackbar({ open: true, message: 'ลบผู้ดูแลสำเร็จ', severity: 'success' });
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการลบผู้ดูแล', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteAdminId(null);
    }
  };

  const confirmDelete = (id) => {
    setDeleteAdminId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteAdminId(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleEdit = (admin) => {
    setNewAdmin({
      personnel_id: admin.personnel_id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      user_name: admin.user_name,
      role: admin.role,
      // password_encrip: admin.password_encrip,
    });
    setDialogOpen(true);
  };

  const filteredAdmins = admins.filter((admin) =>
    (!selectedRole || admin.role === selectedRole) &&
    (!searchTerm || admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedAdmins = filteredAdmins.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={3} sx={{ p: 2}}>
        <Box p={3}>
        <Typography variant="h5" gutterBottom>
            จัดการสิทธิ์
        </Typography>
        <FormRow>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
            <Select
                value={selectedRole}
                onChange={handleRoleChange}
                displayEmpty
                variant="outlined"
                sx={{ minWidth: 200 }}
            >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {['เจ้าหน้าที่คลินิก', 'สัตวแพทย์'].map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
            </Select>

            <TextField
                placeholder="ค้นหาผู้ดูแล"
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                sx={{ flex: 1, minWidth: 250 }}
            />
            <Button variant="contained" onClick={() => handleDialogOpen('add')}>
                + เพิ่มผู้ดูแล
            </Button>      
            </Box>
        </FormRow>
        {loading ? (
            <Typography>กำลังโหลดข้อมูล...</Typography>
        ) : (
            <TableContainer component={Paper} sx={{ maxHeight: '600px', overflow: 'auto', borderRadius: 2, boxShadow: 3 }}>
            <Table stickyHeader>
            <TableHead>
                <TableRow>
                <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>ชื่อ</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}>นามสกุล</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}>ชื่อผู้ใช้</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}>บทบาท</TableCell>
                <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}></TableCell>
                </TableRow>
            </TableHead>
                <TableBody>
                {paginatedAdmins.map((admin) => (
                    <TableRow
                    key={admin.personnel_id}
                    sx={{
                    '&:hover': { backgroundColor: '#e0f7fa' },
                    }}
                    >
                    <TableCell align="center">{admin.first_name}</TableCell>
                    <TableCell align="center">{admin.last_name}</TableCell>
                    <TableCell align="center">{admin.user_name}</TableCell>
                    <TableCell align="center">{admin.role}</TableCell>
                    <TableCell align="center">
                        <IconButton onClick={() => handleEdit(admin)}>
                        <EditIcon color="primary" />
                        </IconButton>
                        <IconButton onClick={() => confirmDelete(admin.personnel_id)}>
                        <DeleteIcon color="error"/>
                        </IconButton>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        )}

        <TablePagination
            rowsPerPageOptions={[10, 25]}
            component="div"
            count={filteredAdmins.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
        </Box>
    {/* Add Admin Dialog */}
    <Dialog open={dialogOpen} onClose={handleDialogClose}  PaperProps={{
                style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: 0,
            },
            }}
            maxWidth="sm"
            fullWidth >
            
        <DialogTitle>
        {newAdmin.personnel_id ? 'แก้ไขผู้ดูแล' : 'เพิ่มผู้ดูแล'}
        </DialogTitle>

        <DialogContent>
        <Select
            value={newAdmin.role}
            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
            displayEmpty
            renderValue={(selected) => {
            if (!selected) {
                return 'เลือกบทบาท';
            }
            return selected;
            }}
            variant="outlined"
            sx={{ display: 'flex'}}
        >
            <MenuItem value="">เลือกบทบาท</MenuItem>
            {roles.map((role) => (
            <MenuItem key={role} value={role}>
                {role}
            </MenuItem>
            ))}
        </Select>           

        <TextField
            label="ชื่อ"
            variant="outlined"
            name="first_name"
            value={newAdmin.first_name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
        />
        <TextField
            label="นามสกุล"
            variant="outlined"
            name="last_name"
            value={newAdmin.last_name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
        />
        <TextField
            label="ชื่อผู้ใช้"
            variant="outlined"
            name="user_name"
            value={newAdmin.user_name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
        />
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <TextField
            label="รหัสผ่าน"
            variant="outlined"
            name="password_encrip"
            value={newAdmin.password_encrip}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            type={showPassword ? 'text' : 'password'}
            disabled={newAdmin.personnel_id} // ถ้ามี personnel_id หมายถึงโหมดแก้ไข
        />
            <IconButton
        onClick={togglePasswordVisibility}
        sx={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
        }}
        >
        {showPassword ? <Visibility /> : <VisibilityOff />}
        </IconButton>
        </Box>

        </DialogContent>
        <Dialog open={changePasswordDialogOpen} onClose={handleChangePasswordDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
        <DialogContent>
            <TextField
            margin="dense"
            label="ชื่อผู้ใช้"
            type="text"
            fullWidth
            sx={{ marginBottom: 2 }}
            value={newAdmin.user_name}
            onChange={(e) => setNewAdmin({ ...newAdmin, user_name: e.target.value })}
            />
            <TextField
            label="รหัสผ่านเก่า"
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
            InputProps={{
                endAdornment: (
                <IconButton onClick={handleOldPasswordToggle} edge="end">
                    {showOldPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
                ),
            }}
        />
            <TextField
            label="รหัสผ่านใหม่"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
            InputProps={{
                endAdornment: (
                <IconButton onClick={handleNewPasswordToggle} edge="end">
                    {showNewPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
                ),
            }}
            />      
            {passwordError && <Typography color="error">{passwordError}</Typography>}
        </DialogContent>

        <DialogActions>
            <Button onClick={handleChangePasswordDialogClose}>ยกเลิก</Button>
            <Button onClick={handleChangePassword} variant="contained" color="primary">
                เปลี่ยนรหัสผ่าน
            </Button>
        </DialogActions>
    </Dialog>

    {dialogOpen && newAdmin.personnel_id && (
        <Typography
        onClick={handleChangePasswordDialogOpen}
        style={{
            color: '#1976d2',
            cursor: 'pointer',
            textDecoration: 'underline',
            marginLeft: '22px' // ขยับไปทางขวา
        }}
        >
        เปลี่ยนรหัสผ่าน
        </Typography>
    )}

        <DialogActions>
        <Button onClick={handleDialogClose} color="primary">
            ยกเลิก
        </Button>
        <Button
            onClick={newAdmin.personnel_id ? handleUpdateAdmin : handleAddAdmin}
            color="primary"
            variant="contained"
        >
            {newAdmin.personnel_id ? 'บันทึก' : 'เพิ่ม'}
        </Button>
        </DialogActions>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>ยืนยันการลบผู้ดูแล</DialogTitle>
        <DialogContent>
        <Typography>คุณต้องการลบรายการนี้หรือไม่?</Typography>
        </DialogContent>
        <DialogActions>
        <Button onClick={handleDeleteCancel} >ยกเลิก</Button>
        <Button onClick={() => handleDelete(deleteAdminId)} color="error">ลบ</Button>
        </DialogActions>
    </Dialog>

    <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
    >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
        {snackbar.message}
        </Alert>
    </Snackbar>
    
    </Paper>
  );
};

export default ManageRoles;

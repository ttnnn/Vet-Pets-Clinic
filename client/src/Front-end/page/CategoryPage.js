import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Button, Select, MenuItem, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, TablePagination, Snackbar, Alert 
} from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const api = 'http://localhost:8080/api/clinic';
const CategoryContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
}));

const FormRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '20px',
});

const CategoryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // State สำหรับ Dialog ยืนยันการลบ
  const [deleteCategoryId, setDeleteCategoryId] = useState(null); // เก็บ ID ของรายการที่จะลบ
  const [newCategory, setNewCategory] = useState({
    category_type: '',
    category_name: '',
    price_service: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const resetPage = () => setPage(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${api}/servicecategory`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    resetPage();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    resetPage();
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewCategory({ category_type: '', category_name: '', price_service: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory({ ...newCategory, [name]: value });
  };

  const handleAddCategory = async () => {
    let price = parseFloat(newCategory.price_service);
    if (isNaN(price)) {
      setSnackbar({ open: true, message: 'กรุณากรอกค่าบริการเป็นตัวเลข', severity: 'warning' });
      return;
    }
    price = price.toFixed(2);

    const updatedCategory = { ...newCategory, price_service: price };

    try {
      await axios.post(`${api}/servicecategory`, updatedCategory);
      fetchCategories();
      setSnackbar({ open: true, message: 'เพิ่มข้อมูลสำเร็จ!', severity: 'success' });
      handleDialogClose();
    } catch (error) {
      console.error('Error adding category:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล', severity: 'error' });
    }
  };

  const handleUpdateCategory = async () => {
    let price = parseFloat(newCategory.price_service);
    if (isNaN(price)) {
      setSnackbar({ open: true, message: 'กรุณากรอกค่าบริการเป็นตัวเลข', severity: 'warning' });
      return;
    }
    price = price.toFixed(2);

    const updatedCategory = { ...newCategory, price_service: price };

    try {
      const response = await axios.put(`${api}/servicecategory/${newCategory.category_id}`, updatedCategory);
      if (response.status === 200) {
        setCategories(prevCategories => prevCategories.map(category =>
          category.category_id === newCategory.category_id ? updatedCategory : category
        ));
        setSnackbar({ open: true, message: 'แก้ไขข้อมูลสำเร็จ!', severity: 'success' });
        handleDialogClose();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${api}/servicecategory/${id}`);
      if (response.status === 200) {
        fetchCategories();
        setSnackbar({ open: true, message: 'ลบรายการสำเร็จ', severity: 'success' });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการลบ', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteCategoryId(null);
    }
  };

  const confirmDelete = (id) => {
    setDeleteCategoryId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteCategoryId(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleEdit = (service) => {
    setNewCategory({
      category_id: service.category_id,
      category_type: service.category_type,
      category_name: service.category_name,
      price_service: service.price_service,
    });
    setDialogOpen(true);
  };

  const filteredCategories = categories.filter(service => 
    (!selectedCategory || service.category_type === selectedCategory) &&
    (!searchTerm || service.category_name.includes(searchTerm))
  );

  const paginatedCategories = filteredCategories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box display="flex"  sx={{height: '100%', width: '100%', minHeight: '100vh', backgroundColor: '#e0e0e0'}} >
      <Sidebar />
      <CategoryContainer>
        <Paper sx={{ width: '100%' }}>
          <Box p={3}>
            <Typography variant="h4" gutterBottom>
              หมวดหมู่บริการ
            </Typography>
            <FormRow>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  displayEmpty
                  variant="outlined"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {[...new Set(categories.map(cat => cat.category_type))].map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>

                <TextField
                  placeholder="ค้นหาบริการ"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  variant="outlined"
                  sx={{ flex: 1, minWidth: 250 }}
                />
                <Button variant="contained" onClick={handleDialogOpen}>
                  + เพิ่มรายการ
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
                    <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>รหัส</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}>หมวดหมู่</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}>ชื่อบริการ</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}>ค่าบริการ</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px'  }}>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                  <TableBody>
                    {paginatedCategories.map((service) => (
                      <TableRow
                      key={service.category_id}
                      sx={{
                        '&:hover': { backgroundColor: '#e0f7fa' },
                      }}
                      >
                        <TableCell align="center">{service.category_id}</TableCell>
                        <TableCell align="center">{service.category_type}</TableCell>
                        <TableCell align="center">{service.category_name}</TableCell>
                        <TableCell align="center">{service.price_service}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleEdit(service)}>
                            <EditIcon color="primary" />
                          </IconButton>
                          <IconButton onClick={() => confirmDelete(service.category_id)}>
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
              count={filteredCategories.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Paper>

        {/* Dialog for adding a new category */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} PaperProps={{
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
          <DialogTitle> {newCategory.category_id ? 'แก้ไขหมวดหมู่บริการ' : 'เพิ่มหมวดหมู่บริการ'}</DialogTitle>
          <DialogContent>
            <Select
              value={newCategory.category_type}
              onChange={(e) => setNewCategory({ ...newCategory, category_type: e.target.value })}
              name="category_type"
              fullWidth
              displayEmpty
            >
              <MenuItem value="">เลือกหมวดหมู่</MenuItem>
              {[...new Set(categories.map((cat) => cat.category_type))].map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>

            <TextField
              label="ชื่อบริการ"
              name="category_name"
              value={newCategory.category_name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="ค่าบริการ"
              name="price_service"
              value={newCategory.price_service}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>ยกเลิก</Button>
            <Button onClick={newCategory.category_id ? handleUpdateCategory : handleAddCategory}
             color="primary"
             variant="contained"
            >
              {newCategory.category_id ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog ยืนยันการลบ */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
          <DialogContent>
            <Typography>คุณต้องการลบรายการนี้หรือไม่?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>ยกเลิก</Button>
            <Button onClick={() => handleDelete(deleteCategoryId)} color="error">
              ลบ
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ 
            vertical: 'bottom', 
            horizontal: 'left' 
          }}
          sx={{
            "& .MuiSnackbarContent-root": {
              width: "400px", // ปรับความกว้าง
              fontSize: "16px", // ปรับขนาดข้อความ
              padding: "12px", // เพิ่มระยะขอบใน
            },
          }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CategoryContainer>
    </Box>
  );
};

export default CategoryPage;

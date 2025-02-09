import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Button, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, TablePagination, Snackbar, Alert,
  Checkbox, FormGroup, FormControlLabel, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { styled } from '@mui/system';
import { clinicAPI } from "../../utils/api";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย


dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

const FormRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '20px',
});

const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY'); // Use day.js for formatting
  };

const ManageHolidays = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); 
  const [deleteHolidayId, setDeleteHolidayId] = useState(null); 
  const [newHoliday, setNewHoliday] = useState({
    date_start: '',
    date_end: '',
    dayoff_note: '',
    dayoff_id: '',
    dayoff_type: '', // 'temporary', or 'weekly'
    recurring_days: [], // Array for recurring days ['Monday', 'Wednesday']
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  // Handle checkbox change
  const handleCheckboxChange = (day) => {
    setNewHoliday((prev) => {
        const days = (prev.recurring_days || []).includes(day)
            ? (prev.recurring_days || []).filter((d) => d !== day)
            : [...(prev.recurring_days || []), day];
        return { ...prev, recurring_days: days };
    });
};


  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const resetPage = () => setPage(0);

  useEffect(() => {
    fetchHolidays();
  }, []);
  
  const fetchHolidays = async () => {
    try {
      const response = await clinicAPI.get(`/dayoff`);
      const data = response.data.map((holiday) => {
        let recurringDays = [];
        try {
          // ตรวจสอบว่า recurring_days เป็น JSON string และสามารถแปลงได้
          recurringDays = Array.isArray(holiday.recurring_days)
            ? holiday.recurring_days
            : holiday.recurring_days && typeof holiday.recurring_days === 'string'
            ? JSON.parse(holiday.recurring_days)
            : [];
        } catch (e) {
          console.error('Error parsing recurring_days:', e);
          recurringDays = []; // ถ้าเกิดข้อผิดพลาดในการแปลงเป็น array ให้ใช้ array ว่าง
        }
  
        return {
          ...holiday,
          recurring_days: recurringDays,
        };
      });
      setHolidays(data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลวันหยุด', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };
  

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    resetPage();
  };

  const handleDialogOpen = (mode, holiday = null) => {
    if (mode === 'add') {
      setDialogOpen(true);
      setNewHoliday({
        date_start: '',
        date_end: '',
        dayoff_note: '',
        dayoff_type: '', // Start with an empty value
        recurring_days: [],
      });
    } else if (mode === 'edit') {
      setDialogOpen(true);
      setNewHoliday({
        dayoff_id: holiday.dayoff_id,
        date_start: dayjs(holiday.date_start).format('YYYY-MM-DD'),
        date_end: dayjs(holiday.date_end).format('YYYY-MM-DD'),
        dayoff_note: holiday.dayoff_note,
        recurring_days: holiday.recurring_days,
        dayoff_type: holiday.dayoff_type,
      });
    }
  };
  

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewHoliday({ date_start: '',date_end: '', dayoff_note: '', dayoff_type:'', recurring_days: ''  });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHoliday({ ...newHoliday, [name]: value });
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.dayoff_type || !newHoliday.dayoff_note) {
      setSnackbar({ open: true, message: 'กรุณากรอกข้อมูลให้ครบ', severity: 'warning' });
      return;
    }
  
    if (newHoliday.dayoff_type === 'temporary') {
      if (!newHoliday.date_start || !newHoliday.date_end) {
        setSnackbar({ open: true, message: 'กรุณากรอกวันที่เริ่มต้นและวันที่สิ้นสุด', severity: 'warning' });
        return;
      }
    } else if (newHoliday.dayoff_type === 'weekly') {
      if (newHoliday.recurring_days.length === 0) {
        setSnackbar({ open: true, message: 'กรุณาเลือกวันหยุดประจำสัปดาห์', severity: 'warning' });
        return;
      }
    }
  
    // กำหนดค่าเริ่มต้นสำหรับ recurring_days
    const holidayData = {
      ...newHoliday,
      recurring_days: JSON.stringify(newHoliday.recurring_days), // แปลง recurring_days เป็น JSON string
      date_start: newHoliday.dayoff_type === 'weekly' ? '1970-01-01' : newHoliday.date_start, // ค่าเริ่มต้น
      date_end: newHoliday.dayoff_type === 'weekly' ? '9999-12-31' : newHoliday.date_end,     // ค่าเริ่มต้น
    };
  
    try {
      if (newHoliday.dayoff_id) {
        await clinicAPI.put(`/dayoff/${newHoliday.dayoff_id}`, holidayData);
        setSnackbar({ open: true, message: 'แก้ไขวันหยุดสำเร็จ!', severity: 'success' });
      } else {
        await clinicAPI.post(`/dayoff`, holidayData);
        setSnackbar({ open: true, message: 'เพิ่มวันหยุดสำเร็จ!', severity: 'success' });
      }
      fetchHolidays();
      handleDialogClose();
    } catch (error) {
      console.error('Error adding/updating holiday:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการเพิ่ม/แก้ไขวันหยุด', severity: 'error' });
    }
  };


  const handleUpdateHoliday = async () => {
    try {
      const response = await clinicAPI.put(`/dayoff/${newHoliday.dayoff_id}`, newHoliday);
      if (response.status === 200) {
        setHolidays((prevHolidays) =>
          prevHolidays.map((holiday) =>
            holiday.dayoff_id === newHoliday.dayoff_id ? { ...holiday, ...newHoliday } : holiday
          )
        );
        setSnackbar({ open: true, message: 'แก้ไขวันหยุดสำเร็จ!', severity: 'success' });
        handleDialogClose();
      }
    } catch (error) {
      console.error('Error updating holiday:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการแก้ไขวันหยุด', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await clinicAPI.delete(`/dayoff/${id}`);
      fetchHolidays();
      setSnackbar({ open: true, message: 'ลบวันหยุดสำเร็จ', severity: 'success' });
    } catch (error) {
      console.error('Error deleting holiday:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการลบวันหยุด', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteHolidayId(null);
    }
  };

  const confirmDelete = (id) => {
    setDeleteHolidayId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteHolidayId(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredHolidays = holidays.filter((holiday) =>
    !searchTerm || holiday.dayoff_note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedHolidays = filteredHolidays.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          จัดการวันหยุด
        </Typography>
        <FormRow>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
            <TextField
              placeholder="ค้นหาวันหยุด"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              sx={{ flex: 1, minWidth: 250 }}
            />
            <Button variant="contained" onClick={() => handleDialogOpen('add')}>
              + เพิ่มวันหยุด
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
                  <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>ชื่อวันหยุด</TableCell>
                  <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>วันที่หยุด</TableCell>
                  <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>ประเภทวันหยุด</TableCell>
                  <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedHolidays.map((holiday) => (
                    <TableRow key={holiday.dayoff_id} sx={{ '&:hover': { backgroundColor: '#e0f7fa' } }}>
                    <TableCell align="center">{holiday.dayoff_note}</TableCell>
                    <TableCell align="center">
                        {holiday.dayoff_type === 'weekly' 
                        ? holiday.recurring_days.join(', ') // แสดง recurring_days เป็นข้อความ
                        : holiday.date_start === holiday.date_end
                        ? formatDate(holiday.date_start) //  ถ้าเป็นวันเดียวกันให้แสดงแค่วันที่เริ่มต้น
                        : `${formatDate(holiday.date_start)} - ${formatDate(holiday.date_end)}`} {/* แสดงช่วงวันที่สำหรับวันหยุดเฉพาะกิจ */}
                    </TableCell>
                    <TableCell align="center">
                        {holiday.dayoff_type === 'weekly' ? 'วันหยุดประจำสัปดาห์' : 'วันหยุดเฉพาะกิจ'}
                    </TableCell>
                    <TableCell align="center">
                        <IconButton onClick={() => handleDialogOpen('edit', holiday)}><EditIcon color="primary"/></IconButton>
                        <IconButton onClick={() => confirmDelete(holiday.dayoff_id)}><DeleteIcon color="error"/></IconButton>
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
          count={filteredHolidays.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />

        <Dialog open={dialogOpen} onClose={handleDialogClose} >
          <DialogTitle>{newHoliday.dayoff_id ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด'}</DialogTitle>
          <DialogContent>
            <TextField
                label="ชื่อวันหยุด"
                fullWidth
                variant="outlined"
                value={newHoliday.dayoff_note}
                name="dayoff_note"
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2, mt: 1 }}
                
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>ประเภทวันหยุด</InputLabel>
            <Select
                name="dayoff_type"
                value={newHoliday.dayoff_type}
                onChange={handleInputChange}
                label="ประเภทวันหยุด"
                sx={{ mb: 2, mt: 1 }}
            >
                <MenuItem value="temporary">หยุดเฉพาะกิจ</MenuItem>
                <MenuItem value="weekly">หยุดประจำทุกสัปดาห์</MenuItem>
            </Select>
            </FormControl>

            {newHoliday.dayoff_type === 'weekly' && (
                <FormGroup row sx={{ mb: 2 }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <FormControlLabel
                    key={day}
                    control={
                        <Checkbox
                        checked={newHoliday.recurring_days.includes(day)}
                        onChange={() => handleCheckboxChange(day)}
                        />
                    }
                    label={day}
                    />
                ))}
                </FormGroup>
            )}

            {newHoliday.dayoff_type === 'temporary' && (
                <>
                <TextField
                    label="เริ่มวันหยุด"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={newHoliday.date_start}
                    name="date_start"
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="สิ้นสุดวันหยุด"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={newHoliday.date_end}
                    name="date_end"
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                />
                </>
            )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleDialogClose}>ยกเลิก</Button>
                <Button onClick={newHoliday.dayoff_id ? handleUpdateHoliday : handleAddHoliday} color="primary">
                {newHoliday.dayoff_id ? 'บันทึก' : 'เพิ่ม'}
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
          <DialogContent>
            <Typography variant="body1">คุณแน่ใจหรือไม่ว่าต้องการลบวันหยุดนี้?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>ยกเลิก</Button>
            <Button onClick={() => handleDelete(deleteHolidayId)} color="error">
              ลบ
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Paper>
  );
};

export default ManageHolidays;

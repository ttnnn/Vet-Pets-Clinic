import React, {  useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Tabs, Tab,Dialog, DialogActions, 
  DialogContent, DialogTitle,Typography ,Snackbar,Alert, AlertTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Postpone from './PostponeAppointment'; 

const api = 'http://localhost:8080';

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover': {
    color: '#40a9ff',
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'black',
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

const categories = ['ทั้งหมด', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา','ฝากเลี้ยง','วัคซีน'];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


const TableAppointments = ({ appointments, searchQuery, setSearchQuery,setAppointments }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [openPostponeDialog, setOpenPostponeDialog] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedTypeService, setSelectedTypeService] = useState(null);
  const [openDialog , setOpenDialog] = useState(false)
  const [approveAppointmentId, setApproveAppointmentId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openCancelDialog, setOpenCancelDialog] = useState(false); // New state for cancel dialog
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);

  const handlePostponeClick = (appointmentId,typeService) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedTypeService(typeService);
    setOpenPostponeDialog(true);

    console.log('appointment;',appointmentId)
    console.log('typeService;',typeService)
  };

  const updateAppointments = () => {
    axios.get(`${api}/appointment`) // Assuming a GET endpoint to fetch all appointments
      .then((response) => setAppointments(response.data))
      .catch((error) => console.error('Error fetching updated appointments:', error));
  };

  //เปิดให้กดยืนยันการอนุมัติ
  const handleApproveClick = (AppointmentID) => {
    setApproveAppointmentId(AppointmentID);
    setOpenDialog(true);  
    setOpenCancelDialog(false);
  };
   //เปิดให้กดยืนยันยกเลิก
  const handleCancelClick = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setOpenCancelDialog(true); 
    setOpenDialog(false);
  };
  //เปิดให้กดยืนยันยกเลิก
  const handleConfirmCancel = () => {
    deleteAppointment(cancelAppointmentId);
    setOpenCancelDialog(false);
    setOpenDialog(false);
    updateAppointments()
  };
 //เปิดให้กดยืนยันการอนุมัติ
  const handleConfirmApprove = () => {
    try {
      // Update the status to 'Approved' in the database
      axios.put(`${api}/appointment/${approveAppointmentId}`, {
        status: 'approved',
        queue_status: 'รอรับบริการ'
      });
      updateAppointments()
      setSnackbarMessage(`การอนุมัตินัดหมายหมายเลข ${approveAppointmentId} เสร็จสิ้น!`);
      setSnackbarSeverity('success'); 
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to approve appointment:', error);
    }
    setOpenDialog(false);
    updateAppointments()
  }; 

  
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  
  
  const deleteAppointment = (AppointmentID) => {
    console.log("Deleting appointment with ID:", AppointmentID);
    axios.delete(`${api}/deleted/appointment/${AppointmentID}`)
      .then(() => {
        // Update the list of appointments after successful deletion
        setAppointments(appointments.filter(appt => appt.appointment_id !== AppointmentID));
        setSnackbarMessage(`การยกเลิกนัดหมายหมายเลข ${cancelAppointmentId} เสร็จสิ้น!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      })
      .catch((error) => {
        console.log("Deleting :", AppointmentID);
        console.error('Error deleting appointment:', error);
        alert('Failed to delete the appointment');
      });
  };


  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  //คิวที่ผ่านมาแล้วจะไม่แสดงปุ่มเลื่อน,ยกเลิก
  const isAppointmentInPast = (appointmentDate) => {
    const today = new Date(); // Current date
    const appointmentDateObj = new Date(appointmentDate);
    return appointmentDateObj < today; // Check if appointment date is in the past
  };
  
  

  const filteredAppointments = appointments.filter(appointment => {
    const categoryMatch = activeCategory === 'ทั้งหมด' || appointment.type_service === activeCategory;
    const searchMatch = 
      appointment.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
     
    return categoryMatch && searchMatch  ;
  });
  // console.log(filteredAppointments)
  // console.log('Rendered appointments:', appointments);
  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map(category => (
            <StyledTab key={category} label={category} value={category} />
          ))}
        </Tabs>
      </Box>

      <Box display="flex" alignItems="center" mt={2} mb={2}>
        <TextField
          label="ค้นหานัดหมาย"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, mr: 2 }}
        />
        <Button variant="contained" color="primary">ค้นหา</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'appointment_date'}
                  direction={orderBy === 'appointment_date' ? order : 'asc'}
                  onClick={(event) => handleRequestSort(event, 'appointment_date')}
                >
                  วันที่นัดหมาย
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'appointment_time'}
                  direction={orderBy === 'appointment_time' ? order : 'asc'}
                  onClick={(event) => handleRequestSort(event, 'appointment_time')}
                >
                  เวลา
                </TableSortLabel>
              </TableCell>
              <TableCell>ชื่อสัตว์</TableCell>
              <TableCell>ชื่อเจ้าของ</TableCell>
              <TableCell>ประเภทนัดหมาย</TableCell>
              <TableCell>นัดมา</TableCell>
              <TableCell>รายละเอียด</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                <TableCell>{appointment.appointment_time|| 'all-day'}</TableCell>
                <TableCell>{appointment.pet_name}</TableCell>
                <TableCell>{appointment.full_name}</TableCell>
                <TableCell>{appointment.type_service}</TableCell>
                <TableCell>{appointment.detail_service || '-'}</TableCell>
                <TableCell>{appointment.reason || '-'}</TableCell>
                <TableCell>{appointment.status}</TableCell>
                
                <TableCell>
                  {appointment.status === 'waiting' && (
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => handleApproveClick(appointment.appointment_id)}
                    >
                      อนุมัติ
                    </Button>
                  )}
                  {appointment.status ==='approved'  && !isAppointmentInPast(appointment.appointment_date) &&(
                  <>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => handleCancelClick(appointment.appointment_id)}
                    >
                    ยกเลิกนัด
                    </Button> 
                    <Button
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => handlePostponeClick(appointment.appointment_id, appointment.type_service)}
                    >  เลื่อนนัด
                    </Button> 
                    {selectedAppointmentId && (
                      <Postpone
                        open={openPostponeDialog}
                        handleClose={() => setOpenPostponeDialog(false)}
                        appointmentId={selectedAppointmentId}
                        TypeService= {selectedTypeService}
                        updateAppointments={updateAppointments}
                       />
                     )}
                    
                  </>                    
                  )}
                     
                </TableCell>
              </TableRow>  
            ))}
          </TableBody>
        </Table>
      </TableContainer>
       {/* Confirmation Dialog */}
        <Dialog open={openDialog} onClose={handleDialogClose}>
          <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
          <DialogContent>
            <Typography>คุณแน่ใจหรือไม่ว่าต้องการอนุมัตินัดหมายหมายเลข {approveAppointmentId} นี้?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="error">ยกเลิก</Button>
            <Button onClick={handleConfirmApprove} color="primary">ยืนยัน</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle>ยืนยันการยกเลิกนัดหมาย</DialogTitle>
        <DialogContent>
          <Typography>คุณแน่ใจหรือไม่ว่าต้องการยกเลิกนัดหมายหมายเลข {cancelAppointmentId} นี้?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)} color="error">ยกเลิก</Button>
          <Button onClick={handleConfirmCancel} color="primary">ยืนยัน</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          <AlertTitle>{snackbarSeverity === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}</AlertTitle>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TableAppointments;

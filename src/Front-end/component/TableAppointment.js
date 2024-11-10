import React, {  useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Tabs, Tab,
  Dialog, DialogActions, 
  DialogContent, DialogTitle,Typography ,Snackbar,Alert, AlertTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Postpone from './PostponeAppointment'; 
import PostponeHotel from './PostponeHotel';
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย

dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย


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
  return dayjs(dateString).format('DD/MM/YYYY'); // Use day.js for formatting
};

const TableAppointments = ({ appointments, searchQuery, setSearchQuery,setAppointments }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [openPostponeDialog, setOpenPostponeDialog] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedTypeService, setSelectedTypeService] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(null); // State for pet_id
  const [openDialog , setOpenDialog] = useState(false);
  const [approveAppointmentId, setApproveAppointmentId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);

  const handlePostponeClick = (appointmentId, typeService, petId) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedTypeService(typeService);
    setSelectedPetId(petId); // Store pet_id
    setOpenPostponeDialog(true);

    console.log('appointment:', appointmentId);
    console.log('typeService:', typeService);
    console.log('petId:', petId);
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
      // Update the status to 'อนุมัติ' in the database
      axios.put(`${api}/appointment/${approveAppointmentId}`, {
        status: 'อนุมัติ',
        queue_status: 'รอรับบริการ'
      }).then(()=>{
        updateAppointments()
        setSnackbarMessage(`การอนุมัตินัดหมายหมายเลข ${approveAppointmentId} เสร็จสิ้น!`);
        setSnackbarSeverity('success'); 
        setSnackbarOpen(true);
      })
      
    } catch (error) {
      console.error('Failed to approve appointment:', error);
    }
    setOpenDialog(false);
  }; 

  
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  
  
  const deleteAppointment = (AppointmentID) => {
    console.log("Deleting appointment with ID:", AppointmentID);
    axios.put(`${api}/appointment/${AppointmentID}`,{
       status: 'ยกเลิกนัด',
       queue_status: 'ยกเลิกนัด'
    })
      .then(() => {
        // Update the list of appointments after successful deletion
        updateAppointments()
        setSnackbarMessage(`การยกเลิกนัดหมายหมายเลข ${cancelAppointmentId} เสร็จสิ้น!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      })
      .catch((error) => {
        console.log("Deleting :", AppointmentID);
        console.error('Error deleting appointment:', error);
        setSnackbarSeverity('error');
      });
  };


  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  //คิวที่ผ่านมาแล้วจะไม่แสดงปุ่มเลื่อน,ยกเลิก
  const isAppointmentInPast = (appointmentDate) => {
    const today = dayjs();// Current date
    const appointmentDateObj = dayjs(appointmentDate);
    return appointmentDateObj.isBefore(today);
  }
  
  

  const filteredAppointments = appointments.filter(appointment => {
    // console.log('Active category:', activeCategory);
    const categoryMatch = activeCategory === 'ทั้งหมด' || appointment.type_service.trim() === activeCategory.trim();
    const searchMatch = 
      appointment.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
     
    return categoryMatch && searchMatch  ;
  });
 
 
  // console.log(filteredAppointments)
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
                <TableCell>{appointment.appointment_time|| 'ตลอดทั้งวัน'}</TableCell>
                <TableCell>{appointment.pet_name}</TableCell>
                <TableCell>{appointment.full_name}</TableCell>
                <TableCell>{appointment.type_service}</TableCell>
                <TableCell>{appointment.detail_service || '-'}</TableCell>
                <TableCell>{appointment.reason || '-'}</TableCell>
                <TableCell>{appointment.status}</TableCell>
                
                <TableCell>
                {appointment.status === 'รออนุมัติ' ? (
                    new Date() <= new Date(appointment.appointment_date) ? (
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        onClick={() => handleApproveClick(appointment.appointment_id)}
                      >
                        อนุมัติ
                      </Button>
                    ) : (
                      <Box 
                        bgcolor="error.main" 
                        color="white" 
                        p={1} 
                        borderRadius={1}
                      >
                        <Typography variant="body2">
                          เลยกำหนดเวลานัดหมายแล้ว
                        </Typography>
                      </Box>
                    )
                  ) : null}

                  {appointment.status ==='อนุมัติ'  && !isAppointmentInPast(appointment.appointment_date) &&(
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
                      onClick={() => handlePostponeClick(appointment.appointment_id, appointment.type_service,  appointment.pet_id )}
                    >  เลื่อนนัด
                    </Button> 
                    {selectedAppointmentId && (
                      selectedTypeService === 'ฝากเลี้ยง' ? (
                        <PostponeHotel
                          open={openPostponeDialog}
                          handleClose={() => setOpenPostponeDialog(false)}
                          appointmentId={selectedAppointmentId}
                          petId={selectedPetId} // Pass petId
                          updateAppointments={updateAppointments}
                          
                        />
                      ) : (
                        <Postpone
                          open={openPostponeDialog}
                          handleClose={() => setOpenPostponeDialog(false)}
                          appointmentId={selectedAppointmentId}
                          TypeService={selectedTypeService}
                          updateAppointments={updateAppointments}
                        />
                      )
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

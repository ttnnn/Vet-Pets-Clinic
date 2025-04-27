import React, {  useState,useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Tabs, Tab,
  Dialog, DialogActions, 
  DialogContent, DialogTitle,Typography ,Snackbar,Alert, AlertTitle,TablePagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Postpone from './PostponeAppointment'; 
import PostponeHotel from './PostponeHotel';
import sendLineMessage from './sendLine'
import dayjs from 'dayjs';
import { clinicAPI } from "../../utils/api";
import socket from './socket';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย


const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: 18,

  '&:hover': {
    color: '#40a9ff',
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'black',
    fontWeight: theme.typography.fontWeightMedium,
    // fontWeight: 'bold',
    
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

const formatTime = (timeString) => {
  // แยกเวลาออกจากรูปแบบ 'HH:mm:ss+ZZ' และแสดงแค่ 'HH:mm'
  const time = timeString.split(':');  // แยกเป็น [ '16', '00', '00+07' ]
  return `${time[0]}:${time[1]}`;  // คืนค่าแค่ '16:00'
};

const TableAppointments = ({ appointments, searchQuery, setSearchQuery,setAppointments , activeTab }) => {
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
  const [page, setPage] = useState(0); // หน้าปัจจุบัน
  const [rowsPerPage, setRowsPerPage] = useState(15); // จำนวนแถวต่อหน้า


  const handlePostponeClick = (appointmentId, typeService, petId) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedTypeService(typeService);
    setSelectedPetId(petId); // Store pet_id
    setOpenPostponeDialog(true);

  };
  
  const updateAppointments = () => {
    clinicAPI.get(`/appointment`) // Assuming a GET endpoint to fetch all appointments
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

  const getLineUserId = async (appointmentId) => {
    try {
      const response = await clinicAPI.get(`/get-line-user/${appointmentId}`);
      return response.data.lineUserId; // สมมติว่า API ส่ง lineUserId กลับมา
    } catch (error) {
      console.error('Failed to fetch LINE User ID:', error);
      return null;
    }
  };
  
 //เปิดให้กดยืนยันการอนุมัติ
  const handleConfirmApprove = () => {
    try {
      // Update the status to 'อนุมัติ' in the database
      const appointment = appointments.find(a => a.appointment_id === approveAppointmentId);
      const { appointment_date, appointment_time, pet_name , type_service } = appointment;
      clinicAPI.put(`/appointment/${approveAppointmentId}`, {
        status: 'อนุมัติ',
        queue_status: 'รอรับบริการ'
      }).then(async () =>{
        updateAppointments()
        const formattedDate = formatDate(appointment_date);
        const formattedTime = formatTime(appointment_time || "ไม่ระบุเวลา");

        setSnackbarMessage(`การอนุมัตินัดหมายหมายเลข ${approveAppointmentId} เสร็จสิ้น!`);
        setSnackbarSeverity('success'); 
        setSnackbarOpen(true);

        const lineUserId = await getLineUserId(approveAppointmentId); // ดึง LINE User ID จากฐานข้อมูล
        const message = `นัดหมาย ${type_service} ของสัตว์เลี้ยง ${pet_name} ในวันที่ ${formattedDate} เวลา ${formattedTime} ได้รับการอนุมัติแล้ว!`;

      if (lineUserId) {
        await sendLineMessage(lineUserId, message);
      }  
      socket.emit('notification', {
        room: 'customer', 
        message: `นัดหมาย ${type_service} ของสัตว์เลี้ยง ${pet_name} ในวันที่ ${formattedDate} เวลา ${formattedTime} ได้รับการอนุมัติแล้ว!`
      });
    })
    .catch((error) => {
      console.error('Failed to approve appointment:', error);
    });
    
      
    } catch (error) {
      console.error('Failed to approve appointment:', error);
    }
    setOpenDialog(false);
  }; 

  
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  
  
  const deleteAppointment = (AppointmentID) => {
    clinicAPI.put(`/appointment/${AppointmentID}`,{
       status: 'ยกเลิกนัด',
       queue_status: 'ยกเลิกนัด',
       massage_status:'cancle'
    })
      .then(() => {
        // Update the list of appointments after successful deletion
        updateAppointments()
        setSnackbarMessage(`การยกเลิกนัดหมายหมายเลข ${cancelAppointmentId} เสร็จสิ้น!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      })
      .catch((error) => {
        //console.error('Error deleting appointment:', error);
        setSnackbarSeverity('error');
      });
  };


  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  //คิวที่ผ่านมาแล้วจะไม่แสดงปุ่มเลื่อน,ยกเลิก
  const isAppointmentInPast = (appointmentDate, appointmentTime,status ,queue_status) => {
    try {
      if (queue_status === 'เสร็จสิ้น' || queue_status === 'กำลังให้บริการ') {
        // ถ้านัดหมายเสร็จสิ้นแล้ว ไม่สามารถเลื่อนได้
        return true;
      }

      if (!appointmentDate) {
        console.error("Invalid appointment date: Date is null or undefined.");
        return false;
      }
  
      const timeWithoutOffset = appointmentTime
        ? appointmentTime.split('+')[0] // หากมีค่า appointmentTime
        : "20:00:00"; // หากไม่มีค่า ให้ใช้เวลาเริ่มต้นเป็น 
  
      // แปลงวันที่ให้อยู่ในรูปแบบ 'YYYY-MM-DD'
      const appointmentDateOnly = dayjs(appointmentDate).format('YYYY-MM-DD');
      const appointmentDateTime = dayjs(
        `${appointmentDateOnly}T${timeWithoutOffset}+07:00`
      ); // เพิ่ม timezone ด้วย +07:00
  
      if (!appointmentDateTime.isValid()) {
        return false;
      }
  
      const currentDateTime = dayjs();
  
      // ตรวจสอบว่าเวลานัดหมายอยู่ในอดีตหรือไม่
      return appointmentDateTime.isBefore(currentDateTime);
    } catch (error) {
      console.error('Error while parsing date or time:', error);
      return false;
    }
  };
  

  const filteredAppointments = appointments.filter(appointment => {
    // console.log('Active category:', activeCategory);
    const categoryMatch = activeCategory === 'ทั้งหมด' || appointment.type_service.trim() === activeCategory.trim();
    const searchMatch = 
      appointment.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
     
    return categoryMatch && searchMatch  ;
  });
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // กลับไปที่หน้าแรกเมื่อเปลี่ยนจำนวนแถวต่อหน้า
  };

  const paginatedAppointments = filteredAppointments
  .sort(getComparator(order, orderBy))
  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredAppointments.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage); // รีเซ็ต page หากเกินช่วงที่มีอยู่
    }
  }, [filteredAppointments, rowsPerPage,page]); // รันเมื่อ filteredAppointments หรือ rowsPerPage เปลี่ยน
  
  // console.log(filteredAppointments)
  return (
    <Paper elevation={3} sx={{ p: 2}}>
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
            <StyledTab key={category} label={category} value={category} 
            sx={{
              fontSize: 16 ,
              fontWeight: 'bold',
              }} 
            />
          ))}
        </Tabs>
      </Box>

      <Box display="flex" alignItems="center" mt={2} mb={2}>
        <TextField
          label="ค้นหานัดหมาย"
          placeholder='ค้นหานัดหมายด้วย ชื่อลูกค้า , ชื่อสัตว์เลี้ยง'
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <Button variant="contained" color="primary">ค้นหา</Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell >
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
              {activeTab === 1 && (
                <TableCell>สถานะแจ้งเตือนนัดหมาย</TableCell>
              )}
              
              <TableCell></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
          {paginatedAppointments.map((appointment, index) => (
        
        <TableRow  key={index}>

          {/* ข้อมูลอื่นๆ */}
          <TableCell sx={{ width: '15%' }}>{formatDate(appointment.appointment_date)}</TableCell>
          <TableCell sx={{ width: '15%' }}>{appointment.appointment_time ? formatTime(appointment.appointment_time) : 'ตลอดทั้งวัน'}</TableCell>
          <TableCell sx={{ width: '15%' }}>{appointment.pet_name}</TableCell>
          <TableCell sx={{ width: '15%' }}>{appointment.full_name}</TableCell>
          <TableCell sx={{ width: '15%' }}>{appointment.type_service}</TableCell>
          <TableCell sx={{ width: '15%' }}>{appointment.detail_service || '-'}</TableCell>
          <TableCell sx={{ width: '15%' }}>{appointment.reason || '-'}</TableCell>
          <TableCell sx={{ width: '15%' }}>{appointment.status}</TableCell>
          {activeTab === 1 && (
              <TableCell>
              <Box 
              sx={{
                bgcolor: appointment.massage_status === 'success' ? 'green' : 'transparent',
                color: appointment.massage_status === 'success' ? 'white' : 'inherit',
                textAlign: 'center',
                borderRadius: 1, // เพิ่มมุมโค้งนิดหน่อย
                width: '100%', // ขนาดของกล่องเป็น 60% ของช่อง
                padding: '4px', 
              
              }}>
              {appointment.massage_status}
              </Box>
              </TableCell>

              )}      
          <TableCell>

          {appointment.status === 'รออนุมัติ' && !isAppointmentInPast(appointment.appointment_date, appointment.appointment_time,appointment.status, appointment.queue_status) && (
          <Button
            variant="outlined"
            color="primary"
            sx={{ width: '100px' }}
            onClick={() => handleApproveClick(appointment.appointment_id)} // Handle the approval action
          >
            อนุมัติ
          </Button>
        )}
        {appointment.status !== 'อนุมัติ' && appointment.status !== 'ยกเลิกนัด'  && isAppointmentInPast(appointment.appointment_date, appointment.appointment_time,appointment.status,appointment.queue_status) && (
           <Box sx={{ backgroundColor: 'red', color: 'white', padding: '5px', borderRadius: '4px' }}>
             เลยเวลานัดหมาย
           </Box>
        )}
            {appointment.status === 'อนุมัติ' && !isAppointmentInPast(appointment.appointment_date, appointment.appointment_time,appointment.status,appointment.queue_status) && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ width: '100px' }}
                  onClick={() => handleCancelClick(appointment.appointment_id)}
                >
                  ยกเลิกนัด
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ width: '100px' }}
                  onClick={() =>
                    handlePostponeClick(appointment.appointment_id, appointment.type_service, appointment.pet_id,appointment.status)
                  }
                >
                  เลื่อนนัด
                </Button>
              </Box>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>

          {/* Popup เดียวที่แสดงตามเงื่อนไข */}
    {selectedAppointmentId && (
      selectedTypeService === 'ฝากเลี้ยง' ? (
        <PostponeHotel
          open={openPostponeDialog}
          handleClose={() => setOpenPostponeDialog(false)}
          appointmentId={selectedAppointmentId}
          petId={selectedPetId}
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

        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[15, 25]} // เลือกจำนวนแถวต่อหน้า
        component="div"
        count={filteredAppointments.length} // จำนวนทั้งหมด
        rowsPerPage={rowsPerPage}
        page={Math.min(page, Math.max(0, Math.ceil(filteredAppointments.length / rowsPerPage) - 1))} // ป้องกัน page เกินช่วง
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />


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

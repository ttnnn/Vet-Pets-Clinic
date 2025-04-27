import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Card, CardContent, Button, Box, AppBar, Toolbar, IconButton, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogTitle,CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Postpone from '../component/PostponeAppointment';
import PostponeHotel from '../component/PostponeHotel';
import { customerAPI  } from "../../utils/api";
import NotificationCustomer from './NotificationCustomer';

dayjs.locale('th'); // ใช้ locale ภาษาไทย


const AppointmentDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointment, setAppointment] = useState(null); 
  const { appointmentId } = location.state;
  
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedTypeService, setSelectedTypeService] = useState(null);
  const [openPostponeDialog, setOpenPostponeDialog] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null); // State for pet_id
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  // เพิ่ม state สำหรับ Dialog ยืนยันการยกเลิกนัด
  const [openDialog, setOpenDialog] = useState(false);

  const fetchAppointmentDetail = useCallback(async () => {
    try {
      if (!appointmentId) return;

      const response = await customerAPI.get(`/appointments/detail/${appointmentId}`);
      if (response.data.success && response.data.data.queue_status !== 'ยกเลิกนัด') {
        setAppointment(response.data.data);
      } else {
        // console.error('ไม่พบข้อมูลการนัดหมาย หรือการนัดหมายถูกยกเลิก');
        setAppointment(null);
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error.message);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointmentDetail();
  }, [fetchAppointmentDetail]);

  // ถ้ายังไม่ได้ข้อมูลจาก API
  if (!appointment) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }
    

  // ฟังก์ชันสำหรับยกเลิกนัด
  const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');
const formatTime = (time) => {
  if (!time) return null;
  const [startTime] = time.split(' - ');
  const [hours, minutes] = startTime.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
};

// ตรวจสอบเงื่อนไขการยกเลิกนัด
const canCancelAppointment = (typeService, appointmentDate, appointmentTime, status) => {
  const currentDateTime = dayjs();
  const appointmentDateTime = dayjs(`${formatDate(appointmentDate)}T${formatTime(appointmentTime)}`);

  if (typeService === 'ฝากเลี้ยง') {
    const oneDayBefore = appointmentDateTime.subtract(1, 'day').endOf('day');
    return currentDateTime.isBefore(oneDayBefore) && status !== 'check-in';
  }

  const cancelLimit = appointmentDateTime.subtract(45, 'minute');
  return currentDateTime.isBefore(cancelLimit);
};

const handleCancelAppointment = async () => {
  if (!canCancelAppointment(appointment.type_service, appointment.appointment_date, appointment.appointment_time, appointment.status)) {
    const errorMessage = appointment.type_service === 'ฝากเลี้ยง' && appointment.status === 'check-in'
      ? 'ไม่สามารถยกเลิกการฝากเลี้ยงได้ เนื่องจากมีสถานะเป็น check-in'
      : 'ไม่สามารถยกเลิกการนัดหมายได้ เนื่องจากเลยเวลายกเลิกที่กำหนด';

    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error',
    });
    return;
  }

  try {
    const response = await customerAPI.put(`/appointment/cancel`, { appointmentId: appointment.appointment_id });
    if (response.data.success) {
      setSnackbar({
        open: true,
        message: 'การนัดหมายถูกยกเลิกแล้ว',
        severity: 'success',
      });
      setAppointment(null);
      navigate('/customer/home');
    } else {
      console.error(response.data.message);
    }
  } catch (error) {
    console.error('Error canceling appointment:', error.message);
  }
};

const handleCloseSnackbar = () => {
  setSnackbar({ ...snackbar, open: false });
};
  // ฟังก์ชันสำหรับเปิด Dialog
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  // ฟังก์ชันสำหรับปิด Dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // ฟังก์ชันสำหรับยืนยันการยกเลิกนัด
  const handleConfirmCancel = () => {
    handleCancelAppointment();
    handleCloseDialog();
  };

  // ฟังก์ชันสำหรับการกลับไปหน้าก่อนหน้า
  const handleBack = () => {
    const from = location.state?.from; 
    if (from === 'history') {
      navigate('/customer/history'); 
    } else {
      navigate('/customer/home'); 
    }
  };

  const handlePostponeClick = (appointmentId, typeService, petId, appointmentDate, appointmentTime) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedTypeService(typeService);
    setSelectedPetId(petId);
    setOpenPostponeDialog(true);
  
  };
  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar */}
      <NotificationCustomer />
      <AppBar position="fixed" sx={{ zIndex: 1100, backgroundColor: '#1976d2' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            นัดหมาย
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ marginTop: 10 }}>
        <Typography variant="h5" gutterBottom> รายละเอียดการนัดหมาย</Typography>
        <Card>
          <CardContent>
            <Typography><strong>รหัสการนัดหมาย:</strong>  {appointment.appointment_id}</Typography>
            <Typography><strong>บริการ:</strong> {appointment.type_service}</Typography>
            <Typography><strong>ชื่อสัตว์เลี้ยง:</strong> {appointment.pet_name}</Typography>
            <Typography><strong>สายพันธุ์:</strong> {appointment.pet_breed}</Typography>
            <Typography><strong>เจ้าของ:</strong> {appointment.first_name} {appointment.last_name}</Typography>
            <Typography><strong>เบอร์ติดต่อ:</strong> {appointment.phone_number}</Typography>
            <Typography>
              <strong>วันที่นัดหมาย:</strong> {dayjs(appointment.appointment_date).format('D MMMM YYYY')}
              <br />
              <strong>เวลา:</strong> {
                appointment.appointment_date && appointment.appointment_time
                ? (() => {
                    const timeWithoutTimezone = appointment.appointment_time.split('+')[0]; // ตัด timezone (+07)
                    const combinedDateTime = `${dayjs(appointment.appointment_date).format('YYYY-MM-DD')}T${timeWithoutTimezone}`;
                    return dayjs(combinedDateTime).isValid()
                      ? dayjs(combinedDateTime).format("HH:mm")
                      : "ไม่ระบุเวลา";
                  })()
                : "ไม่ระบุเวลา"
              }
            </Typography>
            <Typography><strong>เหตุผล:</strong> {appointment.reason || 'ไม่ระบุ'}</Typography>
            <Typography><strong>สถานะ:</strong> {appointment.status}</Typography>
            <Typography><strong>สถานะคิว:</strong> {appointment.queue_status}</Typography>

            <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
              {location.state?.from !== 'history' && appointment.queue_status !== 'เสร็จสิ้น' &&(
                <>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleOpenDialog} 
                    sx={{ flex: 1, marginRight: 1 }}>
                    ยกเลิกนัด
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={() =>
                      handlePostponeClick(
                        appointmentId, 
                        appointment.type_service, 
                        appointment.pet_id, 
                        appointment.appointment_date, // ส่งวันที่นัดหมาย
                        appointment.appointment_time  // ส่งเวลานัดหมาย
                      )
                    }
                    sx={{ flex: 1, marginLeft: 1 }}>
                    เลื่อนนัด
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>

        {/* Popup เดียวที่แสดงตามเงื่อนไข */}
      {selectedAppointmentId && (
        selectedTypeService === 'ฝากเลี้ยง' ? (
          <PostponeHotel
            open={openPostponeDialog}
            handleClose={() => setOpenPostponeDialog(false)}
            appointmentId={selectedAppointmentId}
            petId={selectedPetId}
            appointmentDates={appointment.appointment_date} // ส่งวันที่นัดหมาย
            appointmentTimes={appointment.appointment_time} // ส่งเวลานัดหมาย
            updateAppointments={() => {
              fetchAppointmentDetail(); 
            }}
            isCustomer={true} // เพิ่มค่า isCustomer
          />
        ) : (
          <Postpone
            open={openPostponeDialog}
            handleClose={() => setOpenPostponeDialog(false)}
            appointmentId={selectedAppointmentId}
            TypeService={selectedTypeService}
            appointmentDates={appointment.appointment_date} // ส่งวันที่นัดหมาย
            appointmentTimes={appointment.appointment_time} // ส่งเวลานัดหมาย
            updateAppointments={() => {
              fetchAppointmentDetail(); 
            }}
            isCustomer={true} // เพิ่มค่า isCustomer
          />
        )
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog ยืนยันการยกเลิกนัด */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>ยืนยันการยกเลิกนัดหมาย</DialogTitle>
        <DialogContent>
          <Typography>คุณแน่ใจว่าต้องการยกเลิกการนัดหมายนี้หรือไม่?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            ยกเลิก
          </Button>
          <Button onClick={handleConfirmCancel} color="primary">
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppointmentDetail;

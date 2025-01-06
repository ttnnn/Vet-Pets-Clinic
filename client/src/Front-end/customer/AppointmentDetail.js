import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Card, CardContent, Button, Box, AppBar, Toolbar, IconButton, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Postpone from '../component/PostponeAppointment';
import PostponeHotel from '../component/PostponeHotel';


dayjs.locale('th'); // ใช้ locale ภาษาไทย

const api = 'http://localhost:8080/api/customer';

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
  
  // เพิ่ม state สำหรับ Dialog ยืนยันการยกเลิกนัด
  const [openDialog, setOpenDialog] = useState(false);

  const fetchAppointmentDetail = useCallback(async () => {
    try {
      if (!appointmentId) return;

      const response = await axios.get(`${api}/appointments/detail/${appointmentId}`);
      if (response.data.success && response.data.data.queue_status !== 'ยกเลิกนัด') {
        setAppointment(response.data.data);
      } else {
        console.error('ไม่พบข้อมูลการนัดหมาย หรือการนัดหมายถูกยกเลิก');
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
  if (appointment === null) {
    return <Typography>กำลังโหลดข้อมูล...</Typography>;
  }

  // ฟังก์ชันสำหรับยกเลิกนัด
  const handleCancelAppointment = async () => {
    try {
      const response = await axios.post(`${api}/appointment/cancel`, { appointmentId });

      if (response.data.success) {
        setSnackbarMessage('การนัดหมายถูกยกเลิกแล้ว');
        setOpenSnackbar(true);
        setAppointment(null); // ซ่อนการแสดงผลการนัดหมายที่ถูกยกเลิก
        navigate('/customer/home');
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error('Error canceling appointment:', error.message);
    }
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

  const handlePostponeClick = (appointmentId, typeService, petId) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedTypeService(typeService);
    setSelectedPetId(petId); // Store pet_id
    setOpenPostponeDialog(true);

    console.log('appointment:', appointmentId);
    console.log('typeService:', typeService);
    console.log('petId:', petId);
  };
  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar */}
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
            <Typography><strong>สายพันธุ์:</strong> {appointment.pet_species}</Typography>
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

            <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
              {location.state?.from !== 'history' && (
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
                      handlePostponeClick(appointmentId, appointment.type_service, appointment.pet_id)
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
            updateAppointments={() => {
              fetchAppointmentDetail(); 
            }}
            isCustomer={true} // เพิ่มค่า isCustomer
          />
        )
      )}

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

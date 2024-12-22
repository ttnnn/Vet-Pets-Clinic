import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Card, CardContent, Button, Box, AppBar, Toolbar, IconButton } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


dayjs.locale('th'); // ใช้ locale ภาษาไทย

const api = 'http://localhost:8080/api/customer';

const AppointmentDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointment, setAppointment] = useState(null); // เริ่มต้นเป็น null เพื่อใช้ตรวจสอบสถานะของข้อมูล
  const { appointmentId } = location.state;

  // ฟังก์ชันดึงข้อมูลการนัดหมาย
  const fetchAppointmentDetail = useCallback(async () => {
    try {
      if (!appointmentId) return; // ป้องกันการเรียกหากไม่มี appointmentId

      const response = await axios.get(`${api}/appointments/detail/${appointmentId}`);
      if (response.data.success) {
        setAppointment(response.data.data); // ใช้ข้อมูลจาก response.data.data
      } else {
        console.error(response.data.message); // หากไม่มีข้อมูล
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error.message);
    }
  }, [appointmentId]); // ใช้ appointmentId เป็น dependency เพื่อให้ฟังก์ชันนี้เรียกใหม่เมื่อ appointmentId เปลี่ยนแปลง
  
  useEffect(() => {
    fetchAppointmentDetail();
  }, []); // เรียก fetchAppointmentDetail เมื่อมันถูกสร้างใหม่

  // ถ้ายังไม่ได้ข้อมูลจาก API
  if (appointment === null) {
    return <Typography>กำลังโหลดข้อมูล...</Typography>;
  }

  // ฟังก์ชันสำหรับยกเลิกนัด
  const handleCancelAppointment = async () => {
    try {
      const response = await axios.post(`${api}/appointments/cancel`, { appointmentId });
      if (response.data.success) {
        alert('การนัดหมายถูกยกเลิกแล้ว');
        navigate('/customer/home'); // หลังจากยกเลิกแล้วกลับไปหน้า home
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error('Error canceling appointment:', error.message);
    }
  };

  // ฟังก์ชันสำหรับเลื่อนนัด
  const handleRescheduleAppointment = () => {
    navigate(`/customer/reschedule/${appointmentId}`); // เปลี่ยนเส้นทางไปหน้าที่สามารถเลือกเวลาใหม่ได้
  };

  // ฟังก์ชันสำหรับการกลับไปหน้าก่อนหน้า
  const handleBack = () => {
    const from = location.state?.from; // อ่านข้อมูลจาก state ที่ส่งมาจากหน้าก่อนหน้า
    if (from === 'history') {
      navigate('/customer/history'); 
    } else {
      navigate('/customer/home'); 
    }
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
            <Typography><strong>วันที่นัดหมาย:</strong> {dayjs(appointment.appointment_date).format('D MMMM YYYY')}</Typography>
            <Typography>
              <strong>เวลานัดหมาย:</strong> 
              {appointment.appointment_time 
                ? dayjs(`2024-01-01T${appointment.appointment_time}`).format('HH:mm')
                : 'ไม่ระบุเวลา'}
            </Typography>


            <Typography><strong>เหตุผล:</strong> {appointment.reason || 'ไม่ระบุ'}</Typography>
            <Typography><strong>สถานะ:</strong> {appointment.status}</Typography>

            <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleCancelAppointment} 
                sx={{ flex: 1, marginRight: 1 }}>
                ยกเลิกนัด
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleRescheduleAppointment} 
                sx={{ flex: 1, marginLeft: 1 }}>
                เลื่อนนัด
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AppointmentDetail;

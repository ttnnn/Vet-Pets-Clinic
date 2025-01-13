import React, { useState } from 'react';
import {
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, Box, FormControlLabel, Typography, Snackbar, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import TimeSlotPicker from './TimeSlot'; // Import TimeSlotPicker component
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Import Thai locale for dayjs
import HolidayFilter from './HolidayFilter';

dayjs.locale('th'); // Set dayjs to use Thai locale

const api = 'http://localhost:8080/api/clinic';

const Postpone = ({ open, handleClose, TypeService, appointmentId, updateAppointments ,isCustomer , appointmentDates, appointmentTimes }) => {
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [isNoTime, setIsNoTime] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  // console.log('isCustomer',isCustomer)
  console.log('Appointment Date:', appointmentDates);
  console.log('Appointment Time:', appointmentTimes);

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetFields = () => {
    setAppointmentDate(null);
    setAppointmentTime(null);
    setIsNoTime(false);
  };

  const validateAndOpenDialog = () => {
    console.log('validateAndOpenDialog')

    if (!appointmentDate || (!appointmentTime && !isNoTime)) {
      setSnackbar({ open: true, message: 'กรุณากรอกข้อมูลให้ครบ', severity: 'error' });
      return;
    }
    setOpenDialog(true); // Open confirmation dialog if data is valid
  };

  const handlePostpone = async () => {

    try {
      const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');
      const formatTime = (time) => {
        if (!time) return null;
        const [startTime] = time.split(' - ');
        const [hours, minutes] = startTime.split(':');
        console.log(`${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`)
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      }

       // ตรวจสอบเวลาปัจจุบันกับเวลานัดหมายเดิม (เฉพาะ customer)

       if (isCustomer) {
        const currentDateTime = new Date(); // เวลาปัจจุบัน
        const appointmentDateTime = new Date(`${formatDate(appointmentDates)}T${formatTime(appointmentTimes)}`); // เวลานัดหมาย

      
        const diffMilliseconds = appointmentDateTime - currentDateTime; // คำนวณความต่างในมิลลิวินาที
        const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60)); // แปลงเป็นนาที
      
        // Debug logs
        console.log(" DateTime:", appointmentDate);
        console.log(" Time:", appointmentDate);
        console.log("Current DateTime:", currentDateTime);
        console.log("Appointment DateTime:", appointmentDateTime);
        console.log("Difference in Minutes:", diffMinutes);
      
        if (diffMinutes < 45) {
          console.log("Condition met: Less than 45 minutes before appointment.");
          setSnackbar({
            open: true,
            message: 'สามารถเลื่อนนัดได้อย่างน้อย 45 นาทีก่อนถึงเวลานัดหมาย.',
            severity: 'error',
          });
          return;
        }
      }
      


      const date_format = formatDate(appointmentDate) ;

      let time_format = null; // Use let instead of const
      if (isNoTime === false) {
        // console.log('appointmentTime', appointmentTime);
        time_format = formatTime(appointmentTime);
      }


      // console.log("format",date_format, " ",time_format)

      const response = await axios.put(`${api}/postpone/appointment/${appointmentId}`, {
        appointment_date: date_format,
        appointment_time: time_format,
      });

      if (isCustomer) {
        await axios.put(`${api}/appointment/${appointmentId}`, { status: 'รออนุมัติ', queue_status: 'รอรับบริการ' });
      }

      if (response.status === 200) {
        setSnackbar({ open: true, message: 'เลื่อนนัดสำเร็จ!', severity: 'success' });
        updateAppointments();
        resetFields();
        handleClose();
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
      setSnackbar({ open: true, message: 'ไม่สามารถเลื่อนนัดได้', severity: 'error' });
    }
    setOpenDialog(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={() => { resetFields(); handleClose(); }} maxWidth="md" fullWidth
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
        }}
        PaperProps={{
          sx: { boxShadow: 'none' },
        }}>
        <DialogTitle>เลือก วัน-เวลา นัดหมายใหม่</DialogTitle>
        <DialogContent dividers>
          {TypeService !== 'ฝากเลี้ยง' ? (
            <>
            <HolidayFilter>
              <DatePicker
                label="เลือกวันที่"
                value={appointmentDate}
                onChange={(newDate) => setAppointmentDate(newDate)}
                TextFieldComponent={(params) => <TextField {...params} fullWidth />}
                disablePast
                views={['year', 'month', 'day']}
              />
            </HolidayFilter>
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isNoTime}
                      onChange={(e) => {
                        setIsNoTime(e.target.checked);
                        setAppointmentTime(e.target.checked ? null : '');
                      }}
                    />
                  }
                  label="ไม่ระบุเวลา"
                />
              </Box>
              {!isNoTime && (
                <TimeSlotPicker
                  TypeService={TypeService}
                  selectedDate={appointmentDate}
                  onTimeSelect={setAppointmentTime}
                />
              )}
            </>
          ) : ''}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { resetFields(); handleClose(); }}>ยกเลิก</Button>
          <Button onClick={validateAndOpenDialog} color="primary">ยืนยัน</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>ยืนยันการเลื่อนนัดหมาย</DialogTitle>
        <DialogContent>
          <Typography>คุณแน่ใจหรือไม่ว่าต้องการเลื่อนนัดหมายนี้</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="error">ยกเลิก</Button>
          <Button onClick={handlePostpone} color="primary">ยืนยัน</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default Postpone;

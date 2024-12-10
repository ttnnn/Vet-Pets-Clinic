import React, { useState } from 'react';
import {
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, Box, FormControlLabel,Typography,Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import TimeSlotPicker from './TimeSlot'; // Import TimeSlotPicker component
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Import Thai locale for dayjs

dayjs.locale('th'); // Set dayjs to use Thai locale

const api = 'http://localhost:8080/api/clinic';


const Postpone = ({ open, handleClose, TypeService, appointmentId, updateAppointments }) => {
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [isNoTime, setIsNoTime] = useState(false);
  const [openDialog , setOpenDialog] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  console.log('typeservice' , TypeService )
  const resetFields = () => {
    setAppointmentDate('');
    setAppointmentTime('');
    setIsNoTime(false);
  };

  const handlePostpone = async () => {
    try {
      if (!appointmentDate || (!appointmentTime && !isNoTime)) {
        alert('Please fill all required fields.');
        return;
      }

      const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');
      const formatTime = (time) => {
        if (!time) return null;
        const [startTime] = time.split(' - ');
        const [hours, minutes] = startTime.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      };

       // ตรวจสอบเวลาปัจจุบันกับเวลานัดหมาย
    // const currentDateTime = dayjs(); // เวลาปัจจุบัน
    // const originalAppointmentDateTime = dayjs(`${appointmentDate}T${appointmentTime}`); // วันที่และเวลานัดหมายเดิม
    // const diffMinutes = originalAppointmentDateTime.diff(currentDateTime, 'minute'); // คำนวณความต่างในหน่วยนาที

    // if (diffMinutes < 45) {
      // alert('สามารถเลื่อนนัดได้อย่างน้อย 45 นาทีก่อนถึงเวลานัดหมาย.');
      // return;
    // }

      const response = await axios.put(`${api}/postpone/appointment/${appointmentId}`, {
        appointment_date: formatDate(appointmentDate),
        appointment_time: isNoTime ? null : formatTime(appointmentTime),
      });

      if (response.status === 200) {
        setSnackbarOpen(true);
        updateAppointments(); // Update appointments after successful postponement
        resetFields();
        handleClose(); 
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
      alert('Failed to update appointment');
    }
    setOpenDialog(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={() => { resetFields(); handleClose(); }} maxWidth="md" fullWidth
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.1)' } // ตั้งค่าโปร่งแสงของพื้นหลัง
        }}
      PaperProps={{
          sx: { boxShadow: 'none' } // ปิดเงาของ Dialog
        }}>
        <DialogTitle>เลือก วัน-เวลา นัดหมายใหม่</DialogTitle>
        <DialogContent dividers>
          {TypeService !== 'ฝากเลี้ยง' ? (
            <>
              <DatePicker
                label="เลือกวันที่"
                value={appointmentDate}
                onChange={(newDate) => setAppointmentDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disablePast
                views={['year', 'month', 'day']}
              />
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
          ) : '' }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { resetFields(); handleClose(); }}>ยกเลิก</Button>
          <Button onClick={() => setOpenDialog(true)} color="primary">ยืนยัน</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar} message="Data updated successfully!" />
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

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Radio, RadioGroup, FormControlLabel, TextField, Typography
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import "dayjs/locale/th";
dayjs.locale("th");

const DialogAddRecordMed = ({ open, onClose, appointment }) => {
  const [time, setTime] = useState(dayjs()); // Default to current time
  const [interval, setInterval] = useState('8'); // Default interval

  const handleIntervalChange = (event) => {
    setInterval(event.target.value);
  };

  const handleTimeChange = (newTime) => {
    setTime(newTime);
  };

  const handleSave = () => {
    console.log(`Appointment Number: ${appointment?.appointment_id || 'ไม่ระบุ'}`);
    console.log(`Start Time: ${time.format('HH:mm')}`);
    console.log(`Interval: Every ${interval} hours`);
    onClose(); // Close the dialog
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>นัดหมายที่ #{appointment?.appointment_id || 'ไม่ระบุ'}</DialogTitle>
        <DialogContent>
          {/* Current Date */}
          <Typography variant="body1" gutterBottom>
            วันที่ปัจจุบัน: {dayjs().format('D MMMM YYYY')}
          </Typography>

          {/* Time Picker */}
          <TimePicker
            label="เลือกเวลาเริ่มต้น"
            value={time}
            onChange={handleTimeChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />

          {/* Radio Button for Interval */}
          <Typography variant="body1" sx={{ marginTop: 2 }}>
            กรุณาเลือกช่วงเวลาบันทึกอาการ
          </Typography>
          <RadioGroup value={interval} onChange={handleIntervalChange}>
            <FormControlLabel value="8" control={<Radio />} label="ทุก 8 ชั่วโมง" />
            <FormControlLabel value="6" control={<Radio />} label="ทุก 6 ชั่วโมง" />
            <FormControlLabel value="1" control={<Radio />} label="ทุกชั่วโมง" />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="error">ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained" color="primary">บันทึก</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default DialogAddRecordMed;

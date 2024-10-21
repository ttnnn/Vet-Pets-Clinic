import React, { useState } from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, Box, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import TimeSlotPicker from './TimeSlot';   // Import TimeSlotPicker component

const api = 'http://localhost:8080'
const Postpone = ({ open, handleClose, TypeService, appointmentId, updateAppointments }) => {
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [isNoTime, setIsNoTime] = useState(false); // Checkbox state for time selection

 console.log('appointment:',appointmentId)
 console.log('service:',TypeService)

 const resetFields = () => {
  setAppointmentDate('');
  setAppointmentTime('');
  setIsNoTime(false);
};
  
  const handlePostpone = async () => {
    try {
      if (!appointmentDate || (!appointmentTime && !isNoTime)) {
        alert('Please select both a date and time.');
        return;
      }
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const formatTime = (time) => {
        if (!time) return null;
        const [startTime] = time.split(' - ');
        const [hours, minutes] = startTime.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      };

      // API call to update the appointment
      const response = await axios.put(`${api}/postpone/appointment/${appointmentId}`, {
        appointment_date: formatDate(appointmentDate),
        appointment_time: isNoTime ? null : formatTime(appointmentTime), // Send null for time if 'no time' is selected
      });
      
      console.log("Formatted Date:", formatDate(appointmentDate));
      console.log("Formatted Time:", formatTime(appointmentTime));

      if (response.status === 200) {
        updateAppointments(); 
        resetFields(); // รีเซต
        handleClose();
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
      alert('Failed to update appointment');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={() => { resetFields(); handleClose(); }} maxWidth="md" fullWidth>
        <DialogTitle>เลือก วัน-เวลา นัดหมายใหม่</DialogTitle>
        <DialogContent dividers>
          {TypeService !== 'ฝากเลี้ยง' ? (
            <>
              {/* Date Picker */}
              <DatePicker
                label="เลือกวันที่"
                value={appointmentDate}
                onChange={(newDate) => setAppointmentDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disablePast
                views={['year', 'month', 'day']}
              />

              {/* Checkbox for No Time selection */}
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isNoTime}
                      onChange={(e) => {
                        setIsNoTime(e.target.checked);
                        setAppointmentTime(e.target.checked ? null : ''); // Reset time when no time is selected
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
                  onTimeSelect={setAppointmentTime} // Update appointmentTime when a time slot is selected
                />
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { resetFields(); handleClose(); }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handlePostpone} className="submit-button">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default Postpone;

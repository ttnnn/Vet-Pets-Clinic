import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import io from 'socket.io-client';

const Notification = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  
// เข้าร่วมห้อง clinic

  useEffect(() => {
    // ฟังทั้งสองอีเวนต์
    const socket = io('http://localhost:8080'); // เชื่อมต่อกับเซิร์ฟเวอร์
    socket.emit('join-room', 'clinic');

    socket.on('queue-alert', (msg) => {
      console.log('Queue alert received:', msg);
      if (msg.message) {
        setMessage(msg.message);
        setOpen(true);
      }
    });
  
  
    return () => {
      socket.off('queue-alert');
    };
  }, []);
  



  const handleClose = () => {
    setOpen(false);
  };
//ตั้งค่าเวลาปิด autoHideDuration={6000}
  return (
    <Snackbar
    open={open}
    onClose={handleClose}
    // ปรับตำแหน่งด้วย style
    sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
      }}
  >
    <Alert onClose={handleClose} severity="warning" 
    style={{
          fontSize: '16px', // ขนาดข้อความ
          padding: '16px', // ระยะขอบภายใน
        }}>
      {message}
    </Alert>
  </Snackbar>
    );
  
};

export default Notification;

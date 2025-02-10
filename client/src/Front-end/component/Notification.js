import React, { useState, useEffect,useRef } from 'react';
import { Snackbar, Alert } from '@mui/material';
import io from 'socket.io-client';

const Notification = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const timeoutRef = useRef(null); // เพื่อเก็บการตั้งเวลาไว้ในครั้งถัดไป
  // Connect to the 'clinic' room on socket server
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'https://two-vet-pets-clinic.onrender.com/api');


    socket.emit('join-room', 'clinic'); // Join 'clinic' room

    // ฟังก์ชันสำหรับเล่นเสียง
      const playSound = (soundPath) => {
        const audio = new Audio(soundPath); // โหลดไฟล์เสียง
        audio.play().catch((err) => {
          console.error('Error playing sound:', err);
        });
      };


     // ฟังการแจ้งเตือนจากเซิร์ฟเวอร์
     socket.on('notification', (msg) => {
      console.log('Notification received:', msg); // ตรวจสอบข้อมูลที่ได้รับ
      if (msg && msg.message) {
        setMessage(msg.message);
        setOpen(true); // แสดง Snackbar
      }
       // หน่วงเวลาในการแสดง Snackbar (เพิ่ม delay 1 วินาที)
       timeoutRef.current = setTimeout(() => {
        setMessage(msg.message);
        setOpen(true); // แสดง Snackbar
      }, 1000); // ปรับ delay ที่นี่ตามต้องการ (1000ms = 1 วินาที)
      
      // เล่นเสียงแจ้งเตือน
        
      playSound('/sounds/relax-message-tone.mp3'); // ระบุ path ของไฟล์เสียง
    });


    // Listen for 'queue-alert' event
    socket.on('queue-alert', (msg) => {
      // console.log('Queue alert received:', msg); // Debug received message
      if (msg.message) {
        setMessage(msg.message);
        setOpen(true); // Show Snackbar
      }
      // เล่นเสียงแจ้งเตือน
      playSound('/sounds/relax-message-tone.mp3'); // ระบุ path ของไฟล์เสียง
    });

    // Cleanup on component unmount
    return () => {
      socket.off('queue-alert');
      socket.off('notification');
      socket.off('connect'); 
    };
  }, []);

  // Handle closing of Snackbar
  const handleClose = () => {
    setOpen(false);
  };

  // Render Snackbar with autoHideDuration of 6 seconds
  return (
    <div>
    <Snackbar
      open={open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      autoHideDuration={9000} // Automatically close after 6 seconds
    >
      <Alert
        onClose={handleClose}
        severity="warning"
        style={{
          fontSize: '16px', // Font size
          padding: '16px',  // Padding inside Snackbar
        }}
      >
        {message}
      </Alert>
    </Snackbar>
    {/* {socketId && <p>Socket ID: {socketId}</p>} แสดง Socket ID */}
    </div>
  );
};

export default Notification;

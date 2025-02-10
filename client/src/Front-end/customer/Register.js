import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box, Snackbar, Alert } from '@mui/material';
import { customerAPI  } from "../../utils/api";

const Register = () => {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [phone_number, setPhone] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // State for Snackbar

  const navigate = useNavigate();
  const location = useLocation();
  const { idToken, pictureUrl } = location.state || {};

  console.log('location.state ',location.state )
  const handleRegister = async (event) => {
    event.preventDefault();

    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (!first_name || !last_name || !phone_number) {
      setSnackbar({ open: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน', severity: 'error' });
      return;
    }

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์ (10 หลัก)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone_number)) {
      setSnackbar({ open: true, message: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง', severity: 'error' });
      return;
    }

    if (!idToken) {
      console.error("No ID Token found");
      setSnackbar({ open: true, message: 'กรุณาเข้าสู่ระบบอีกครั้ง', severity: 'error' });
      return;
    }
 
    try {
      const response = await customerAPI.post(
        `/owner/check-owner`,
        { first_name, last_name, phone_number },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      if (response.data.success) {
        sessionStorage.setItem(
          "user",
          JSON.stringify({ first_name, last_name, phone_number, pictureUrl })
        );
        setSnackbar({ open: true, message: response.data.message, severity: 'success' });
        navigate("/customer/home");
      } else {
        setSnackbar({ open: true, message: response.data.message || 'เข้าสู่ระบบไม่สำเร็จ', severity: 'error' });
      }
    } catch (error) {
      if (error.response?.data?.message === "Token expired. Please reauthenticate.") {
        setSnackbar({ open: true, message: 'Token หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', severity: 'warning' });
        navigate("/customer/login");
      } else {
        // console.error("Error:", error);
        setSnackbar({ open: true, message: 'ไม่พบข้อมูลในระบบ กรุณาตรวจสอบชื่อ-นามสกุล หรือเบอร์โทร', severity: 'error' });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 3,
      }}
    >
      <Typography variant="h5" gutterBottom align="center">
        เข้าสู่ระบบ
      </Typography>
      <Box
        component="form"
        sx={{
          width: '100%',
          mt: 2,
        }}
        onSubmit={handleRegister}
      >
        <TextField
          label="ชื่อ"
          variant="outlined"
          fullWidth
          margin="normal"
          value={first_name}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          label="นามสกุล"
          variant="outlined"
          fullWidth
          margin="normal"
          value={last_name}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextField
          label="เบอร์โทร"
          variant="outlined"
          fullWidth
          margin="normal"
          value={phone_number}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
        >
          เข้าสู่ระบบ
        </Button>
      </Box>
      {/* Snackbar Component */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Register;

import React, { useState } from 'react'; 
import { useNavigate ,useLocation } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import axios from 'axios'; // import axios

const api = 'http://localhost:8080/api/customer';

const Register = () => {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [phone_number, setPhone] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { idToken } = location.state || {};

  console.log('location.state ',location.state )
  const handleRegister = async (event) => {
    event.preventDefault();
  
    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (!first_name || !last_name || !phone_number) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
  
    // ตรวจสอบรูปแบบเบอร์โทรศัพท์ (10 หลัก)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone_number)) {
      alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }
    if (!idToken) {
      console.error("No ID Token found");
      return;
    }

    try {
      console.log("idToken from Line:", idToken);
      console.log('first_name',first_name)
      console.log('last_name',last_name)
      console.log('phone_number',phone_number)
      const response = await axios.post(
        `${api}/owner/check-owner`,
        {
          first_name,
          last_name,
          phone_number,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`, // ส่ง idToken ผ่าน Header
          },
        }
      );
  
      const result = response.data;
  
      if (response.data.success) {
        sessionStorage.setItem(
          "user",
          JSON.stringify({ first_name, last_name, phone_number})
        );
        alert(response.data.message);
        navigate("/customer/home");

      } else {
        alert(result.data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      if (error.response?.data?.message === "Token expired. Please reauthenticate.") {
        alert("Token หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง");
        // เปลี่ยนเส้นทางไปยังหน้า login หรือ refresh โทเค็นที่นี่
        navigate("customer/line-login");
      } else {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }
    }
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
    </Container>
  );
};

export default Register;

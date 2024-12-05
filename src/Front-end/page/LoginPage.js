import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (email === '' && password === '') {
      localStorage.setItem('isAuthenticated', 'true'); // Save login status
      onLogin();
      navigate('/home');
    } else {
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100vw" // Full screen width
      bgcolor="#f5f5f5"
    >
      <Paper
        elevation={3}
        sx={{
          padding: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0,
        }}
      >
        <Grid container spacing={0} sx={{ height: '100%' }}>
          {/* Left Side - Animal Image */}
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
              overflow="hidden"
            >
              <img
                src="/login.jpg" // เส้นทางของรูปภาพใน public
                alt="Animal"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          </Grid>

          {/* Right Side - Logo and Login Form */}
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              height="100%"
              padding={4}
            >
              <img
                src="/Logo.jpg" // เส้นทางของโลโก้ใน public
                alt="Logo"
                style={{ width: '150px', marginBottom: '20px' }}
              />
              <Typography variant="h5" gutterBottom>
                เข้าสู่ระบบ
              </Typography>
              <Box sx={{ width: '75%', maxWidth: '400px' }}>
                <TextField
                  label="อีเมล"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ marginBottom: 2 }}
                />
                <TextField
                  label="รหัสผ่าน"
                  variant="outlined"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ marginBottom: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleLogin}
                  sx={{ marginTop: 2 }}
                >
                  เข้าสู่ระบบ
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default LoginPage;

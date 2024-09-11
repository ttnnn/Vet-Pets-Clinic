import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import logo from '../Logo.jpg';
import animalImage from '../login.jpg'; // Replace with the correct path to your animal image

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (email === 'user@email.com' && password === 'p@ssw0rd') {
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
          padding: 0, // No padding for full screen coverage
          width: '100%',
          height: '100%', // Full screen height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0, // Remove border-radius to cover the entire screen
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
              overflow="hidden" // Ensure the image covers the area
            >
              <img
                src={animalImage}
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
                src={logo}
                alt="Logo"
                style={{ width: '150px', marginBottom: '20px' }}
              />
              <Typography variant="h5" gutterBottom>
                เข้าสู่ระบบ
              </Typography>
              <Box sx={{ width: '75%', maxWidth: '400px' }}> {/* Contain the input fields */}
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

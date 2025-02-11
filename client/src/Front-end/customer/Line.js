import React, { useEffect } from 'react';
import { Button, Grid, Box } from '@mui/material';
import liff from '@line/liff';
const lineliff = process.env.REACT_APP_LIFF_ID;
const Line = () => {
  useEffect(() => {
    liff.init({  liffId: lineliff})
      .then(() => {
        // Optionally handle success (e.g., check login status)
      })
      .catch(err => {
        console.error('LIFF initialization failed', err);
      });
  }, []);

  const handleLoginLiff = () => {
    try {
      liff.login(); // ยืนยันการล็อกอิน
    } catch (err) {
      console.error('LIFF login failed', err);
    }
  };

  return (
    <Grid 
      container 
      justifyContent="center" 
      alignItems="center" 
      style={{ height: '100vh', padding: '16px' }}
      spacing={1} // ลด spacing ระหว่าง Grid items
    >
      {/* Logo Section */}
      <Grid item xs="auto" textAlign="center"> {/* เปลี่ยนขนาดเป็น auto */}
        <Box>
          <img 
            src="/Logo.jpg" 
            alt="Logo" 
            style={{ width: '300px', height: 'auto' }} // กำหนดขนาดที่แน่นอน
          />
        </Box>
      </Grid>

      {/* Login Button */}
      <Grid item xs="auto" textAlign="center"> {/* ลดขนาดให้เหมาะสม */}
        <Button 
          className="line-login-btn" 
          onClick={handleLoginLiff} 
          style={{ padding: '0', background: 'none', border: 'none' }}
        >
          <img 
            src="/btn_login_base.png" 
            alt="Log in" 
            style={{ maxWidth: '200px', width: '100%', height: 'auto' }}
          />
        </Button>
      </Grid>
    </Grid>
  );
};

export default Line;

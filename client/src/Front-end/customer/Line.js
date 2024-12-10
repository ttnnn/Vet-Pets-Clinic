import React, { useEffect } from 'react';
import { Button, Grid } from '@mui/material';
import liff from '@line/liff';


const Line = () => {

  useEffect(() => {
    liff.init({ liffId: '2006068191-vAnqlBk7' })
      .then(() => {
        // Optionally handle success (e.g., check login status)
      })
      .catch(err => {
        console.error('LIFF initialization failed', err);
      });
  }, []);

  const handleLoginLiff = () => {
    try {
      liff.login();//ยืนยันการล้อคอิน
    } catch (err) {
      console.error('LIFF login failed', err);
    }
  };

  return (
    <Grid container justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
      {/* Login Button */}
      <Grid item xs={12}>
        <Button 
          className="line-login-btn" 
          onClick={handleLoginLiff}
        >
          <img src="/btn_login_base.png" alt="Log in" />
        </Button>
      </Grid>
    </Grid>
  );
};

export default Line;

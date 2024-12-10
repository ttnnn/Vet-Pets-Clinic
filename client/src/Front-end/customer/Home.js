import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Card, CardContent, Grid, Avatar } from '@mui/material';
import liff from '@line/liff';

const Home = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState(''); // State to store profile picture URL

  const appointments = [
    { id: 1, type: 'Cat', date: '16 June', time: '8:30 AM', status: 'Confirmed' },
    { id: 2, type: 'Cat', date: '30 June', time: '12:30 PM', status: 'Pending' },
  ];

  useEffect(() => {
    liff.init({ liffId: '2006068191-vAnqlBk7' })
      .then(() => {
        if (liff.isLoggedIn()) {
          liff.getProfile()
            .then(profile => {
              setDisplayName(profile.displayName);
              setProfilePicture(profile.pictureUrl); // Store the profile picture URL
            })
            .catch(err => {
              console.error('Failed to get profile', err);
            });
        } else {
          liff.login(); // Prompt user to log in if not already logged in
        }
      })
      .catch(err => {
        console.error('LIFF initialization failed', err);
      });
  }, []);

  return (
    <Container>
      {/* avatar used to display the profile picture. */}
      <Grid container alignItems="center" spacing={2} style={{ marginBottom: '20px' }}>
        <Grid item>
          <Avatar alt={displayName} src={profilePicture} sx={{ width: 56, height: 56 }} /> 
        </Grid>
        <Grid item>
          <Typography variant="h5" gutterBottom>
            Hello, {displayName}!
          </Typography>
        </Grid>
      </Grid>

      {/* Services Button */}
      <Grid container spacing={2} style={{ marginBottom: '20px' }}>
        <Grid item xs={12} md={6}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={() => navigate('/services')}
          >
            Services
          </Button>
        </Grid>
      </Grid>

      {/* Appointments Section */}
      <Typography variant="h6" gutterBottom>
        Your Appointments
      </Typography>
        {appointments.map(appt => (
        <Card key={appt.id} style={{ marginBottom: 10 }}>
          <CardContent>
            <Typography variant="h6">{appt.type}</Typography>
            <Typography color="textSecondary">
              {appt.date} {appt.time}
            </Typography>
            <Typography color="textSecondary" style={{ marginBottom: '10px' }}>
              Status: {appt.status}
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => navigate(`/appointment/${appt.id}`)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
};

export default Home;

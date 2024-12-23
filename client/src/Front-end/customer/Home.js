import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Card, CardContent, Grid, Avatar, Box, BottomNavigation, BottomNavigationAction, AppBar, Toolbar, IconButton } from '@mui/material';
import { Home as HomeIcon, History as HistoryIcon, Pets as PetsIcon, Notifications as NotificationsIcon, Healing, Pets, Vaccines, Hotel } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

const api = 'http://localhost:8080/api/customer';

const Home = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState();
  const [profilePicture, setProfilePicture] = useState('https://via.placeholder.com/150');
  const [navValue, setNavValue] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const isFetched = useRef(false); // ย้ายมาไว้ภายนอก useEffect


  // ดึงข้อมูลผู้ใช้จาก sessionStorage
  const user = JSON.parse(sessionStorage.getItem('user')); 
  


  const fetchAppointments = async () => {
    if (!user) {
      console.error('User data not found');
      setAppointments([]); // กรณีไม่มีข้อมูลผู้ใช้
      return;
    }
  
    try {
      const { first_name, last_name, phone_number } = user;
  
      if (!first_name || !last_name || !phone_number) {
        console.error('Incomplete user data for fetching appointments');
        setAppointments([]); // กรณีข้อมูลผู้ใช้ไม่ครบ
        return;
      }
  
      const response = await axios.get(`${api}/appointments`, {
        params: {
          first_name,
          last_name,
          phone_number,
        },
      });

      console.log('API Params:', { first_name, last_name, phone_number });
      console.log('Response Data:', response.data);
  
      if (response.data && Array.isArray(response.data.appointments)) {
        setAppointments(response.data.appointments);
        console.log('Fetched appointments:', response.data.appointments); // ตรวจสอบค่าที่ได้จาก API
      } else {
        console.warn('No appointments found or invalid data format');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
      setAppointments([]);
    }
  };
  
  useEffect(() => {
    if (user && !isFetched.current) {
      setDisplayName(`${user.first_name}`);
      setProfilePicture('https://via.placeholder.com/150'); 
      fetchAppointments();
      isFetched.current = true; // ตั้งค่าสถานะว่าข้อมูลถูกดึงแล้ว
    }
  }, [user]);

  const handleNavChange = (event, newValue) => {
    setNavValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/customer/home/');
        break;
      case 1:
        navigate('/customer/history/');
        break;
      case 2:
        navigate('/customer/pets/');
        break;
      case 3:
        navigate('/customer/list/');
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar */}
      <AppBar position="fixed" sx={{ zIndex: 1100, backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            2 Vet's Pet Clinic
          </Typography>
          <IconButton edge="start" color="inherit" onClick={() => alert('เปิดการแจ้งเตือน')}>
            <NotificationsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ flex: 1, paddingTop: '80px', paddingBottom: '70px' }}>
        {/* Avatar Section */}
        <Grid container alignItems="center" spacing={2} sx={{ marginBottom: '20px' }}>
          <Grid item >
            <Avatar alt={displayName} src={profilePicture} sx={{ width: 64, height: 64 }} />
          </Grid>
          <Grid item>
            <Typography variant="h5" gutterBottom>
              Hello, {displayName}!
            </Typography>
          </Grid>
        </Grid>

         {/* Services Section */}
       
         <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              onClick={() =>
                navigate('/customer/serviceappointment', { state: { owner_id: appointments[0].owner_id } })
              }
              sx={{
                height: '100px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: '#b3e5fc',
                color: 'black',
                boxShadow: 5,
              }}
            >
               <Box sx={{ textAlign: 'left', marginLeft: '16px' }}>
                <Typography
                  sx={{
                    fontSize: '1.1rem', 
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                >
                  จองคิวเข้าใช้บริการ
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1rem', 
                    fontWeight: 'regular',
                  }}
                >
                  คลิกที่นี่!
                </Typography>
               </Box>

              <Avatar
                src="/petbutton.png"
                alt="จองคิวเข้าใช้บริการ"
                sx={{
                  width: 150,
                  height: 150,
                  marginLeft: 'auto', 
                }}
              />
            </Button>
          </Grid>
        </Grid>

        {/* Appointments Section */}
        <Typography variant="h6" gutterBottom>
          นัดหมายของคุณ
        </Typography>
        <Typography variant="h7" gutterBottom>
          *กรุณามาก่อนเวลานัด 10 นาที
        </Typography>
        
        {appointments.length === 0 ? (
            <Typography color="textSecondary">ไม่มีการนัดหมายในขณะนี้</Typography>
          ) : (
            <Grid container spacing={2} sx={{ paddingTop: 2 }} >
              {appointments.map((appt) => (
                appt.queue_status !== 'ยกเลิกนัด' && ( // เพิ่มเงื่อนไขตรงนี้
                  <Grid item xs={12} md={6} key={appt.appointment_id}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 5, 
                        boxShadow: 2, 
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      <CardContent sx={{ paddingTop: 1 }}>
                        <Grid container spacing={2}>
                          {/* Pet Image */}
                          <Grid item xs={4} container justifyContent="center" alignItems="center">
                            <Avatar
                              src={`http://localhost:8080${appt.image_url}`}
                              alt={appt.pet_name}
                              sx={{
                                width: 100,
                                height: 100,
                                borderRadius: 2,
                              }}
                            />
                          </Grid>
                  
                          {/* Appointment Details */}
                          <Grid item xs={7}>
                            <Typography variant="h6">{appt.pet_name}</Typography>
                            <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                              ประเภท: {appt.type_service}
                            </Typography>
                            <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                              วันที่นัดหมาย: {dayjs(appt.appointment_date).format("D MMMM YYYY")}
                            </Typography>
                            <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                              เวลา: {appt.appointment_time
                                ? dayjs(appt.appointment_time).format("HH:mm")
                                : "ตลอดทั้งวัน"}
                            </Typography>
                            <Typography color="textSecondary" sx={{ marginBottom: 2 ,fontSize: '0.85rem' }}>
                              สถานะ: {appt.status}
                            </Typography>
                          </Grid>
                        </Grid>
                  
                        {/* View Details Button below the appointment details */}
                        <Grid container justifyContent="center">
                          <Grid item xs={12}>
                            <Button
                              variant="outlined"
                              color="primary"
                              sx={{
                                marginTop: 1,
                                textTransform: 'none',
                                width: '100%', 
                                padding: '5px 5px', 
                                fontSize: '0.875rem',
                                borderRadius: 3, 
                                boxShadow: 1, 
                              }}
                              onClick={() =>
                                navigate('/customer/appointment/', {
                                  state: { appointmentId: appt.appointment_id, from: 'home' },
                                })
                              }
                            >
                              รายละเอียดเพิ่มเติม
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              ))}
            </Grid>
          )}
      </Container>

      {/* Bottom Navigation Bar */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <BottomNavigation
          value={navValue}
          onChange={handleNavChange}
          showLabels
          sx={{ backgroundColor: '#fff' }}
        >
          <BottomNavigationAction
            label="หน้าหลัก"
            icon={<HomeIcon />}
            value={0}
            sx={{
              '&.Mui-selected': {
                color: '#1976d2',
              },
            }}
          />
          <BottomNavigationAction
            label="ประวัติ"
            icon={<HistoryIcon />}
            value={1}
            sx={{
              '&.Mui-selected': {
                color: '#1976d2',
              },
            }}
          />
          <BottomNavigationAction
            label="สัตว์เลี้ยง"
            icon={<PetsIcon />}
            value={2}
            sx={{
              '&.Mui-selected': {
                color: '#1976d2',
              },
            }}
          />
        </BottomNavigation>
      </Box>

    </Box>
  );
};

export default Home;

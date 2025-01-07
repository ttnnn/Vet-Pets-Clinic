import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Card, CardContent, Grid, Avatar, Box, BottomNavigation, BottomNavigationAction, AppBar, Toolbar, IconButton, Divider } from '@mui/material';
import { Home as HomeIcon, History as HistoryIcon, Pets as PetsIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย
dayjs.extend(isSameOrAfter);

const api = 'http://localhost:8080/api/customer';

const Home = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState();
  const [profilePicture, setProfilePicture] = useState('https://via.placeholder.com/150');
  const [navValue, setNavValue] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const isFetched = useRef(false); // ย้ายมาไว้ภายนอก useEffect
  const [ownerId, setOwnerId] = useState()

  // ดึงข้อมูลผู้ใช้จาก sessionStorage
  const user = JSON.parse(sessionStorage.getItem('user')); 
  const today = dayjs().format("YYYY-MM-DD");
  const formattedTime = (time) => {
    if (!time) return 'ไม่ระบุเวลา';  // ถ้าไม่มีเวลาให้แสดง 'ไม่ระบุเวลา'
  
    // แยกเวลาออกจากค่าเวลาในรูปแบบ HH:mm:ss+07 และดึงเฉพาะ HH:mm
    const timePart = time.split('+')[0];  // เอาส่วนก่อนเครื่องหมาย '+'
    const formatted = timePart.slice(0, 5);  // ตัดเอาแค่ 5 ตัวแรก (HH:mm)
    return formatted;
  };
  
  const filteredAppointments = appointments.filter(
    (appt) =>
      appt.queue_status !== "ยกเลิกนัด" && // นัดหมายที่ไม่ถูกยกเลิก
      (dayjs(appt.appointment_date).isSameOrAfter(today, "day")) // นัดหมายของวันนี้หรือล่วงหน้า
  );
  

 
  // ใช้ useCallback เพื่อให้ fetchAppointments คงที่
  const fetchAppointments = useCallback(async () => {
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

      // console.log('API Params:', { first_name, last_name, phone_number });
      // console.log('Response Data:', response.data);

      if (response.data && Array.isArray(response.data.appointments)) {
        setAppointments(response.data.appointments);
        setOwnerId(response.data.owner_id)
        // console.log('Fetched appointments:', response.data.appointments); // ตรวจสอบค่าที่ได้จาก API
        // console.log('Fetched owner_id:', response.data.owner_id); 
      } else {
        console.warn('No appointments found or invalid data format');
        setOwnerId(response.data.owner_id)
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
      setAppointments([]);
    }
  }, [user]);  // ใส่ user ใน dependency array

  useEffect(() => {
    if (user && !isFetched.current) {
      setDisplayName(`${user.first_name}`);
      setProfilePicture(user.pictureUrl || 'https://via.placeholder.com/150');
      fetchAppointments();
      isFetched.current = true; // ตั้งค่าสถานะว่าข้อมูลถูกดึงแล้ว
    }
  }, [user, fetchAppointments]);  // ใส่ fetchAppointments ลงใน dependency array

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
                navigate('/customer/serviceappointment', { state: { owner_id: ownerId } })
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

        <Divider sx={{ marginBottom: 2, mt: 2}} /> {/* เส้นกั้นก่อนแสดงนัดหมาย */}
        
        {filteredAppointments.length === 0 ? (
        <Typography color="textSecondary">ไม่มีการนัดหมายในขณะนี้</Typography>
      ) : (
        <Grid container spacing={2} sx={{ paddingTop: 2 }}>
          {filteredAppointments.map((appt) => (
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
                    <Grid item xs={4} container justifyContent="center" alignItems="center">
                      <Avatar
                        src={`http://localhost:8080${appt.image_url}`}
                        alt={appt.pet_name}
                        sx={{ width: 100, height: 100  ,borderRadius: 2 }}
                      />
                    </Grid>
                    <Grid item xs={7}>
                      <Typography variant="h6">{appt.pet_name}</Typography>
                      <Typography color="textSecondary">ประเภท: {appt.type_service}</Typography>
                      <Typography color="textSecondary">
                        วันที่นัดหมาย: {dayjs(appt.appointment_date).format('D MMMM YYYY')}
                      </Typography>
                      <Typography color="textSecondary">
                        เวลา: {formattedTime(appt.appointment_time) || 'ไม่ระบุเวลา'}
                      </Typography>
                      <Typography color="textSecondary">สถานะ: {appt.status}</Typography>
                    </Grid>
                  </Grid>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() =>
                      navigate('/customer/appointment/', {
                        state: { appointmentId: appt.appointment_id },
                      })
                    }
                  >
                    รายละเอียดเพิ่มเติม
                  </Button>
                </CardContent>
              </Card>
            </Grid>
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

import React, { useEffect, useState, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Card, CardContent, Grid, Avatar, Button, AppBar, Toolbar, Box, BottomNavigation, BottomNavigationAction, Select, MenuItem, FormControl } from '@mui/material';
import { Home as HomeIcon, History as HistoryIcon, Pets as PetsIcon } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
dayjs.locale('th'); // ใช้ภาษาไทย

const api = 'http://localhost:8080/api/customer';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filterType, setFilterType] = useState(''); // ประเภทที่เลือก
  const [navValue, setNavValue] = useState(1); // ตั้งค่า default ที่ "ประวัติ"

  const user = JSON.parse(sessionStorage.getItem('user'));

  const fetchHistoryAppointments = useCallback(async () => {
    if (!user) {
      console.error('User data not found');
      setHistoryAppointments([]);
      return;
    }
  
    try {
      const { first_name, last_name, phone_number } = user;
  
      const response = await axios.get(`${api}/appointments/history`, {
        params: { first_name, last_name, phone_number },
      });
  
      // console.log('Fetched history appointments:', response.data);
  
      if (response.data && Array.isArray(response.data.appointments)) {
        // เช็คการเปลี่ยนแปลงของ appointments
        if (JSON.stringify(response.data.appointments) !== JSON.stringify(historyAppointments)) {
          setHistoryAppointments(response.data.appointments);
          setFilteredAppointments(response.data.appointments); // ตั้งค่าเริ่มต้น
        }
      } else {
        console.warn('No history appointments found or invalid data format');
        setHistoryAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching history appointments:', error.message);
      setHistoryAppointments([]);
    }
  }, [user, historyAppointments]);
  

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user'));
    if (userData) fetchHistoryAppointments();
  }, [fetchHistoryAppointments]); 
  

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setFilterType(value);

    if (value === '') {
      // หากไม่ได้เลือกฟิลเตอร์ ให้แสดงทั้งหมด
      setFilteredAppointments(historyAppointments);
    } else {
      // กรองตามประเภทบริการ
      const filtered = historyAppointments.filter((appt) => appt.type_service === value);
      setFilteredAppointments(filtered);
    }
  };

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
      default:
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: 1100, backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            ประวัติการนัดหมาย
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ flex: 1, paddingTop: '80px', paddingBottom: '70px' }}>
        <Typography variant="h7" sx={{ flexGrow: 1, textAlign: 'left'}}>
            ประเภทบริการ
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Select
            labelId="filter-label"
            value={filterType}
            onChange={handleFilterChange}
            displayEmpty
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            <MenuItem value="ตรวจรักษา">ตรวจรักษา</MenuItem>
            <MenuItem value="วัคซีน">วัคซีน</MenuItem>
            <MenuItem value="อาบน้ำ-ตัดขน">อาบน้ำ-ตัดขน</MenuItem>
          </Select>
        </FormControl>

        {filteredAppointments.length === 0 ? (
          <Typography color="textSecondary" align="center">
            ไม่มีประวัติการนัดหมายในขณะนี้
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredAppointments.map((appt) => (
              <Grid item xs={12} md={6} key={appt.appointment_id}>
                <Card sx={{ height: '100%', borderRadius: 5, boxShadow: 2, backgroundColor: '#f5f5f5' }}>
                  <CardContent sx={{ paddingTop: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4} container justifyContent="center" alignItems="center">
                        <Avatar
                          src={
                            appt.image_url
                              ? appt.image_url // ใช้ URL จากฐานข้อมูล
                              : '/default-image.png' // ใช้ภาพ Default หากไม่มีรูป
                          }
                          alt={appt.pet_name}
                          sx={{ width: 100, height: 100, borderRadius: 2 }}
                        />
                      </Grid>

                      <Grid item xs={7}>
                        <Typography variant="h6">{appt.pet_name}</Typography>
                        <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                          ประเภท: {appt.type_service}
                        </Typography>
                        <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                          วันที่นัดหมาย:{dayjs(appt.appointment_date).format("D MMMM YYYY")}
                          <br />
                          เวลา: {
                            appt.appointment_time
                            ? (() => {
                                const timeWithoutTimezone = appt.appointment_time.split('+')[0]; // ตัด timezone (+07)
                                const combinedDateTime = `${dayjs(appt.appointment_date).format('YYYY-MM-DD')}T${timeWithoutTimezone}`;
                                return dayjs(combinedDateTime).isValid()
                                  ? dayjs(combinedDateTime).format("HH:mm")
                                  : "ไม่ระบุเวลา";
                              })()
                            : "ไม่ระบุเวลา"
                          }
                        </Typography>
                        <Typography color="textSecondary" sx={{ marginBottom: 2, fontSize: '0.85rem' }}>
                          สถานะ: {appt.status}
                        </Typography>
                      </Grid>
                    </Grid>

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
                              state: { appointmentId: appt.appointment_id, from: 'history' },
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
            ))}
          </Grid>
        )}
      </Container>

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

export default HistoryPage;

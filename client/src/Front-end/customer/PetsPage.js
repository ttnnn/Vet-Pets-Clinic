import React, { useEffect, useState } from 'react';
import { Button, Grid, Card, CardContent, Typography, Box, AppBar, Toolbar, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import PetsIcon from '@mui/icons-material/Pets';
import { customerAPI  } from "../../utils/api";
import NotificationCustomer from './NotificationCustomer';
const PetsPage = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [navValue, setNavValue] = useState(2);

  const user = JSON.parse(sessionStorage.getItem('user')); // จากการล็อกอินของผู้ใช้

  useEffect(() => {
    const fetchPets = async () => {
      if (!user) {
        console.error('User data not found');
        setPets([]); // กรณีไม่มีข้อมูลผู้ใช้
        return;
      }
      try {
        const { first_name, last_name, phone_number } = user;
        if (!first_name || !phone_number) {
          console.error('Incomplete user data for fetching pets');
          setPets([]); // กรณีข้อมูลผู้ใช้ไม่ครบ
          return;
        }
        // เรียกข้อมูลการนัดหมายจาก API
        const response = await customerAPI.get(`/pets`, {
          params: {
            first_name,
            last_name,
            phone_number,
          },
        });
        // ตรวจสอบว่า response มีข้อมูล pets หรือไม่
        if (response.data && Array.isArray(response.data.pets)) {
          setPets(response.data.pets);
        } else {
          console.warn('No pets found or invalid data format');
          setPets([]);
        }
      } catch (error) {
        console.error('Error fetching pets:', error.message);
        setPets([]); // ตั้งค่าเป็นอาร์เรย์ว่างในกรณีเกิดข้อผิดพลาด
      }
    };
  
    fetchPets();
  }, [user]);  // Adding `user` as a dependency so it runs when `user` changes


  // Handle bottom navigation
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
            สัตว์เลี้ยงของคุณ 
          </Typography>
        </Toolbar>
      </AppBar>
      <NotificationCustomer />
      <Box sx={{ paddingTop: '80px', paddingBottom: '20px', flexGrow: 1, paddingX: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ marginBottom: 2 }}>
          รายชื่อสัตว์เลี้ยงของคุณ
        </Typography>
        {pets && pets.length > 0 ? (
          <Grid container spacing={2}>
            {pets.map((pet) => (
              <Grid item xs={12} sm={6} md={4} key={pet.pet_id}>
                <Card sx={{ height: '100%', backgroundColor: '#f5f5f5', borderRadius: 5, boxShadow: 3 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* แสดงรูปภาพ */}
                    {pet.image_url && (
                      <Box
                        sx={{
                          borderRadius: 2,
                          overflow: 'hidden',
                          width: 100,
                          height: 100,
                          marginRight: 2,
                        }}
                      >
                        <img
                          src={
                            pet.image_url
                              ? pet.image_url // ใช้ URL จากฐานข้อมูล
                              : '/default-image.png' // ใช้ภาพ Default หากไม่มีรูป
                          }
                          alt={pet.pet_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>
                    )}
                    {/* แสดงข้อมูลสัตว์เลี้ยง */}
                    <Grid item xs={7}>
                      <Typography variant="h6">{pet.pet_name}</Typography>
                      <Typography color="textSecondary">สายพันธุ์: {pet.pet_breed}</Typography>
                      <Typography color="textSecondary">ประเภท: {pet.pet_species}</Typography>
                    </Grid>
                  </CardContent>

                  <Box sx={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{
                        textTransform: 'none',
                        width: '100%',
                        fontSize: '0.875rem',
                        borderRadius: 3,
                        boxShadow: 1,
                      }}
                      onClick={() =>
                        navigate('/customer/petsdetail/', {
                          state: {petId: pet.pet_id }
                        })}
                    >
                      โปรไฟล์
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="textSecondary">ยังไม่มีสัตว์เลี้ยงในระบบ</Typography>
        )}
      </Box>

      {/* Bottom Navigation */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <BottomNavigation
          value={navValue}
          onChange={handleNavChange}
          showLabels // แสดงข้อความกำกับปุ่ม
          sx={{ backgroundColor: '#fff' }} // เพิ่มพื้นหลังให้กับ BottomNavigation
        >
          <BottomNavigationAction
            label="หน้าหลัก"
            icon={<HomeIcon />}
            value={0}
            sx={{
              '&.Mui-selected': {
                color: '#1976d2', // สีที่เปลี่ยนเมื่อกด
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

export default PetsPage;

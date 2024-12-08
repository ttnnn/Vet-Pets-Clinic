import React from 'react'; 
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Drawer, List, ListItem, ListItemText, ListItemIcon, Box, Typography, Button } from '@mui/material';

import logo from '../Logo.jpg'; 
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; // Icon for log out
import SettingsIcon from '@mui/icons-material/Settings';
//

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Hook for navigation

  const menuItems = [
    { text: 'หน้าหลัก', path: '/home', icon: <HomeIcon /> },
    { text: 'เวชระเบียน',  path: '/register', icon: <AssignmentIcon /> },
    { text: 'การนัดหมาย',  path: '/appointment', icon: <EventNoteIcon /> },
    { text: 'หมวดหมู่บริการ',  path: '/category', icon: <CategoryIcon /> },
    { text: 'การเงิน', path: '/finance', icon: <AttachMoneyIcon /> },
    { text: 'สถิติการใช้บริการ',  path: '/dashboard', icon: <BarChartIcon /> },
    { text: 'การตั้งค่าและสิทธิ์', path: '/admin', icon: <SettingsIcon /> },
  ];

  const handleLogout = () => {
    // เพิ่มโค้ดสำหรับการออกจากระบบที่นี่
    console.log('Logged out');

    // ตัวอย่าง: ลบโทเค็นและเปลี่ยนเส้นทางไปที่หน้า Login
    localStorage.removeItem('authToken');
    navigate('/'); // Navigate to the home page or login page
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: 240, 
          boxSizing: 'border-box',
          backgroundColor: 'white', // สีพื้นหลังของ Sidebar
          color: '#000', // สีข้อความใน Sidebar
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box sx={{ textAlign: 'center', padding: 1 }}>
        <img src={logo} alt="Logo" style={{ width: '60%', height: 'auto' }} />
        <Typography variant="h6" align="center" gutterBottom sx={{ fontSize: '1rem' , fontWeight: 'bold' }}>
          คลินิกรักษาสัตว์สองคุณหมอ
        </Typography>
      </Box>
      <List>
        {menuItems.map((item, index) => (
          <ListItem 
            button 
            key={index} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#b3e5fc', // สีพื้นหลังเมื่อถูกเลือก
                color: 'black', // สีข้อความเมื่อถูกเลือก
                '& .MuiListItemIcon-root': {
                  color: 'black', // สีของไอคอนเมื่อถูกเลือก
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? '#fff' : '#000' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {/* Log Out Button at the bottom */}
      <Box sx={{ position: 'absolute', bottom: 40, width: '100%', padding: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
          sx={{
            color: '#000', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '10px', // Rounded corners
            '&:hover': {
              backgroundColor: '#b3e5fc', // สีเมื่อเม้าชี้
              color: 'black', // สีข้อความเมื่อเม้าชี้
            },
          }}
        >
          ออกจากระบบ
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemText, ListItemIcon, Box, Typography } from '@mui/material';
import logo from '../Logo.jpg'; 

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'หน้าหลัก', path: '/home' },
    { text: 'เวชระเบียน',  path: '/register' },
    { text: 'การนัดหมาย',  path: '/appointment' },
    { text: 'หมวดหมู่บริการ',  path: '/category' },
    { text: 'การเงิน', path: '/finance' },
    { text: 'สถิติการใช้บริการ',  path: '/dashboard' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
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
                backgroundColor: '#000', // สีพื้นหลังเมื่อถูกเลือก
                color: '#fff', // สีข้อความเมื่อถูกเลือก
                '& .MuiListItemIcon-root': {
                  color: '#fff', // สีของไอคอนเมื่อถูกเลือก
                },
              },
              '&:hover': {
                backgroundColor: '#555', // สีพื้นหลังเมื่อ hover
                color: '#fff', // สีข้อความเมื่อ hover
                '& .MuiListItemIcon-root': {
                  color: '#fff', // สีของไอคอนเมื่อ hover
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Select, MenuItem } from '@mui/material';
import Sidebar from './Sidebar';
import axios from 'axios';
import TableAppointments from './component/TableAppointment';
import { styled } from '@mui/material/styles';
import AddAppointment from './component/CreateAppointment';
import { DateTime } from 'luxon';

const api = 'http://localhost:8080';

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'purple',
    backgroundColor: 'rgba(128, 0, 128, 0.2)',
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
  '& .MuiTabs-indicator': {
    backgroundColor: 'purple',
  },
}));

const AppointmentPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    updateAppointments(); // ดึงข้อมูลใหม่เมื่อเปลี่ยนแท็บ
  };

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
  };

  const updateAppointments = async () => {
    try {
      const appointmentsResponse = await axios.get(`${api}/appointment`);
      setAppointments(appointmentsResponse.data);
    } catch (error) {
      console.error('Error fetching updated appointments:', error);
    }
  };

  useEffect(() => {
    updateAppointments();
  }, []);

  useEffect(() => {
    const today = DateTime.now().startOf('day');
    const tomorrow = today.plus({ days: 1 });
    const thisMonthStart = today.startOf('month');
    const thisMonthEnd = today.endOf('month');

    const filterData = () => {
      return appointments.filter((appointment) => {
        const appointmentDate = DateTime.fromISO(appointment.appointment_date);

        // แสดงข้อมูลตามแท็บและประเภทฟิลเตอร์ที่เลือก
        if (activeTab === 0 && appointment.status !== 'รออนุมัติ') return false;
        if (activeTab === 1 && !['อนุมัติ', 'ยกเลิกนัด'].includes(appointment.status)) return false;

        switch (filterType) {
          case 'all':
            return appointmentDate >= today;
          case 'today':
            return appointmentDate.hasSame(today, 'day');
          case 'tomorrow':
            return appointmentDate.hasSame(tomorrow, 'day');
          case 'this_month':
            return appointmentDate >= thisMonthStart && appointmentDate <= thisMonthEnd;
          case 'this_pass':
            return appointmentDate < today;
          case 'cancel':
            return appointment.status === 'ยกเลิกนัด';
          default:
            return true;
        }
      });
    };

    setFilteredAppointments(filterData());
  }, [appointments, filterType, activeTab]);

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>ระบบจัดการนัดหมาย</Typography>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
            aria-label="full width tabs example"
          >
            <StyledTab label="นัดหมายใหม่(รออนุมัติ)" />
            <StyledTab label="สมุดนัดหมาย" />
            <StyledTab label="เพิ่มการนัดหมาย" />
          </Tabs>

          {activeTab !== 2 && (
            <Box sx={{
              width: '40%',
              height: '100px',
              marginLeft: 'auto',
              padding: 3,
              borderRadius: '10px',
            }}>
              <Select
                value={filterType}
                onChange={handleFilterChange}
                variant="outlined"
                fullWidth
              >
                <MenuItem value="all">คิวนัดหมายทั้งหมด</MenuItem>
                <MenuItem value="today">คิวนัดหมายวันนี้</MenuItem>
                <MenuItem value="tomorrow">คิวนัดหมายวันพรุ่งนี้</MenuItem>
                <MenuItem value="this_month">คิวนัดหมายเดือนนี้</MenuItem>
                <MenuItem value="this_pass">คิวนัดหมายที่ผ่านมาแล้ว</MenuItem>
                <MenuItem value="cancel">คิวนัดหมายที่ยกเลิก</MenuItem>
              </Select>
            </Box>
          )}

          {activeTab === 0 && (
            <TableAppointments
              setAppointments={setAppointments} 
              appointments={filteredAppointments}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
          {activeTab === 1 && (
            <TableAppointments
              setAppointments={setAppointments} 
              appointments={filteredAppointments}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
          {activeTab === 2 && <AddAppointment />}
        </Paper>
      </Box>
    </Box>
  );
};

export default AppointmentPage;

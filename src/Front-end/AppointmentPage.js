import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Select, MenuItem } from '@mui/material';
import Sidebar from './Sidebar';
import axios from 'axios';
import TableAppointments from './component/TableAppointment';
import { styled } from '@mui/material/styles';
import AddAppointment from './component/CreateAppointment';
import { DateTime } from 'luxon'; // For handling dates

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
    color: 'purple', // Change the text color for the selected tab
    backgroundColor: 'rgba(128, 0, 128, 0.2)', // Optional: background color when selected
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
  '& .MuiTabs-indicator': {
    backgroundColor: 'purple', // Change the color of the tab indicator
  },
}));

const AppointmentPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // State for dropdown filter

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appointmentsResponse = await axios.get(`${api}/appointment`);
        const petHotelResponse = await axios.get(`${api}/pethotel`); // Fetch PetHotel data
        const updatedAppointments = appointmentsResponse.data.map((appointment) => {
          if (appointment.type_service === 'ฝากเลี้ยง') {
            const relatedPetHotel = petHotelResponse.data.find(
              (petshotel) => petshotel.appointment_id === appointment.appointment_id
            );
            if (relatedPetHotel) {
              return { ...appointment, appointment_date: relatedPetHotel.entry_date };
            }
          }
          return appointment;
        });
        setAppointments(updatedAppointments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter appointments based on selected filter type
  const today = DateTime.now().startOf('day');
  const tomorrow = today.plus({ days: 1 });
  const thisMonthStart = today.startOf('month');
  const thisMonthEnd = today.endOf('month');

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = DateTime.fromISO(appointment.appointment_date);
    switch (filterType) {
      case 'all':
        return appointmentDate >= today;
      case 'today':
        return appointmentDate.hasSame(today, 'day')  ;
      case 'tomorrow':
        return appointmentDate.hasSame(tomorrow, 'day');
      case 'this_month':
        return appointmentDate >= thisMonthStart && appointmentDate <= thisMonthEnd;
      case 'this_pass'  :
        return appointmentDate < today;

        
      default:
        return true;
    }
  });

  const updateAppointments = () => {
    axios.get(`${api}/appointment`) // Assuming a GET endpoint to fetch all appointments
      .then((response) => setAppointments(response.data))
      .catch((error) => console.error('Error fetching updated appointments:', error));
  };

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
            <StyledTab onClick={updateAppointments} label="นัดหมายใหม่(รออนุมัติ)" />
            <StyledTab onClick={updateAppointments} label="สมุดนัดหมาย" />
            <StyledTab label="เพิ่มการนัดหมาย" />
          </Tabs>

          {/* Dropdown for filtering by appointment date */}
          {activeTab !== 2 && (
            <Box  sx={{
              width: '40%',  // กำหนดความกว้างเป็น 80% ของ container
              height: '100px',  // กำหนดความสูงเป็น 400px
              marginLeft: 'auto',  // ตั้งให้กล่องยึดขอบด้านขวา
              padding: 3,  // การเว้นระยะในกล่อง
              borderRadius: '10px',
              
            }}
          >
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
              </Select>
            </Box>
          )}

          {activeTab === 0 && (
            <TableAppointments
              appointments={filteredAppointments.filter(appt => appt.status === 'รออนุมัติ')}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setAppointments={setAppointments}
              statusFilter="รออนุมัติ"
            />
          )}
          {activeTab === 1 && (
            <TableAppointments
              appointments={filteredAppointments.filter(appt => appt.status === 'อนุมัติ')}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setAppointments={setAppointments}
              statusFilter="อนุมัติ"
            />
          )}
          {activeTab === 2 && <AddAppointment />}
        </Paper>
      </Box>
    </Box>
  );
};

export default AppointmentPage;

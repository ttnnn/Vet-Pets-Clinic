import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Tabs, Tab, MenuItem, Select, FormControl, InputLabel, TextField } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

const categories = ['ทั้งหมด', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover': {
    color: '#40a9ff',
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'black',
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

const AppointmentList = ({ appointments, searchQuery, setSearchQuery }) => {
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const filteredAppointments = appointments.filter(appointment => {
    if (activeCategory === 'ทั้งหมด') {
      return appointment.name.includes(searchQuery);
    }
    return appointment.category === activeCategory && appointment.name.includes(searchQuery);
  });

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          {categories.map(category => (
            <StyledTab
              key={category}
              label={category}
              value={category}
            />
          ))}
        </Tabs>
      </Box>
      <Box display="flex" alignItems="center" mt={2} mb={2}>
        <TextField
          label="ค้นหานัดหมาย"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, mr: 2 }}
        />
        <Button variant="contained" color="primary">ค้นหา</Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        {filteredAppointments.map((appointment, index) => (
          <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{appointment.name}</Typography>
            <Typography>เวลานัดหมาย : {appointment.time}</Typography>
            <Box mt={1} display="flex" justifyContent="flex-end">
              <Button variant="contained" color="secondary" sx={{ mr: 1 }}>
                ยกเลิก
              </Button>
              <Button variant="contained" color="primary">
                อนุมัติ
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
};

const AddAppointment = () => {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          เพิ่มการนัดหมายใหม่
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField label="ชื่อลูกค้า" variant="outlined" fullWidth />
          <TextField label="สัตว์เลี้ยง" variant="outlined" fullWidth />
          <FormControl fullWidth>
            <InputLabel id="appointment-type-label">ประเภทการนัดหมาย</InputLabel>
            <Select
              labelId="appointment-type-label"
              id="appointment-type"
              label="ประเภทการนัดหมาย"
              defaultValue=""
            >
              {categories.slice(1).map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <DatePicker
            label="เลือกวันที่"
            value={date}
            onChange={(newDate) => setDate(newDate)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
          <TimePicker
            label="เลือกเวลา"
            value={time}
            onChange={(newTime) => setTime(newTime)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
          <TextField
            label="รายละเอียดการนัดหมาย"
            variant="outlined"
            multiline
            rows={4}
            fullWidth
          />
          <Button variant="contained" color="primary">
            จอง
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

const AppointmentPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const appointments = [
    { name: 'นัดหมาย 1', time: '10:00 AM', category: 'อาบน้ำ-ตัดขน' },
    { name: 'นัดหมาย 2', time: '11:00 AM', category: 'ตรวจรักษา' },
    // เพิ่มรายการนัดหมายตามต้องการ
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            centered
          >
            <StyledTab label="นัดหมายใหม่(รออนุมัติ)" />
            <StyledTab label="สมุดนัดหมาย" />
            <StyledTab label="เพิ่มการนัดหมาย" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Box p={3}>
            <AppointmentList appointments={appointments} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </Box>
        )}
        {activeTab === 1 && (
          <Box p={3}>
            {/* เพิ่มเนื้อหาสำหรับสมุดนัดหมายที่นี่ */}
            <Typography>สมุดนัดหมาย</Typography>
          </Box> 
        )}
        {activeTab === 2 && (
          <Box p={3}>
            <AddAppointment />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AppointmentPage;

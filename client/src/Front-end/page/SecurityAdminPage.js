import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import ManageRoles from '../component/ManageRoles';  // Import ManageRole
import ManageHolidays from '../component/ManageHolidays';  // Import ManageHolidays
import Sidebar from './Sidebar';
import { styled } from '@mui/material/styles';

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: 18,

  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'black', // Selected text color
    backgroundColor: '#b3e5fc', // Background color when selected
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: 'black', // Custom indicator color
  },
}));

const SecurityAdminPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>การตั้งค่าและสิทธิ์</Typography>

          {/* Tabs */}
          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="inherit"
            variant="fullWidth"
            aria-label="Security Admin tabs"
          >
            <StyledTab label="จัดการสิทธิ์" />
            <StyledTab label="วันหยุด" />
          </StyledTabs>

          {/* Content */}
          {activeTab === 0 && <ManageRoles />}
          {activeTab === 1 && <ManageHolidays />}
        </Paper>
      </Box>
    </Box>
  );
};

export default SecurityAdminPage;

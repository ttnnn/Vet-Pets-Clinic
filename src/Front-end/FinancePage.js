import React from 'react';
import { Button, TextField, Typography, Box, Paper, Tabs, Tab, MenuItem, Select, InputBase } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';

const FinanceContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
}));

const FormRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '20px',
});

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

const CustomInput = styled(InputBase)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(3),
  },
  '& .MuiInputBase-input': {
    borderRadius: 4,
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #ced4da',
    fontSize: 16,
    padding: '10px 12px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:focus': {
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  },
}));

const FinancePage = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [filter, setFilter] = React.useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <FinanceContainer>
        <Paper sx={{ width: '100%' }}> {/* Full width */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            centered={false}
            TabIndicatorProps={{
              style: {
                backgroundColor: 'black',
              },
            }}
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <StyledTab label="ลูกค้าที่ค้างชำระเงิน" />
            <StyledTab label="ประวัติการชำระเงิน" />
          </Tabs>
          <Box p={3}>
            
            <Box component="form" noValidate autoComplete="off">
              <FormRow>
                <Select
                  value={filter}
                  onChange={handleFilterChange}
                  displayEmpty
                  input={<CustomInput />}
                >
                  <MenuItem value="">
                    <em>ทั้งหมด</em>
                  </MenuItem>
                  <MenuItem value="grooming">อาบน้ำ-ตัดขน</MenuItem>
                  <MenuItem value="checkup">ตรวจรักษา</MenuItem>
                  <MenuItem value="boarding">ฝากเลี้ยง</MenuItem>
                  <MenuItem value="vaccination">วัคซีน</MenuItem>
                </Select>
                <TextField
                  placeholder="เลขที่นัดหมาย,ชื่อลูกค้า,ชื่อสัตว์"
                  name="search"
                  variant="outlined"
                  fullWidth
                  sx={{ ml: 2 }}
                />
                <Button variant="contained" sx={{ ml: 2 }}>
                  <Typography variant="body2">
                    ค้นหา
                  </Typography>
                </Button>
              </FormRow>
              <Box>
                {/* This is where you would map your financial data */}
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Financial records will be displayed here.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </FinanceContainer>
    </Box>
  );
};

export default FinancePage;

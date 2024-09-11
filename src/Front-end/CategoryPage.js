import React from 'react';
import { Button, TextField, Typography, Box, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Sidebar from './Sidebar';

const CategoryContainer = styled(Box)(({ theme }) => ({
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
    color: 'white',
    backgroundColor: 'black',
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

const CategoryPage = () => {
  const [activeTab, setActiveTab] = React.useState(2); // Default to the "อาบน้ำ-ตัดขน" tab

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const categories = [
    { id: 'GM001', name: 'อาบน้ำหมา < 5kg.', price: '250 บาท', category: 'อาบน้ำ-ตัดขน' },
    { id: 'GM002', name: 'อาบน้ำหมา 5-10 kg.', price: '300 บาท', category: 'อาบน้ำ-ตัดขน' },
    // Add more services here for different categories
  ];

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <CategoryContainer>
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            centered={false}
            TabIndicatorProps={{
              style: {
                display: 'none',
              },
            }}
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <StyledTab label="ค่าผ่าตัด" />
            <StyledTab label="ฝากเลี้ยง" />
            <StyledTab label="อาบน้ำ-ตัดขน" />
            <StyledTab label="ค่าตรวจรักษา" />
            <StyledTab label="รายการยา" />
          </Tabs>
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              หมวดหมู่บริการ
            </Typography>
            <FormRow>
              <TextField
                placeholder="ค้นหา"
                variant="outlined"
                fullWidth
              />
              <Button variant="contained" sx={{ ml: 2 }}>
                + เพิ่มรายการ
              </Button>
            </FormRow>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>รหัส</TableCell>
                    <TableCell>ชื่อบริการ</TableCell>
                    <TableCell>ค่าบริการ</TableCell>
                    <TableCell>หมวดหมู่</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{service.id}</TableCell>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.price}</TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell>
                        <IconButton>
                          <EditIcon />
                        </IconButton>
                        <IconButton>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </CategoryContainer>
    </Box>
  );
};

export default CategoryPage;

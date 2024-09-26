import React, {  useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Tabs, Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';

const api = 'http://localhost:8080';

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

const categories = ['ทั้งหมด', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา','ฝากเลี้ยง','วัคซีน'];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


const TableAppointments = ({ appointments, searchQuery, setSearchQuery,setAppointments }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('AppointmentDate');
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');


  const handleApproveClick = async (AppointmentID) => {
    try {
      // Update the status to 'Approved' in the database
      await axios.put(`${api}/appointment/${AppointmentID}`, {
        Status: 'Approved',
      });

    } catch (error) {
      console.error('Failed to approve appointment:', error);
    }
  };
  const deleteAppointment = (AppointmentID) => {
    console.log("Deleting appointment with ID:", AppointmentID);
    axios.delete(`${api}/deleted/appointment/${AppointmentID}`)
      .then(() => {
        // Update the list of appointments after successful deletion
        setAppointments(appointments.filter(appt => appt.AppointmentID !== AppointmentID));
        alert('Appointment deleted successfully');
      })
      .catch((error) => {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete the appointment');
      });
  };
  
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  

  const filteredAppointments = appointments.filter(appointment => {
    const categoryMatch = activeCategory === 'ทั้งหมด' || appointment.TypeService === activeCategory;
    const searchMatch = 
      appointment.PetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.FullName?.toLowerCase().includes(searchQuery.toLowerCase());
     
    return categoryMatch && searchMatch  ;
  });
  // console.log(filteredAppointments)
  // console.log('Rendered appointments:', appointments);
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
        >
          {categories.map(category => (
            <StyledTab key={category} label={category} value={category} />
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'AppointmentDate'}
                  direction={orderBy === 'AppointmentDate' ? order : 'asc'}
                  onClick={(event) => handleRequestSort(event, 'AppointmentDate')}
                >
                  วันที่นัดหมาย
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'AppointmentTime'}
                  direction={orderBy === 'AppointmentTime' ? order : 'asc'}
                  onClick={(event) => handleRequestSort(event, 'AppointmentTime')}
                >
                  เวลา
                </TableSortLabel>
              </TableCell>
              <TableCell>ชื่อสัตว์</TableCell>
              <TableCell>ชื่อเจ้าของ</TableCell>
              <TableCell>ประเภทนัดหมาย</TableCell>
              <TableCell>รายละเอียด</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(appointment.AppointmentDate)}</TableCell>
                <TableCell>{appointment.AppointmentTime}</TableCell>
                <TableCell>{appointment.PetName}</TableCell>
                <TableCell>{appointment.FullName}</TableCell>
                <TableCell>{appointment.TypeService}</TableCell>
                <TableCell>{appointment.Reason || '-'}</TableCell>
                <TableCell>{appointment.Status}</TableCell>
                <TableCell>
                  {appointment.Status === 'waiting' && (
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => handleApproveClick(appointment.AppointmentID)}
                    >
                      อนุมัติ
                    </Button>
                  )}
                  {appointment.Status ==='Approved' &&(
                  <>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => deleteAppointment(appointment.AppointmentID)}
                    >
                    ยกเลิกนัด
                    </Button> 
                    <Button
                      variant="outlined" 
                      color="secondary" 
                    >  เลื่อนนัด
                    </Button> 
                  
                  </>                    
                  )}
                     
                </TableCell>
              </TableRow>  
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TableAppointments;

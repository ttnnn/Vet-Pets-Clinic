import React, {  useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Tabs, Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Postpone from './PostponeAppointment'; 

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
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [openPostponeDialog, setOpenPostponeDialog] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedTypeService, setSelectedTypeService] = useState(null);

  const handlePostponeClick = (appointmentId,typeService) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedTypeService(typeService);
    setOpenPostponeDialog(true);

    console.log('appointment;',appointmentId)
    console.log('typeService;',typeService)
  };

  const updateAppointments = () => {
    axios.get(`${api}/appointment`) // Assuming a GET endpoint to fetch all appointments
      .then((response) => setAppointments(response.data))
      .catch((error) => console.error('Error fetching updated appointments:', error));
  };

  const handleApproveClick = (AppointmentID) => {
    //เขียนกล่องมาดัก ก่อน อนุมัติ
    try {
      // Update the status to 'Approved' in the database
      axios.put(`${api}/appointment/${AppointmentID}`, {
        status: 'approved',
        queue_status: 'รอรับบริการ'
      });
      alert('Appointment  successfully');
      updateAppointments()
    } catch (error) {
      console.error('Failed to approve appointment:', error);
    }
  };

  const deleteAppointment = (AppointmentID) => {
    console.log("Deleting appointment with ID:", AppointmentID);
    axios.delete(`${api}/deleted/appointment/${AppointmentID}`)
      .then(() => {
        // Update the list of appointments after successful deletion
        setAppointments(appointments.filter(appt => appt.appointment_id !== AppointmentID));
        alert('Appointment deleted successfully');
      })
      .catch((error) => {
        console.log("Deleting :", AppointmentID);
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
    const categoryMatch = activeCategory === 'ทั้งหมด' || appointment.type_service === activeCategory;
    const searchMatch = 
      appointment.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
     
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
                  active={orderBy === 'appointment_date'}
                  direction={orderBy === 'appointment_date' ? order : 'asc'}
                  onClick={(event) => handleRequestSort(event, 'appointment_date')}
                >
                  วันที่นัดหมาย
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'appointment_time'}
                  direction={orderBy === 'appointment_time' ? order : 'asc'}
                  onClick={(event) => handleRequestSort(event, 'appointment_time')}
                >
                  เวลา
                </TableSortLabel>
              </TableCell>
              <TableCell>ชื่อสัตว์</TableCell>
              <TableCell>ชื่อเจ้าของ</TableCell>
              <TableCell>ประเภทนัดหมาย</TableCell>
              <TableCell>นัดมา</TableCell>
              <TableCell>รายละเอียด</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                <TableCell>{appointment.appointment_time|| 'all-day'}</TableCell>
                <TableCell>{appointment.pet_name}</TableCell>
                <TableCell>{appointment.full_name}</TableCell>
                <TableCell>{appointment.type_service}</TableCell>
                <TableCell>{appointment.detail_service || '-'}</TableCell>
                <TableCell>{appointment.reason || '-'}</TableCell>
                <TableCell>{appointment.status}</TableCell>
                
                <TableCell>
                  {appointment.status === 'waiting' && (
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => handleApproveClick(appointment.appointment_id)}
                    >
                      อนุมัติ
                    </Button>
                  )}
                  {appointment.status ==='approved' &&(
                  <>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => deleteAppointment(appointment.appointment_id)}
                    >
                    ยกเลิกนัด
                    </Button> 
                    <Button
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => handlePostponeClick(appointment.appointment_id, appointment.type_service)}
                    >  เลื่อนนัด
                    </Button> 
                    {selectedAppointmentId && (
                      <Postpone
                        open={openPostponeDialog}
                        handleClose={() => setOpenPostponeDialog(false)}
                        appointmentId={selectedAppointmentId}
                        TypeService= {selectedTypeService}
                        updateAppointments={updateAppointments}
                       />
                     )}
                    
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

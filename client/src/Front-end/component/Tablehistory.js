import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,Divider
} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import FolderIcon from '@mui/icons-material/Folder';
import { jwtDecode } from 'jwt-decode';
import { clinicAPI } from "../../utils/api";
dayjs.locale('th');

const formatDate2 = (dateString) => dayjs(dateString).format('DD MMMM YYYY');
const formatDate = (dateString) => dayjs(dateString).format('DD/MM/YYYY');
const formatTime = (timeString) => timeString?.split(':').slice(0, 2).join(':');

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

const CardLayout = ({ appointment ,handleOpenDialog }) => (

  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    border="1px solid #ddd"
    borderRadius="8px"
    padding="16px"
    marginBottom="8px"
    backgroundColor="#f9f9f9"
  >
    <Box display="flex" alignItems="center" flexDirection="column">

    <Box display="flex" alignItems="flex-start" flexDirection="column" textAlign="left">
      <Box display="flex" alignItems="center" mb={1}>
        <FolderIcon style={{ marginRight: '12px', color: '#757575' }} />
        <Typography variant="body1" fontWeight="bold">
          {formatDate2(appointment.appointment_date)}
        </Typography>
      </Box>
    
      <Typography variant="body2" color="textSecondary">
        แก้ไขล่าสุด : {appointment.rec_time ? dayjs(appointment.rec_time).format('DD MMMM YYYY HH:mm') : '-'}
      </Typography>

     
     
</Box>
</Box>

    <Box>
      <Typography variant="body2" color="textSecondary">
        {appointment.detail_service || 'ไม่มีรายละเอียด'}
      </Typography>

        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleOpenDialog(appointment)}
        >
          แสดงรายละเอียด
        </Button>
      
    </Box>
  </Box>
);

const TableHistory = ({ appointments, searchQuery, setSearchQuery, activeTabLabel, selectedPetId ,onEditClick  }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [mergedAppointments, setMergedAppointments] = useState([]);
  const [details, setDetails] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const handleEdit = (id) => {
    onEditClick(id); // เรียกใช้ onEditClick ที่ส่งจาก ProfilePage เพื่อเปลี่ยน activeTab และส่ง appointmentId
  };
  const token = sessionStorage.getItem('token');
  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      setUserRole(decodedToken?.role);
    }
  }, [token]); // ให้ useEffect ทำงานเมื่อ token เปลี่ยน

  useEffect(() => {
    const fetchVaccines = async () => {
      if (activeTabLabel === 'วัคซีน') {
        try {
          const ids = appointments
            .filter((appointment) => appointment.type_service === 'วัคซีน')
            .map((appointment) => appointment.appointment_id);

          const response = await clinicAPI.post(`/appointment/vaccien`, { ids });
          const vaccineDataMap = response.data.reduce((acc, curr) => {
            acc[curr.appointment_id] = curr.category_name;
            return acc;
          }, {});

          const updatedAppointments = appointments.map((appointment) => ({
            ...appointment,
            category_name: vaccineDataMap[appointment.appointment_id] || 'ไม่มีข้อมูลวัคซีน',
          }));

          setMergedAppointments(updatedAppointments);
        } catch (error) {
          console.error('Error fetching vaccines:', error);
        }
      } else {
        setMergedAppointments(appointments);
      }
    };

    fetchVaccines();
  }, [appointments, activeTabLabel]);

  const fetchDetails = async (appointmentId) => {
    if (!appointmentId || appointmentId === details?.appointmentId) return;
  
    try {
      const response = await clinicAPI.get(`/history/medical/${appointmentId}`);
      setDetails({ ...response.data, appointmentId }); // เก็บ appointmentId เพื่อการตรวจสอบ
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };
  


  const handleOpenDialog = (appointment) => {
    fetchDetails(appointment.appointment_id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDetails(null);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAppointments = mergedAppointments.filter((appointment) => {
    const matchesPetAndTypeService =
      appointment.pet_id === selectedPetId &&
      appointment.type_service === activeTabLabel &&
      appointment.status !== 'รออนุมัติ' &&  appointment.status !== 'ยกเลิกนัด'


    const matchesSearchQuery =
      appointment.appointment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appointment.appointment_date && appointment.appointment_date.includes(searchQuery));

    return matchesPetAndTypeService && matchesSearchQuery;
  });

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box display="flex" alignItems="center" mt={2} mb={2}>
        <TextField
          label="ค้นหาเลขนัดหมาย"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, mr: 2 }}
        />
        <Button variant="contained" color="primary">
          ค้นหา
        </Button>
      </Box>

      {filteredAppointments.length === 0 ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          ไม่มีประวัติ
        </Typography>
      ) : activeTabLabel === 'ตรวจรักษา' ? (
        <Box>
          {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment, index) => (
            <CardLayout key={index} appointment={appointment}  handleOpenDialog ={handleOpenDialog}  />

          ))}
        </Box>
      ) : (
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
                <TableCell>เลขนัดหมาย</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'appointment_time'}
                    direction={orderBy === 'appointment_time' ? order : 'asc'}
                    onClick={(event) => handleRequestSort(event, 'appointment_time')}
                  >
                    เวลา
                  </TableSortLabel>
                </TableCell>
                <TableCell>รายละเอียด</TableCell>
                {activeTabLabel === 'วัคซีน' && <TableCell>ชื่อวัคซีน</TableCell>}
      

              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                  <TableCell>{appointment.appointment_id}</TableCell>
                  <TableCell>
                    {appointment.appointment_time ? formatTime(appointment.appointment_time) : 'ตลอดทั้งวัน'}
                  </TableCell>
                  <TableCell>{appointment.reason || '-'}</TableCell>
                  {activeTabLabel === 'วัคซีน' && (
                    <TableCell>{appointment.category_name || 'ไม่มีข้อมูลวัคซีน'}</TableCell>
                  )}

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>รายละเอียดการรักษา</DialogTitle>
      <DialogContent>
        {details ? (
          <Box>
            {/* ส่วนข้อมูลทั่วไป */}
            <Typography variant="h6" gutterBottom>ข้อมูลทั่วไป</Typography>
            <Typography variant="body1">ชื่อสัตว์เลี้ยง: {details.pet_name || 'ไม่มีข้อมูล'}</Typography>
            <Typography variant="body1">เลขที่นัดหมาย : {details.appointment_id || 'ไม่มีข้อมูล'}</Typography>
            <Typography variant="body1">สัตวแพทย์ที่รับผิดชอบ : {details.personnel_name || 'ไม่มีข้อมูล'}</Typography>
            <Typography variant="body2" color="textSecondary">
               แก้ไขล่าสุด : {details.rec_time ? dayjs(details.rec_time).format('DD MMMM YYYY HH:mm') : '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />
        
            {/* ส่วนการวินิจฉัย */}
            <Typography variant="h6" gutterBottom>ข้อมูลการวินิจฉัย</Typography>
            <Typography variant="body1">CC: {details.diag_cc || '-'}</Typography>
            <Typography variant="body1">HT: {details.diag_ht || '-'}</Typography>
            <Typography variant="body1">PE: {details.diag_pe || '-'}</Typography>
            <Typography variant="body1">ปัญหาหลัก: {details.diag_majorproblem || '-'}</Typography>
            <Typography variant="body1">Tentative DX: {details.diag_tentative || '-'}</Typography>
            <Typography variant="body1">Final DX: {details.diag_final || '-'}</Typography>
            <Typography variant="body1">การรักษา: {details.diag_treatment || '-'}</Typography>
            <Typography variant="body1">หมายเหตุ: {details.diag_note || '-'}</Typography>
        
            <Divider sx={{ my: 2 }} />
        
              {/* ส่วนการตรวจร่างกาย */}
            <Typography variant="h6" gutterBottom>ผลการตรวจร่างกาย</Typography>
            {Object.entries(details)
              .filter(
                ([key, value]) =>
                  key.startsWith('phy_') && value !== 'no exam' &&   value !== null // เงื่อนไขการกรองข้อมูล
              )
              .map(([key, value]) => (
                <Typography key={key} variant="body1">
                  {key.replace('phy_', '').replace(/_/g, ' ').toUpperCase()}: {value}
                </Typography>
              ))}
    
          </Box>
        ) : (
          <Typography variant="body2" align="center">ไม่พบข้อมูล</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} color="secondary">
          ปิด
        </Button>
        <Button onClick={() => handleEdit(details.appointment_id)} 
           disabled={
            userRole !== 'สัตวแพทย์'
          }
          
          >แก้ไข</Button>
     
      </DialogActions>
    </Dialog>
      
    </Paper>
  );
};

export default TableHistory;

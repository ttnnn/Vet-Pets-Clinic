import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Typography
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // นำเข้า locale ภาษาไทย

dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

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


const formatDate2 = (dateString) => dayjs(dateString).format('DD MMMM YYYY');
const formatDate = (dateString) => dayjs(dateString).format('DD/MM/YYYY');
const formatTime = (timeString) => timeString.split(':').slice(0, 2).join(':');

const CardLayout = ({ appointment }) => (
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
    <Box display="flex" alignItems="center">
      <FolderIcon style={{ marginRight: '12px', color: '#757575' }} />
      <Typography variant="body1" fontWeight="bold">
        {formatDate2(appointment.appointment_date)}
      </Typography>
    </Box>
    <Box>
      <Typography variant="body2" color="textSecondary">
        {appointment.detail_service || 'ไม่มีรายละเอียด'}
      </Typography>
    </Box>
  </Box>
);

const TableHistory = ({ appointments, searchQuery, setSearchQuery, activeTabLabel, selectedPetId }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesPetAndTypeService =
      appointment.pet_id === selectedPetId &&
      appointment.type_service === activeTabLabel &&
      appointment.status !== 'รออนุมัติ';

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

      {activeTabLabel === 'ตรวจรักษา' ? (
        <Box>
          {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment, index) => (
            <CardLayout key={index} appointment={appointment} />
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
                <TableCell>นัดมา</TableCell>
                <TableCell>รายละเอียด</TableCell>
                <TableCell>สถานะ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                  <TableCell>{appointment.appointment_id}</TableCell>
                  <TableCell>{appointment.appointment_time ? formatTime(appointment.appointment_time) : 'ตลอดทั้งวัน'}</TableCell>
                  <TableCell>{appointment.detail_service || '-'}</TableCell>
                  <TableCell>{appointment.reason || '-'}</TableCell>
                  <TableCell>{appointment.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default TableHistory;

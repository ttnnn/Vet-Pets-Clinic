import React, { useState ,useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputAdornment, InputLabel,  OutlinedInput, Alert,Snackbar ,Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import axios from 'axios';
import FolderIcon from '@mui/icons-material/Folder';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
dayjs.locale('th');

const api = 'http://localhost:8080/api/clinic';

// Utility functions
const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

const getComparator = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

const formatDate = (dateString) => dayjs(dateString).format('DD/MM/YYYY');
const formatDate2 = (dateString) => dayjs(dateString).format('DD MMMM YYYY');
const formatTime = (timeString) => timeString?.split(':').slice(0, 2).join(':');
// ฟังก์ชัน formatDate สำหรับวันที่

const formatDateAdmit = (dateTimeString) => {
  const date = dayjs(dateTimeString).format('DD MMMM YYYY');
  return date;
};

// ฟังก์ชัน formatTime สำหรับเวลา
const formatAdmit = (dateTimeString) => {
  const time = dayjs(dateTimeString).format('HH:mm');
  return time;
};

// Reusable Button Component
const AddRecordButton = ({ onClick }) => (
  <Button variant="contained" color="primary" size="small" onClick={onClick}>
    เพิ่มบันทึก
  </Button>
);

const RecordCard = ({ record }) => (
  <Box
    display="flex"
    flexDirection="column"
    border="1px solid #ddd"
    borderRadius="8px"
    padding="16px"
    marginBottom="8px"
    backgroundColor="#f9f9f9"
  >
    <Typography variant="body1" fontWeight="bold">
      วันที่บันทึก: {formatDateAdmit(record.record_time)} เวลา: {formatAdmit(record.record_time)}
    </Typography>
    <Typography variant="body2" color="textSecondary">
      {record.record_medical}
    </Typography>
  </Box>
);

const CardLayout = ({ appointment, onOpenDialog }) => {
  const [records, setRecords] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // ฟังก์ชันดึงข้อมูลจาก API ตาม appointment_id
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(`${api}/admitrecord?appointment_id=${appointment.appointment_id}`);
        const data = await response.json();

        // กรองข้อมูลให้เลขนัดหมายที่ซ้ำกันแสดงแค่ครั้งเดียว
        const filteredRecords = data.data.reduce((acc, record) => {
          if (!acc.some((r) => r.appointment_id === record.appointment_id)) {
            acc.push(record);
          }
          return acc;
        }, []);

        setRecords(filteredRecords);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };

    fetchRecords();
  }, [appointment.appointment_id]);

  // ฟังก์ชันเปิด/ปิดดูรายละเอียด
  const toggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      border="1px solid #ddd"
      borderRadius="8px"
      padding="16px"
      marginBottom="8px"
      backgroundColor="#f9f9f9"
    >
      {/* Main card content */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <FolderIcon style={{ marginRight: '12px', color: '#757575' }} />
          <Typography variant="body1" fontWeight="bold">
          {formatDate2(appointment.appointment_date)}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {appointment.appointment_id}
        </Typography>
        <Box>
          <Typography variant="body2" color="textSecondary">
            {appointment.queue_status || 'ไม่มีรายละเอียด'}
          </Typography>
        </Box>
        <AddRecordButton onClick={() => onOpenDialog(appointment)} />
      </Box>

      {/* Sub-cards section */}
      <Collapse in={isExpanded}>
        <List>
          {records.length > 0 ? (
            records.map((record) => (
              <ListItem key={record.appointment_id}>
                <RecordCard record={record} />
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary" padding="8px">
              ยังไม่มีการบันทึก
            </Typography>
          )}
        </List>
      </Collapse>

      {/* Button to toggle the expansion of sub-cards */}
      <Button variant="text" size="small" onClick={toggleDetails}>
        {isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
      </Button>
    </Box>
  );
};

const RecordMedical = ({
  appointments,
  searchQuery,
  setSearchQuery,
  activeTabLabel,
  selectedPetId
}) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");   // ข้อความสำหรับ Alert
  const [alertSeverity, setAlertSeverity] = useState("info"); // กำหนดประเภทของ alert
  const [openSnackbar, setOpenSnackbar] = useState(false); 

  const [formMedical, setFormMedical] = useState({
    admit_temp: null,
    admit_pressure: null,
    admit_heartrate: null,
    rec_timee: dayjs().format('HH:mm'),
    rec_date: dayjs().format('YYYY-MM-DD'),
    record_medical:'',
    record_medicine:''
  });

  const handleMedicalChange = (field) => (event) => {
    setFormMedical({
      ...formMedical,
      [field]: event.target.value,
    });
  };

  const handleOpenDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
    handleReset();
  };
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);  // ปิด Snackbar
  };

  const handleReset = () => {
    const now = dayjs();
    setFormMedical({
      rec_temperature: '',
      rec_pressure: '',
      rec_heartrate: '',
      rec_weight: '',
      rec_timee: now.format('HH:mm'),
      rec_date: now.format('YYYY-MM-DD'),
    });}

  const handleSubmit = async () => {
  
    if (!formMedical.admit_temp ) {
      setAlertMessage("กรุณากรอกอุณหภูมิที่ถูกต้อง");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      return;
    }
  
    if (!formMedical.record_medical ) {
      setAlertMessage("กรุณากรอกข้อมูลบันทึกอาการ");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      return;
    }

    // รวมวันที่และเวลา
    const timestamp = dayjs(`${formMedical.rec_date} ${formMedical.rec_timee}`).format('YYYY-MM-DD HH:mm:ss');
    // console.log('personnel_id' , selectedPersonnel)
    // เตรียม payload สำหรับ backend
    const payload = {
      admit_temp: parseFloat(formMedical.admit_temp),
      admit_pressure: formMedical.admit_pressure || null,
      admit_heartrate: formMedical.admit_heartrate || null,
      record_time: timestamp,
      record_medical: formMedical.record_medical,
      record_medicine: formMedical.record_medicine,
      appointment_id: selectedAppointment?.appointment_id,
}
    console.log("data:",payload);
    try {
 
      const response = await axios.post(`${api}/admitrecord`, payload);
      setAlertMessage("ข้อมูลได้ถูกบันทึกสำเร็จ!");
      setAlertSeverity("success");  // ประเภทของ Alert
      setOpenSnackbar(true);
      handleCloseDialog();
      
    } catch (error) {
      setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setAlertSeverity("error");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
    }
  };
  

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter and sort appointments
  const filteredAppointments = appointments
    .filter((appointment) =>
      appointment.pet_id === selectedPetId &&
      appointment.status !== 'รออนุมัติ' &&
      appointment.queue_status === 'admit' &&
      (appointment.appointment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appointment.appointment_date &&
          appointment.appointment_date.includes(searchQuery)))
    )
    .sort(getComparator(order, orderBy));

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
       <Snackbar
        open={openSnackbar}
        autoHideDuration={6000} // ปิดเองหลัง 6 วินาที
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // แสดงตรงกลาง
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={alertSeverity}
          sx={{
            width: '100%',
            fontSize: '1rem',  // ปรับขนาดข้อความให้ใหญ่ขึ้น
            padding: '10px',  // เพิ่ม padding
            borderRadius: '8px', // ทำมุมมน
            boxShadow: 3, // เพิ่มเงาให้ดูเด่น
          }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>

      {/* Search Box */}
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

      {/* Conditional Rendering */}
      {filteredAppointments.length === 0 ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          ไม่มีประวัติ
        </Typography>
      ) : activeTabLabel === 'บันทึกพักรักษา' ? (
        <Box>
          {filteredAppointments.map((appointment, index) => (
            <CardLayout
              key={index}
              appointment={appointment}
              onOpenDialog={handleOpenDialog}
            />
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
                    onClick={(e) => handleRequestSort(e, 'appointment_date')}
                  >
                    วันที่นัดหมาย
                  </TableSortLabel>
                </TableCell>
                <TableCell>เลขนัดหมาย</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'appointment_time'}
                    direction={orderBy === 'appointment_time' ? order : 'asc'}
                    onClick={(e) => handleRequestSort(e, 'appointment_time')}
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
              {filteredAppointments.map((appointment, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                  <TableCell>{appointment.appointment_id}</TableCell>
                  <TableCell>
                    {appointment.appointment_time
                      ? formatTime(appointment.appointment_time)
                      : 'ตลอดทั้งวัน'}
                  </TableCell>
                  <TableCell>{appointment.detail_service || '-'}</TableCell>
                  <TableCell>{appointment.reason || '-'}</TableCell>
                  <TableCell>{appointment.status}</TableCell>
                  <TableCell>
                    <AddRecordButton onClick={() => handleOpenDialog(appointment)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>นัดหมายที่ #{selectedAppointment?.appointment_id || 'ไม่ระบุ'}</DialogTitle>
        <DialogContent>
        <Box display="flex" flexDirection="row" gap={3} alignItems="center" mb={3}>
  
          <TextField
            label="วันที่"
            type="date"
            value={formMedical.rec_date}
            onChange={handleMedicalChange('rec_date')}
            margin="normal"
            style={{ maxWidth: '30%' }}
          />
          <TextField
            label="เวลา"
            type="time"
            value={formMedical.rec_timee}
            onChange={handleMedicalChange('rec_time')}
            margin="normal"
            style={{ maxWidth: '30%' }}
          /> 
         </Box>
         <Box display="flex" flexDirection="row" gap={5}>
            {/* Temperature */}
            <FormControl variant="outlined" sx={{ width: '25ch' }}>
              <InputLabel shrink>Temperature</InputLabel>
              <OutlinedInput
                type="text"
                value={formMedical.admit_temp}
                onChange={handleMedicalChange('admit_temp')}
                endAdornment={<InputAdornment position="end">°C</InputAdornment>}
                label="Temperature"
              />
            </FormControl>
            {/* Pressure */}
            <FormControl variant="outlined" sx={{ width: '25ch' }}>
              <InputLabel shrink>Pressure</InputLabel>
              <OutlinedInput
                type="text"
                value={formMedical.admit_pressure}
                onChange={handleMedicalChange('admit_pressure')}
                placeholder="ตัวอย่าง: 120/80"
                endAdornment={<InputAdornment position="end">mmHg</InputAdornment>}
                label="Pressure"
              />
            </FormControl>
            {/* Heart Rate */}
            <FormControl variant="outlined" sx={{ width: '25ch' }}>
              <InputLabel shrink>Heart Rate</InputLabel>
              <OutlinedInput
                type="text"
                value={formMedical.admit_heartrate}
                onChange={handleMedicalChange('admit_heartrate')}
                endAdornment={<InputAdornment position="end">bpm</InputAdornment>}
                label="Heart Rate"
              />
            </FormControl>
        </Box>
        <Box>
          <TextField
              fullWidth
              label="บันทึกอาการ"
              name="record_medical"
              value={formMedical.record_medical}
              onChange={handleMedicalChange('record_medical')}
              margin="normal"
              multiline
              rows={4}
         />
  
        {/* Record Medicine */}
        <TextField
              fullWidth
              label="บันทึกการให้ยา"
              name="record_medicine"
              value={formMedical.record_medicine}
              onChange={handleMedicalChange('record_medicine')}
              margin="normal"
              multiline
              rows={4}
          />
        </Box>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="error">ยกเลิก</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">บันทึก</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
export default RecordMedical;

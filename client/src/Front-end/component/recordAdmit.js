import React, { useState ,useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputAdornment, InputLabel,  OutlinedInput, Alert,Snackbar ,Collapse,
  List,
  ListItem, IconButton,CircularProgress
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';
import { clinicAPI } from "../../utils/api";
import 'dayjs/locale/th';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

dayjs.locale('th');

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
  return dayjs(dateTimeString).format('DD MMMM YYYY');
};
const formatAdmit = (dateTimeString) => {
  return dayjs(dateTimeString).format('HH:mm');
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
    padding="10px"
    marginBottom="8px"
    backgroundColor="#fffffc"
    flex='1'
  >
    <Typography variant="body1" fontWeight="bold">
      วันที่บันทึก: {(record.record_time)} เวลา: {(record.record_time)}
    </Typography>

  </Box>
);
const CardLayout = ({ appointment, onOpenDialog, updatedRecords }) => {
  // const [records, setRecords] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    // กรองข้อมูล updatedRecords ที่สัมพันธ์กับ appointment นี้เท่านั้น
    if (Array.isArray(updatedRecords)) {
      const appointmentRecords = updatedRecords.filter(
        (record) => record.appointment_id === appointment.appointment_id
      );
      setFilteredRecords(appointmentRecords);
    }
  }, [updatedRecords, appointment.appointment_id]);

  useEffect(() => {
    const fetchRecords = async () => {
      
      setIsLoading(true);
      try {
        const response = await clinicAPI.get(`/admitrecord?appointment_id=${appointment.appointment_id}`);
        if (response.status === 404) {
          console.log("No records found for this appointment.");
          setFilteredRecords([]); // ตั้งค่าว่างสำหรับกรณีไม่มีข้อมูล
          return;
        }
        const data = response.data;
        
        if (!data.data || data.data.length === 0) {
          console.log("No records found for this appointment.");
          setFilteredRecords([]);
          return;
        }
        // setRecords(data.data);
        setFilteredRecords(data.data);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
    
  }, [appointment.appointment_id, updatedRecords]);

  const toggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = (record) => {
    setSelectedRecord(record); // กำหนดข้อมูลการ์ดที่ถูกเลือก
  };

  const handleCloseDetails = () => {
    setSelectedRecord(null); // ล้างข้อมูลการเลือก
  };

  return (
    <Box display="flex">
      {/* Main section on the left */}
      <Box
        display="flex"
        flexDirection="column"
        border="1px solid #ddd"
        borderRadius="8px"
        padding="16px"
        marginBottom="8px"
        backgroundColor="#f9f9f9"
        flex="1"
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <FolderIcon style={{ marginRight: '12px', color: '#757575' }} />
            <Typography variant="body1" fontWeight="bold">
              {formatDate2(appointment.appointment_date)} ({appointment.appointment_id})
            </Typography>
          </Box>
          <AddRecordButton onClick={() => onOpenDialog(appointment)} />
        </Box>

        <Collapse in={isExpanded}>
          <Box display="flex" flexDirection="row" justifyContent="space-between">
            <List style={{ flex: 1 }}>
              {isLoading ? (
                <Typography variant="body2" color="textSecondary" padding="8px">
                  กำลังโหลดข้อมูล...
                </Typography>
              ) : Array.isArray(filteredRecords) && filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => (
                  <ListItem
                    key={`${record.record_time}-${index}`}
                    style={{ marginBottom: '8px', borderRadius: '8px' }}
                  >
                    <RecordCard record={record} />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleCardClick(record)}
                      style={{
                        marginLeft: '8px',
                        backgroundColor:
                          selectedRecord?.record_time === record.record_time ? '#2196f3' : '#e0e0e0',
                        color:
                          selectedRecord?.record_time === record.record_time ? '#fff' : '#000',
                      }}
                    >
                      เพิ่มเติม
                    </Button>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary" padding="8px">
                  ไม่มีข้อมูลที่จะแสดง
                </Typography>
              )}
            </List>

            {selectedRecord && (
              <Box
                display="flex"
                flexDirection="column"
                border="1px solid #ddd"
                borderRadius="8px"
                padding="16px"
                marginLeft="8px"
                marginTop='10px'
                backgroundColor="#fff"
                flex="0.6"
                position="relative" // ใช้ relative เพื่อจัดตำแหน่งไอคอน
              >
                 <IconButton
                  onClick={handleCloseDetails}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                  }}
                >
                  <CloseIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="bold" marginBottom="16px">
                  ข้อมูลการบันทึก
                </Typography>
                <Typography variant="body1">
                  <strong>วันที่บันทึก: </strong>{formatDateAdmit(selectedRecord.record_time)}
                </Typography>
                <Typography variant="body1">
                  <strong>เวลา: </strong>{formatAdmit(selectedRecord.record_time)}
                </Typography>
                <Typography><strong>อุณหภูมิ: </strong>{selectedRecord.admit_temp} °C</Typography>
                <Typography><strong>ความดัน: </strong>{selectedRecord.admit_pressure} mmHg</Typography>
                <Typography><strong>อัตราการเต้นของหัวใจ: </strong>{selectedRecord.admit_heartrate} bpm</Typography>
                <Typography><strong>บันทึกติดตามอาการ: </strong>{selectedRecord.record_medical}</Typography>
                <Typography><strong>บันทึกการจ่ายยา: </strong>{selectedRecord.record_medicine}</Typography>

              </Box>
            )}
          </Box>
        </Collapse>

        <Button variant="text" size="small" onClick={toggleDetails}>
          {isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
        </Button>
      </Box>
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
  const [recordUpdate, setUpdateRecords] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [formMedical, setFormMedical] = useState({
    admit_temp: null,
    admit_pressure: null,
    admit_heartrate: null,
    rec_timee: dayjs().format('HH:mm'),
    rec_date: dayjs().format('YYYY-MM-DD'),
    record_medical:'',
    record_medicine:''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);  

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      setUserRole(decodedToken?.role);
    }
  }, [token]);  // ใช้ token เป็น dependency ตอนนี้ React สามารถตรวจสอบได้

  //console.log('appointments',appointments)
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
    setIsSubmitting(true);

    if (!formMedical.admit_temp ) {
      setAlertMessage("กรุณากรอกอุณหภูมิที่ถูกต้อง");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      setIsSubmitting(false); 
      return;
    }
  
    if (!formMedical.record_medical ) {
      setAlertMessage("กรุณากรอกข้อมูลบันทึกอาการ");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      setIsSubmitting(false); 
      return;
    }
    const pressureRegex = /^\d{2,3}\/\d{2,3}$/; // รูปแบบต้องเป็น "ตัวเลข/ตัวเลข" เช่น 120/80
    if (formMedical.admit_pressure && !pressureRegex.test(formMedical.admit_pressure)) {
      setAlertMessage("กรุณากรอกค่าความดันโลหิตในรูปแบบที่ถูกต้อง เช่น 120/80");
      setAlertSeverity("warning");
      setOpenSnackbar(true);
      setIsSubmitting(false); 
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
    try {
 
      await clinicAPI.post(`/admitrecord`, payload);
      const response = await clinicAPI.get(`/admitrecord?appointment_id=${selectedAppointment?.appointment_id}`);
      setUpdateRecords((prevRecords) => {
        const filteredPrevRecords = prevRecords.filter(
          (record) => record.appointment_id !== selectedAppointment?.appointment_id
        );
        return [...filteredPrevRecords, ...response.data.data];
      });
      setAlertMessage("ข้อมูลได้ถูกบันทึกสำเร็จ!");
      setAlertSeverity("success");  // ประเภทของ Alert
      setOpenSnackbar(true);
      handleCloseDialog();

      
    } catch (error) {
      setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setAlertSeverity("error");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
    }finally {
    setIsSubmitting(false); 
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
      (appointment.queue_status === 'admit' || appointment.reason === 'admit' )&&
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
              updatedRecords={recordUpdate  }
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
          <Button
            onClick={handleSubmit}
            disabled={userRole !== 'สัตวแพทย์' || isSubmitting}
            variant="contained"
            color="primary"
            startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
export default RecordMedical;

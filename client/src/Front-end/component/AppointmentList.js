import React, { useState , useEffect } from 'react';
import {  Box, Paper, Button, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogTitle, TableCell,
     TableRow ,TableContainer,Table,TableBody,TableHead ,TableSortLabel,Typography, IconButton,TextField ,Alert,Snackbar,DialogContentText} from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Thai localization
import axios from 'axios';
import Bodyscore from './Bodyscore';


// Categories for filtering
const categories = ['คิววันนี้', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];
const api = 'http://localhost:8080/api/clinic';


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
const formatTime = (timeString) => {
  // แยกเวลาออกจากรูปแบบ 'HH:mm:ss+ZZ' และแสดงแค่ 'HH:mm'
  const time = timeString.split(':');  // แยกเป็น [ '16', '00', '00+07' ]
  return `${time[0]}:${time[1]}`;  // คืนค่าแค่ '16:00'
};
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

const AppointmentList = ({ appointments, onMoveToOngoing, onCancelAppointment }) => {
    const [activeCategory, setActiveCategory] = useState('คิววันนี้');
    const [alertMessage, setAlertMessage] = useState("");   // ข้อความสำหรับ Alert
    const [alertSeverity, setAlertSeverity] = useState("info"); // กำหนดประเภทของ alert
    const [openSnackbar, setOpenSnackbar] = useState(false); 
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('appointment_date');
    const [openPopup, setOpenPopup] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [age, setAge] = useState('');
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [cancelAppointmentId, setCancelAppointmentId] = useState(null);

    const [formMedical, setFormMedical] = useState({
      rec_weight: '',
      diag_cc: '',
      pet_id: '',
      type_service:''
    });
    const [formData, setFormData] = useState({
        ribs: '',
        subcutaneous_fat: '',
        abdomen: '',
        waist: '',
        result_bcs:''
      });
    const handleMedicalChange = (field) => (event) => {
      setFormMedical((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };
    const handleBodyscoreTreeSubmit = (data) => {
    //  console.log('data',data)
      setFormData({
        ...formData,
        ribs: data.ribs, // or any additional fields
        subcutaneous_fat: data.subcutaneous_fat,   
        abdomen: data.abdomen,   
        waist: data.waist,
        result_bcs:data.result_bcs     // Save the result from the decision tree
      });
    };
 

    const handleSaveMedical = async (appointmentId) => {
      try {
        if(selectedAppointment.type_service !== 'ตรวจรักษา'){
          if (!formMedical.rec_weight) {
            setAlertMessage("กรุณากรอกน้ำหนักที่ถูกต้อง");
            setAlertSeverity("warning");  // ประเภทของ Alert
            setOpenSnackbar(true);  // เปิดการแสดง Snackbar
            return;
          }
        }else {
          if (!formMedical.rec_weight || !formMedical.diag_cc || 
            !formData.ribs || !formData.subcutaneous_fat || 
            !formData.abdomen || !formData.waist || 
            !formData.result_bcs)  {
            setAlertMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
            setAlertSeverity("warning");  // ประเภทของ Alert
            setOpenSnackbar(true);  // เปิดการแสดง Snackbar
            return;
          }
        }

        const response = await axios.post(`${api}/medical/symptom`, {
          appointment_id: appointmentId,
          rec_weight: formMedical.rec_weight,
          diag_cc: formMedical.diag_cc,
          pet_id: formMedical.pet_id,
          type_service: formMedical.type_service,
          ribs: formData.ribs,                       // การมองเห็นกระดูกซี่โครงจาก formData
          subcutaneous_fat: formData.subcutaneous_fat, // ไขมันใต้ผิวหนังจาก formData
          abdomen: formData.abdomen,                 // ลักษณะท้องจาก formData
          waist: formData.waist,    
          result_bcs: formData.result_bcs
        });
      
        if (response.status === 200) {
          setAlertMessage("บันทึกข้อมูลสำเร็จ");
          setAlertSeverity("success");  // ประเภทของ Alert
          setOpenSnackbar(true);  // เปิดการแสดง Snackbar
          onMoveToOngoing(appointmentId); // เรียกฟังก์ชันส่งคิว
          handleClose(); // ปิดฟอร์มหลังจากส่งคิว
        } 
      } catch (error) {
        setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setAlertSeverity("error");  // ประเภทของ Alert
        setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      }
    };

    

    useEffect(() => {
      if (selectedAppointment) {
        calculateAge(selectedAppointment.pet_birthday); // คำนวณอายุใหม่เมื่อ appointment เปลี่ยน
      }
    }, [selectedAppointment]);
    
    
    
    
    const handleRequestSort = (event, property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };
      const calculateAge = (date) => {
      if (!date) return;
      const today = dayjs();
      const birthDay = dayjs(date);
      const years = today.diff(birthDay, 'year');
      const months = today.diff(birthDay.add(years, 'year'), 'month');
      const days = today.diff(birthDay.add(years, 'year').add(months, 'month'), 'day');
      setAge({ years, months, days });
    };

    const filteredAppointments = appointments.filter(appointment => {
      const today = dayjs().format('YYYY-MM-DD');
      if (activeCategory === 'คิววันนี้') {
        return appointment.queue_status === 'รอรับบริการ' && appointment.status=== 'อนุมัติ' && dayjs(appointment.appointment_date).isSame(today, 'day');
      }
      return appointment.type_service === activeCategory && appointment.queue_status === 'รอรับบริการ' && appointment.status === 'อนุมัติ';
    });
    const handleClickOpen = (appointment) => {
        setSelectedAppointment(appointment);
        setFormMedical({
          pet_id: appointment.pet_id, // เซ็ต pet_id อัตโนมัติ
          type_service:appointment.type_service
        });
        setOpenPopup(true);
      };
      const handleClose = () => {
        setOpenPopup(false);
        setSelectedAppointment(null);
      };
      const handleCloseSnackbar = () => {
        setOpenSnackbar(false);  // ปิด Snackbar
      };

      const handleOpenCancelDialog = (appointmentId) => {
        setCancelAppointmentId(appointmentId);
        setOpenCancelDialog(true);
    };
    
    const handleCloseCancelDialog = () => {
        setOpenCancelDialog(false);
        setCancelAppointmentId(null);
    };
    
    return (
      <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>เลขที่นัดหมาย</TableCell>
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
                <TableCell>รายละเอียด</TableCell>
                <TableCell sx={{width: '20%'}}></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment) => {
                // กำหนดสีตามประเภทการจองใน detail_server
                const detailColor = appointment.detail_service === 'นัดหมาย' ? '#eefaaa' : 
                                    appointment.detail_service === 'Walk-in' ? '#aafabb' : '#cffdff';
  
                return (
                  <TableRow key={appointment.appointment_id}> 
                    <TableCell>{appointment.appointment_id}</TableCell>
                    <TableCell>{appointment.appointment_time ? formatTime(appointment.appointment_time) : 'ตลอดทั้งวัน'}</TableCell>
                    <TableCell>{appointment.pet_name}</TableCell>
                    <TableCell>{appointment.full_name}</TableCell>
                    <TableCell>{appointment.type_service}</TableCell>
                    <TableCell>{appointment.reason || '-'}</TableCell>
                    <TableCell>
                      {/* ใช้ Box สำหรับกล่องสีพื้นหลังที่ไม่เต็มช่อง */}
                      <Box 
                        sx={{ 
                          backgroundColor: detailColor, 
                          width: '60%', // ขนาดของกล่องเป็น 60% ของช่อง
                          padding: '4px', 
                          borderRadius: '4px' 
                        }}
                      >
                        {appointment.detail_service || '-'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box mt={1} display="flex" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          color="secondary"
                          sx={{ mr: 1 }}
                          onClick={() => handleOpenCancelDialog(appointment.appointment_id)}
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                        //   onClick={() => onMoveToOngoing(appointment.appointment_id)}
                        onClick={() => handleClickOpen(appointment)}
                        >
                          ประวัติ
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openPopup} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            ซักประวัติ
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Box display="flex" alignItems="start">
                {/* รูปภาพ */}
                <Box sx={{ marginRight: 2 }}>
                  <img
                    src={`http://localhost:8080${selectedAppointment.image_url}`}
                    alt={selectedAppointment.pet_name}
                    style={{
                      width: '100px',
                      height: '110px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
                  
                {/* ข้อมูลสัตว์ในบรรทัดเดียว */}
                <Box display="flex" flexDirection="row" flexWrap="wrap" gap={2} alignItems="center">
                  <Typography variant="h6">{selectedAppointment.pet_name} </Typography>
                  <Typography variant="body1">{selectedAppointment.pet_species}| </Typography>
                  <Typography variant="body1">{selectedAppointment.pet_breed}|</Typography>
                  <Typography variant="body1">
                    อายุ: {age.years} ปี {age.months} เดือน {age.days} วัน |
                  </Typography>
                  <Typography>
                    {selectedAppointment.pet_gender === 'female' ? 'เพศเมีย' : 'เพศผู้'} |
                  </Typography>
                  <Typography variant="body1">
                    {selectedAppointment.spayed_neutered ? 'เคยทำหมัน' : 'ไม่ได้ทำหมัน'} |
                  </Typography>
                  <Typography>เจ้าของ: {selectedAppointment.full_name}</Typography>
                </Box>
              </Box>
            )}

            <Box mt={3}>
              <Box display="flex" alignItems="center" mb={2}>
                {/* <Typography sx={{ color: 'blue', marginRight: '16px' }}> */}
                  {/* น้ำหนักเดิม {selectedAppointment?.rec_weight ? selectedAppointment.rec_weight : '-'} Kg. */}
                {/* </Typography> */}
                <Typography sx={{ mr: 2 }}>น้ำหนัก (Kg.)</Typography>
                <TextField
                  type="number"
                  value={formMedical?.rec_weight ?? ''}
                  onChange={handleMedicalChange('rec_weight')}
                  sx={{
                    width: '80px',   // ลดขนาดความกว้าง
                    height: '30px',  // ลดขนาดความสูง
                    fontSize: '12px', // ลดขนาดตัวอักษร
                    '& .MuiInputBase-input': {
                      padding: '5px' // ลด padding
                    },
                  }}
                />
              </Box>
              {formMedical.type_service === 'ตรวจรักษา' && (
                <Box>
                  <Typography sx={{ mr: 2 }}>
                    การประเมินคะแนนสภาพร่างกาย (Body Condition Score)
                  </Typography>
                  <Bodyscore onSubmit={handleBodyscoreTreeSubmit} />
                </Box>
              )}

              <Box>
                <Typography>อาการเบื้องต้น </Typography>
                <TextField
                  type="text"
                  value={formMedical.diag_cc}
                  onChange={handleMedicalChange('diag_cc')}
                  fullWidth
                  multiline
                  rows={4}
                />
                <Typography sx={{ mt: 2 }}> *(สำหรับสัตว์เลี้ยงที่มาทำการตรวจรักษา)</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleSaveMedical(selectedAppointment?.appointment_id); // บันทึกข้อมูล
              }}
            >
              ส่งคิว
            </Button>
          </DialogActions>
        </Dialog>
            
        <Dialog open={openCancelDialog} onClose={handleCloseCancelDialog}>
          <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
          <DialogContent>
              <DialogContentText>
                  คุณต้องการยกเลิกการนัดหมายนี้ใช่หรือไม่?
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseCancelDialog} color="secondary">
                  ยกเลิก
              </Button>
              <Button
                  onClick={() => {
                      onCancelAppointment(cancelAppointmentId);
                      handleCloseCancelDialog();
                  }}
                  color="primary"
              >
                  ยืนยัน
              </Button>
          </DialogActions>
      </Dialog>

      </Paper>
      
    );
  };

export default AppointmentList
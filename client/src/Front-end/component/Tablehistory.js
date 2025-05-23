import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,Divider,CircularProgress
} from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import FolderIcon from '@mui/icons-material/Folder';
import { jwtDecode } from 'jwt-decode';
import { clinicAPI } from "../../utils/api";
dayjs.locale('th');
const formatDate2 = (dateString) => dayjs(dateString).format('DD MMMM YYYY');
const formatDate = (dateString) => dayjs(dateString).format('DD/MM/YYYY');
const formatTime = (timeString) => timeString?.split(':').slice(0, 2).join(':');

const formattime = (datetime) => datetime?.slice(11, 19) || '';

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

   <Typography variant="body2" fontWeight="textSecondary">
      แก้ไขล่าสุด : {formatDate2(appointment.rec_time)} เวลา: {formattime(appointment.rec_time)}
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
  const [loading, setLoading] = useState(false);
  const [medicineList, setMedicineList] = useState([]);

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
            .filter((appointment) => appointment.type_service === 'วัคซีน'&& appointment.queue_status === 'เสร็จสิ้น')
            .map((appointment) => appointment.appointment_id);

          const response = await clinicAPI.post(`/appointment/vaccien`, { ids });
          const vaccineDataMap = response.data.reduce((acc, curr) => {
            if (!acc[curr.appointment_id]) {
              acc[curr.appointment_id] = [];
            }
            acc[curr.appointment_id].push(curr.category_name);
            return acc;
          }, {});
          
          const updatedAppointments = appointments.map((appointment) => ({
            ...appointment,
            category_name: vaccineDataMap[appointment.appointment_id]?.join(", ") || 'ไม่มีข้อมูลวัคซีน',
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
    setLoading(true);
  
    try {
      const [medicalResponse, medicineResponse] = await Promise.all([
        clinicAPI.get(`/history/medical/${appointmentId}`),
        clinicAPI.get(`/history/medicine/${appointmentId}`)
      ]);
  
      setDetails({ ...medicalResponse.data, appointmentId });
      setMedicineList(Array.isArray(medicineResponse.data) ? medicineResponse.data : [medicineResponse.data]);

    } catch (error) {
      console.error('Error fetching details:', error);
    }
  
    setLoading(false);
  };
  


  const handleOpenDialog = (appointment) => {
    fetchDetails(appointment.appointment_id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDetails(null);
    setMedicineList([]); 
  };

  const generatePDF = () => {
    const input = document.getElementById('pdf-content');
  
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
  
      // คำนวณตำแหน่งโลโก้ให้อยู่มุมขวาบน
      const pageWidth = pdf.internal.pageSize.width; // ความกว้างของหน้า PDF
      const logoWidth = 30; // กำหนดขนาดโลโก้
      const logoHeight = 30;
      const marginRight = 10; // ระยะห่างจากขอบขวา
      const marginTop = 5; // ระยะห่างจากขอบบน
  
      pdf.addImage('/Logo.jpg', 'JPEG', pageWidth - logoWidth - marginRight, marginTop, logoWidth, logoHeight);
  
    // ลดขนาดของภาพเนื้อหาให้เล็กลง
      const imageWidth = 150; // กำหนดความกว้างใหม่ (ลดลงจาก 100)
      const imageHeight = 0; // ตั้งค่าเป็น 0 เพื่อให้รักษาสัดส่วนอัตโนมัติ
      pdf.addImage(imgData, 'PNG', 10, 40, imageWidth, imageHeight);

      // เพิ่มเวลาออกใบสั่งที่มุมขวาล่าง
      const currentDateTime = new Date().toLocaleString();
      pdf.setFontSize(8);
      pdf.text(`Date Issued: ${currentDateTime}`, 150, 290); // ตำแหน่งมุมขวาล่าง
  
      pdf.save(`Medical_History_${details.appointmentId}.pdf`);
    });
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
      appointment.queue_status === 'เสร็จสิ้น' && 
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
                   <TableCell style={{ whiteSpace: 'pre-line' }}>{Array.isArray(appointment.category_name) ? appointment.category_name.join("\n") : appointment.category_name || 'ไม่มีข้อมูลวัคซีน'}</TableCell>
                  )}

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>รายละเอียดการรักษา</DialogTitle>
      <DialogContent id="pdf-content">
      {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress size={40} />
            </Box>) :
        details ? (
          <Box>
            {/* ส่วนข้อมูลทั่วไป */}
            <Typography variant="h6" gutterBottom>ข้อมูลทั่วไป</Typography>
            <Typography variant="body1">ชื่อสัตว์เลี้ยง: {details.pet_name || 'ไม่มีข้อมูล'}</Typography>
            <Typography variant="body1">เจ้าของสัตว์เลี้ยง : {details.owner_name || '-'}</Typography>
            <Typography variant="body1">เลขที่นัดหมาย : {details.appointment_id || 'ไม่มีข้อมูล'}</Typography>
            <Typography variant="body1">สัตวแพทย์ที่รับผิดชอบ : {details.personnel_name || 'ไม่มีข้อมูล'}</Typography>
              <Typography variant="body2" fontWeight="textSecondary">
                 แก้ไขล่าสุด : {formatDate2(details.rec_time)} เวลา: {formattime(details.rec_time)}
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

            <Divider sx={{ my: 2 }} />
          
          {/* ส่วนรายการยา */}
          <Typography variant="h6" gutterBottom>รายการยา</Typography>
          {medicineList.length > 0 ? (
            medicineList.map((med, index) => (
              <Typography key={index} variant="body1">
                {med.category_name} - จำนวน {med.amount}
              </Typography>
            ))
          ) : (
            <Typography variant="body2">ไม่มีการจ่ายยา</Typography>
          )}

          </Box>
        ) : (
          <Typography variant="body2" align="center">ไม่พบข้อมูล</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={generatePDF} color="primary" disabled={loading || !details ||  userRole !== 'สัตวแพทย์'} >ดาวน์โหลด PDF</Button>
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

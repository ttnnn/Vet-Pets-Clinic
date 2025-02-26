import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Paper, Button, TextField, Box, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,Divider,CircularProgress
} from '@mui/material';
import jsPDF from 'jspdf';
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
  const [loading, setLoading] = useState(false);
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
    setLoading(true)
  
    try {
      const response = await clinicAPI.get(`/history/medical/${appointmentId}`);
      setDetails({ ...response.data, appointmentId }); // เก็บ appointmentId เพื่อการตรวจสอบ
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
  };

  
  const loadFont = async (pdf) => {
    const response = await fetch("/fonts/THSarabunNew.ttf"); // โหลดฟอนต์จาก public
    const fontBuffer = await response.arrayBuffer(); // แปลงเป็น ArrayBuffer
    const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontBuffer))); // แปลงเป็น Base64
  
    // เพิ่มฟอนต์เข้า jsPDF
    pdf.addFileToVFS("THSarabunNew.ttf", fontBase64);
    pdf.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
    pdf.setFont("THSarabunNew");
    pdf.setFontSize(16);
  };
  
  const generatePDF = async (details) => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  
    // โหลดฟอนต์ให้เสร็จก่อน
    await loadFont(pdf);
  
    //เพิ่มโลโก้
    const logoUrl = "/Logo.jpg";
    const imgWidth = 30;
    const imgHeight = 30;
    pdf.addImage(logoUrl, "JPEG", 10, 10, imgWidth, imgHeight);
  
    let y = 50; // ตำแหน่งเริ่มต้นของเนื้อหา
  
    //ส่วนข้อมูลทั่วไป
    pdf.text("ข้อมูลทั่วไป", 10, y);
    y += 8;
    pdf.text(`ชื่อสัตว์เลี้ยง: ${details.pet_name || "ไม่มีข้อมูล"}`, 10, y);
    y += 7;
    pdf.text(`เจ้าของสัตว์เลี้ยง: ${details.owner_name || "-"}`, 10, y);
    y += 7;
    pdf.text(`เลขที่นัดหมาย: ${details.appointment_id || "ไม่มีข้อมูล"}`, 10, y);
    y += 7;
    pdf.text(`สัตวแพทย์ที่รับผิดชอบ: ${details.personnel_name || "ไม่มีข้อมูล"}`, 10, y);
    y += 7;
    pdf.text(
      `แก้ไขล่าสุด: ${details.rec_time ? dayjs(details.rec_time).format("DD MMMM YYYY HH:mm") : "-"}`,
      10,
      y
    );
    y += 10;
  
    pdf.line(10, y, 200, y); // เส้นคั่น
    y += 10;
  
    //  ส่วนการวินิจฉัย
    pdf.text("ข้อมูลการวินิจฉัย", 10, y);
    y += 8;
    pdf.text(`CC: ${details.diag_cc || "-"}`, 10, y);
    y += 7;
    pdf.text(`HT: ${details.diag_ht || "-"}`, 10, y);
    y += 7;
    pdf.text(`PE: ${details.diag_pe || "-"}`, 10, y);
    y += 7;
    pdf.text(`ปัญหาหลัก: ${details.diag_majorproblem || "-"}`, 10, y);
    y += 7;
    pdf.text(`Tentative DX: ${details.diag_tentative || "-"}`, 10, y);
    y += 7;
    pdf.text(`Final DX: ${details.diag_final || "-"}`, 10, y);
    y += 7;
    pdf.text(`การรักษา: ${details.diag_treatment || "-"}`, 10, y);
    y += 7;
    pdf.text(`หมายเหตุ: ${details.diag_note || "-"}`, 10, y);
    y += 10;
  
    pdf.line(10, y, 200, y); // เส้นคั่น
    y += 10;
  
    //  ส่วนการตรวจร่างกาย
    pdf.text("ผลการตรวจร่างกาย", 10, y);
    y += 8;
  
    const phyData = Object.entries(details)
      .filter(([key, value]) => key.startsWith("phy_") && value !== "no exam" && value !== null)
      .map(([key, value]) => `${key.replace("phy_", "").replace(/_/g, " ").toUpperCase()}: ${value}`);
  
    if (phyData.length > 0) {
      phyData.forEach((text) => {
        pdf.text(text, 10, y);
        y += 7; // เพิ่มระยะห่างระหว่างบรรทัด
      });
    } else {
      pdf.text("ไม่มีข้อมูลการตรวจร่างกาย", 10, y);
    }
  
    // ตั้งชื่อไฟล์ PDF อย่างถูกต้อง
    const fileName = `นัดหมาย_${details.appointment_id || " "}.pdf`
      .replace(/[:\/\\?*<>|"]/g, ""); // ลบอักขระที่ไม่ถูกต้องออก
  
    pdf.save(fileName);
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
        <Button onClick={() => generatePDF(details)} color="primary" disabled={loading || !details ||  userRole !== 'สัตวแพทย์'} >ดาวน์โหลด PDF</Button>
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

import React, { useState, useEffect ,useCallback  } from 'react';
import {
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  TableCell,
  TableRow,
  TableContainer,
  Table,
  TableBody,
  TableHead,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Select,
  TablePagination,
  TextField, Alert,Snackbar ,DialogTitle,IconButton,CircularProgress
} from '@mui/material';
import { styled } from '@mui/system';
import { clinicAPI } from "../../utils/api";
import ReceiptComponent from './ReceiptComponent';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // นำเข้า locale ภาษาไทย

dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

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
}));


const PendingAppointments = ({ appointments ,update}) => {
  const [activeCategory, setActiveCategory] = useState('คิวทั้งหมด');
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedItems, setSelectedItems] = useState([]); // จัดการสินค้าที่เลือก
  const [searchTerm, setSearchTerm] = useState('');
  const [alertMessage, setAlertMessage] = useState("");   // ข้อความสำหรับ Alert
  const [alertSeverity, setAlertSeverity] = useState("info"); // กำหนดประเภทของ alert
  const [openSnackbar, setOpenSnackbar] = useState(false); 
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null); // สถานะสำหรับข้อมูลใบเสร็จ
  const [showReceipt, setShowReceipt] = useState(false); // สถานะควบคุมการแสดงใบเสร็จ
  const [isReceiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false); // เพิ่ม state


  const resetPage = () => setPage(0);
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    resetPage();
  };

  
  const handleSelectItem = (item) => {
    setSelectedItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.category_id === item.category_id
      );
  
      if (existingItem) {
        // อัปเดตรายการเดิม
        return prevItems.map((i) =>
          i.category_id === item.category_id
            ? {
                ...i,
                quantity: (i.quantity || 1) + 1,
                subtotal: ((i.quantity || 1) + 1) * i.price_service, // คำนวณใหม่
              }
            : i
        );
      }
  
      // เพิ่มรายการใหม่
      return [
        ...prevItems,
        {
          ...item,
          quantity: 1,
          subtotal: item.price_service, // เริ่มต้นด้วย subtotal เท่ากับราคา
        },
      ];
    });
  };
  

  const calculateTotalAmount = () => {
    return selectedItems.reduce((sum, item) => {
      // ตรวจสอบว่ารายการเป็นบริการตรวจรักษาหรือไม่
      if (selectedAppointment.type === "ตรวจรักษา") {
        const selectedItemsTotal = selectedItems.reduce(
          (sum, item) => sum + (item.quantity ||item.amount||  0) * (item.price_service || 0),
          0
        );
        const total = selectedItemsTotal  ;
        return total;
      } else {
        // ใช้ quantity และ price_service สำหรับบริการอื่นๆ
        return sum + (item.quantity || 1) * (item.price_service || 0);
      }
    }, 0);
  };
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await clinicAPI.get(`/servicecategory`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories(); // Call function when component mounts
  }, []);

  // ฟังก์ชันดึงข้อมูล
  const fetchData = async (url) => {
    try {
      const response = await clinicAPI.get(url);
      return response.data;  // ใช้ response.data แทน response.json()
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };
  
  
  // ฟังก์ชันหลัก
  const handleClickOpen = useCallback((appointment ,update) => {
    setLoading(true);
    const updateAppointmentDetails = async () => {
      // ตั้งค่าเบื้องต้นของ SelectedAppointment
      setSelectedAppointment({
        name: appointment.full_name,
        pet: appointment.pet_name,
        orderNumber: appointment.appointment_id,
        date: appointment.appointment_date,
        species: appointment.pet_species,
        type: appointment.type_service,
        weight: appointment.rec_weight,
      });
  
      // ดึงข้อมูลตามประเภทบริการ
      let selectedItems = [];
      let additionalData = {};
  
      switch (appointment.type_service) {
        case 'วัคซีน':
          selectedItems = await fetchData(`/history/vaccine/${appointment.appointment_id}`);
          if (selectedItems && selectedItems.length > 0) {
            selectedItems = selectedItems.map((item) => ({
              ...item,
              price_service: parseFloat(item.price_service) || 0,
              quantity: item.quantity || 1,
            }));
          }
          setSelectedItems(selectedItems || []);

          // ดึง notes และกำหนดให้เป็นค่าว่างหากไม่มีข้อมูล
          const vaccineNotes = selectedItems && selectedItems.length > 0 
          ? selectedItems.map(item => item.notes || "").filter(note => note.trim() !== "").join(', ')
          : "";

        setSelectedAppointment(prev => ({
          ...prev,
          notes: vaccineNotes || "" // ป้องกันค่า undefined
        }));


          break;
  
        case 'ฝากเลี้ยง':
          additionalData = await fetchData(`/appointment/hotel/${appointment.appointment_id}`);
          if (additionalData && additionalData.length > 0) {
            const hotelInfo = additionalData[0];
            setSelectedAppointment((prev) => ({
              ...prev,
              start_date: hotelInfo.start_date || null,
              end_date: hotelInfo.end_date || null,
              days_overdue: hotelInfo.days_overdue || 0,
              personnel_name: hotelInfo.personnel_name || '',
              num_day: hotelInfo.num_day || 0,
            }));
          }
          break;
  
        case 'ตรวจรักษา':
          // ดึงข้อมูล invoice
          selectedItems = await fetchData(`/medical/invoice/${appointment.appointment_id}`);
          console.log('Fetched items medical:', selectedItems); 
          if (selectedItems) {
            selectedItems = selectedItems.map((item) => ({
              ...item,
              amount: parseFloat(item.amount) || 1,
              subtotal_price: item.amount *  item.price_service,
            }));
            setSelectedItems((prevItems) => [
              ...selectedItems,
              ...prevItems.filter((item) => !selectedItems.some((d) => d.id === item.id)),
            ]);
          }
  
          // ดึงข้อมูล record_medicine
          const recordMedicineData = await fetchData(`/appointment/hotel/${appointment.appointment_id}`);
          if (recordMedicineData) {
            setSelectedAppointment((prev) => ({
              ...prev,
              record_medicine: recordMedicineData.map((item) => item.record_medicine) || [],
            }));
          }
          break;
  
        default:
          setSelectedItems([]);
      }
  
      setLoading(false);
      setOpenPopup(true);
    };
  
    updateAppointmentDetails();
  }, [setLoading, setSelectedItems, setSelectedAppointment, setOpenPopup ]);
  
  const handleDelete = async (item) => {
    try {
      if (item.category_id && item.invoice_id) {
        // กรณีเป็นรายการที่มาจากฐานข้อมูล
        const response = await clinicAPI.delete(`/delete/item/${item.category_id}/${item.invoice_id}`);
        if (response.status === 200) {
          console.log('Deleted item from database');
  
          // ดึงข้อมูลใหม่จากฐานข้อมูลหลังจากการลบ
          const updatedItems = await fetchData(`/medical/invoice/${item.appointment_id}`);
  
          // กรองรายการใน UI ที่ไม่ได้ถูกลบออกจาก selectedItems
          setSelectedItems((prevItems) => {
            // กรองข้อมูลที่ไม่ถูกลบออก
            const remainingItems = prevItems.filter((i) => i.category_id !== item.category_id);
  
            // รวมข้อมูลที่ดึงใหม่จากฐานข้อมูล (ตรวจสอบข้อมูลที่ไม่มีใน remainingItems)
            const uniqueUpdatedItems = updatedItems.filter(
              (newItem) => !remainingItems.some((existingItem) => existingItem.category_id === newItem.category_id)
            );
            // รวมรายการที่ไม่ได้ถูกลบกับข้อมูลที่ดึงใหม่
            return [...remainingItems, ...uniqueUpdatedItems];
            
          });
        } else {
          console.error('Failed to delete item from database');
        }
      } else {
        // กรณีเป็นรายการใหม่ที่เพิ่มใน UI
        setSelectedItems((prevItems) => prevItems.filter((i) => i !== item));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  

  
  const handleQuantityChange = (categoryId, value) => {
    const quantity = Math.max(0, parseInt(value, 10) || 0); // ป้องกันค่าติดลบหรือค่าไม่ใช่ตัวเลข
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.category_id === categoryId
          ? { ...item, quantity }
          : item
      )
    );
  };
  
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    resetPage();
  };


  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const filteredCategories = categories.filter(service => 
    (!selectedCategory || service.category_type === selectedCategory) &&
    (!searchTerm || service.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
 );
 
  const paginatedCategories = filteredCategories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  const handlePay = async () => {
    const totalAmount = calculateTotalAmount();
  
    const requestData = {
      appointmentId: selectedAppointment.orderNumber, // ใช้ ID จาก selectedAppointment
      type: selectedAppointment.type,
      selectedItems: selectedItems.map(item => ({
        category_id: item.category_id,
        amount: item.quantity || item.amount || 1,
        price_service:  item.price_service || item.quantity ,
      })),
      totalAmount,
    };

    if (!requestData.appointmentId || !requestData.selectedItems.length ) {
      setAlertMessage("ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบอีกครั้ง");
      setAlertSeverity("error"); // ประเภทของ Alert
      setOpenSnackbar(true); // เปิดการแสดง Snackbar
      return; // ยกเลิกการทำงานถ้าข้อมูลไม่ครบ
    }
     //console.log('requestData' , requestData)
    try {
      setLoadingPay(true); // เริ่มโหลด
      const response = await clinicAPI.post(`/create-invoice/payment`, requestData);
      //console.log("Response:", response.data);
      setAlertMessage("ข้อมูลได้ถูกบันทึกสำเร็จ!");
      setAlertSeverity("success");  // ประเภทของ Alert
      setOpenSnackbar(true);
      handleClose();
      handleCloseConfirmDialog();
       // อัปเดตข้อมูลใบเสร็จ
       setReceiptData({
        invoice_id: response.data.invoice_id,
        payment_id: response.data.payment_id
      });
      handleOpenReceiptDialog()
     

    } catch (error) {
      // console.error("Error saving invoice:", error);
      setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setAlertSeverity("error");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
    }finally {
      setLoadingPay(false); // หยุดโหลดไม่ว่าจะสำเร็จหรือเกิดข้อผิดพลาด
    }
  };
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);  // ปิด Snackbar
  };
  // const handleCloseMainDialog = () => setMainDialogOpen(false);
  const handleOpenConfirmDialog = () => setConfirmDialogOpen(true);
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false); // ปิด Dialog
  };

  const handleOpenReceiptDialog = () => {
    setReceiptDialogOpen(true); 
    setShowReceipt(true); // แสดงใบเสร็จ
  };

  
const handleCloseReceiptDialog = () => {
  setReceiptDialogOpen(false); // ปิด Dialog
  update();
};

  const handleClose = () => {
    setSelectedItems([])
    setOpenPopup(false);
    setSelectedAppointment(null);
    setSelectedCategory('');
    setSearchTerm('');
  };
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
   
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          <StyledTab label="คิวทั้งหมด" value="คิวทั้งหมด" />
        </Tabs>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell sx={{ width: '10%' }}>เลขที่นัดหมาย</TableCell>
              <TableCell sx={{ width: '10%' }}>ชื่อสัตว์</TableCell>
              <TableCell sx={{ width: '10%' }}>ประเภทสัตว์เลี้ยง</TableCell>
              <TableCell sx={{ width: '15%' }} >ชื่อเจ้าของ</TableCell>
              <TableCell sx={{ width: '10%' }}>ประเภทนัดหมาย</TableCell>
              <TableCell>รายละเอียด</TableCell>
              <TableCell sx={{ width: '20%' }}></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments
              .map((appointment) => (
                <TableRow key={appointment.appointment_id}>
                  <TableCell>{dayjs(appointment.appointment_date).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{appointment.appointment_id}</TableCell>
                  <TableCell>{appointment.pet_name}</TableCell>
                  <TableCell>{appointment.pet_species}</TableCell>
                  <TableCell>{appointment.full_name}</TableCell>
                  <TableCell>{appointment.type_service}</TableCell>
                  <TableCell>{appointment.reason || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleClickOpen(appointment)}
                    >
                      ชำระเงิน
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openPopup} onClose={handleClose} maxWidth="md" fullWidth>
    <DialogContent sx={{ p: 2 }}>
    {loading ? (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 200 }}>
        <Typography>กำลังโหลดข้อมูล...</Typography>
      </Box>
    ) : (
      <Box display="flex" gap={2}>
        {/* รายการบริการ */}
        <Box flex={1} display="flex" flexDirection="column" gap={2}>
        {selectedAppointment  && (
            <Box
              display="flex"
              flexDirection="column"
              mb={2}
              p={2}
              border={1}
              borderColor="grey.300"
              borderRadius={2}
              marginBottom={0}
            >
              <Typography variant="h6" gutterBottom>
                รายละเอียดนัดหมาย
              </Typography>
              <Typography>
                <strong>เลขที่นัดหมาย:</strong> {selectedAppointment.orderNumber} ({selectedAppointment.type})
              </Typography>
              <Typography>
                <strong>ชื่อสัตว์:</strong> {selectedAppointment.pet} ({selectedAppointment.species})
              </Typography>
              <Typography>
                <strong>ชื่อเจ้าของ:</strong> {selectedAppointment.name}
              </Typography>
              <Typography>
                <strong>วันที่นัดหมาย:</strong>{' '}
                {dayjs(selectedAppointment.date).format('DD MMMM YYYY')}
              </Typography>
              <Typography>
                <strong>น้ำหนักล่าสุด:</strong> {selectedAppointment.weight} kg
              </Typography>
              
              {['ตรวจรักษา', 'ฝากเลี้ยง'].includes(selectedAppointment.type) && (
              <>
                  <Typography>
                    <strong>
                      {selectedAppointment.type === 'ตรวจรักษา' ? 'วันแอดมิด:' : 'วันเข้าพัก:'}
                    </strong>{' '}
                    {selectedAppointment.start_date ? dayjs(selectedAppointment.start_date).format('DD MMMM YYYY') : '-'}
                  </Typography>
                  <Typography>
                    <strong>กำหนดออก:</strong> {selectedAppointment.end_date ? dayjs(selectedAppointment.end_date).format('DD MMMM YYYY') : '-'}
                  </Typography>
                  {selectedAppointment.days_overdue > 0 && (
                    <Typography>
                      <strong style={{ color: 'red' }}>เกินกำหนด:</strong> {selectedAppointment.days_overdue} วัน{' '}
                      <strong>รวมเข้าพัก:</strong> {(selectedAppointment?.num_day ?? 0) + (selectedAppointment?.days_overdue ?? 0)} วัน
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}

          <Typography variant="h8" gutterBottom  >
            เลือกบริการ
          </Typography>
          <TextField
            placeholder="ค้นหาบริการ"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            sx={{
              flex: 0.2,
              minWidth: 250,
              height: '30px',  // Set height to reduce size
              input: {
                padding: '6px',  // Reduce padding inside the input
                fontSize: '0.875rem',  // Optional: smaller text inside the input
              }
            }}
          />
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            displayEmpty
            variant="outlined"
            sx={{
              mb: 2,
              width: '100%',
              height: '30px',  // Set height to reduce size
              padding: '6px',  // Adjust padding to make the select shorter
              fontSize: '0.875rem',  // Optional: smaller font size inside the select
            }}
          >
          <MenuItem value="">ทั้งหมด</MenuItem>
                  {[...new Set(categories.map((cat) => cat.category_type))].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
          <TableContainer component={Paper} sx={{ flexGrow: 1, maxHeight: '60vh', overflowY: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '20%' }}>ชื่อบริการ</TableCell>
                  <TableCell>ราคา</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCategories.map((category) => (
                  <TableRow key={category.category_id}>
                    <TableCell>{category.category_name}</TableCell>
                    <TableCell>{category.price_service || 'N/A'} บาท</TableCell>
                    <TableCell>
                      <Button onClick={() => handleSelectItem(category)}>เพิ่ม</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      ไม่มีข้อมูล
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
                rowsPerPageOptions={[5, 10,100]}
                component="div"
                count={filteredCategories.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                />
        </Box>
        {/* รายการที่เลือก */}
      <Box flex={1} display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6" gutterBottom>ชำระเงิน</Typography>
        
              <Typography variant="h6" gutterBottom>รายการที่เลือก</Typography>
              {selectedAppointment && selectedAppointment.type === "ตรวจรักษา" && (
                <>
                <Typography>
                  <strong>รายการยาที่ใช้ ระหว่างการพักรักษาตัว</strong>
                </Typography>
                {Array.isArray(selectedAppointment.record_medicine) &&
                selectedAppointment.record_medicine.filter((medicine) => medicine !== null).length > 0 ? (
                  <ul style={{ paddingLeft: "1rem" }}>
                    {selectedAppointment.record_medicine
                      .filter((medicine) => medicine !== null)
                      .map((medicine, index) => (
                        <li key={index}>{medicine}</li>
                      ))}
                  </ul>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    ไม่มีรายการยาที่เพิ่ม
                  </Typography>
                )}
              </>
            )}
            {selectedAppointment && selectedAppointment.type === "วัคซีน" && selectedAppointment.notes && selectedAppointment.notes.trim() !== "" && (
                <Typography  variant="h7">
                หมายเหตุ(เพิ่มเติม): {selectedAppointment.notes}
               </Typography>
              )}
          {selectedItems.length === 0 ? (
            <Typography>ไม่มีรายการ</Typography>
          ) : selectedAppointment.type === "ตรวจรักษา" ? (
            <>
            <TableContainer component={Paper} sx={{ flexGrow: 1, maxHeight: '80vh', overflowY: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '20%' }}>ชื่อบริการ</TableCell>
                    <TableCell>จำนวน</TableCell>
                    <TableCell>ราคารวม</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {selectedItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.category_name}</TableCell>
                  <TableCell>
                      {/* ให้กรอกจำนวนในช่องนี้ */}
                      <TextField
                        type="number"
                        value={item.quantity|| item.amount || ''}
                        onChange={(e) => handleQuantityChange(item.category_id, e.target.value)}
                        inputProps={{ min: 0, style: { textAlign: 'center' } }}
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                  {/* <TableCell>{item.quantity || item.amount || 1}</TableCell> */}
                  <TableCell>
                  { (item.quantity) * (item.price_service)  || item.subtotal_price || 0}  บาท
                  </TableCell>
                  
                  <TableCell>
                  <Button color="error" onClick={() => handleDelete(item)}>
                    ลบ
                </Button>
                </TableCell>
                </TableRow>
              ))}
                </TableBody>
              </Table>
            </TableContainer>
              <Box mt={2} display="flex" justifyContent="space-between">
              <Typography variant="h6">ยอดรวม:</Typography>
              <Typography variant="h6">{calculateTotalAmount()} บาท</Typography>
          </Box>
          </>
          ) : (
            <>
            <TableContainer component={Paper} sx={{ flexGrow: 1, maxHeight: '80vh', overflowY: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ชื่อบริการ</TableCell>
                    <TableCell>จำนวน</TableCell>
                    <TableCell>ราคา</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedItems.map((item) => (
                    <TableRow key={item.category_id}>
                      <TableCell>{item.category_name}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.quantity || ''} 
                          onChange={(e) => handleQuantityChange(item.category_id, e.target.value)}
                          inputProps={{ min: 0, style: { textAlign: 'center' } }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell>{item.quantity * item.price_service} บาท</TableCell>
                      <TableCell>
                        <Button
                          color="error"
                          onClick={() =>
                            setSelectedItems((prevItems) =>
                              prevItems.filter((i) => i.category_id !== item.category_id)
                            )
                          }
                        >
                          ลบ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          <Box mt={2} display="flex" justifyContent="space-between">
              <Typography variant="h6">ยอดรวม:</Typography>
              <Typography variant="h6">{calculateTotalAmount()} บาท</Typography>
          </Box>
          </>
          )}
          </Box>
      </Box>
      )}  


    </DialogContent>

    <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            ยกเลิก
          </Button>
          <Button onClick={handleOpenConfirmDialog} variant="contained" color="primary">
            ชำระเงิน
          </Button>
        </DialogActions>


    </Dialog>
    <Dialog open={isConfirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>ยืนยันการชำระเงิน</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            คุณต้องการยืนยันการชำระเงินสำหรับบริการนี้หรือไม่?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ยอดชำระทั้งหมด: {calculateTotalAmount()} บาท
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} variant="outlined">
            ยกเลิก
          </Button>
          <Button onClick={handlePay}
           variant="contained" color="primary"
           startIcon={loadingPay && <CircularProgress size={20} />} 
           >
            {loadingPay ? 'กำลังชำระเงิน...' : 'ยืนยันการชำระเงิน'}
          </Button>
          
        </DialogActions>
      </Dialog>

      <Dialog 
        open={isReceiptDialogOpen} 
       onClose={handleCloseReceiptDialog} 
        maxWidth="sm"  // ปรับขนาดให้เหมาะสม
        fullWidth={true}  // ขยาย Dialog ให้เต็มหน้าจอ 
     >
    <DialogTitle>ใบเสร็จรับเงิน   
       <IconButton
          edge="end"
          color="inherit"
          onClick={handleCloseReceiptDialog}
          aria-label="close"
          sx={{ position: 'absolute', top: 10, right: 10 }}
        >
          <CloseIcon />
        </IconButton></DialogTitle>
    <DialogContent>
      {/* แสดงใบเสร็จเมื่อสถานะ showReceipt เป็น true */}
    {showReceipt && receiptData && <ReceiptComponent receiptData={receiptData}  isPending ={true}/>}
    </DialogContent>
  </Dialog>
    
    </Paper>
  );
};

export default PendingAppointments;

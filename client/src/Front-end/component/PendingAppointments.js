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
  TableSortLabel,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Select,
  TablePagination,
  TextField,
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // นำเข้า locale ภาษาไทย

dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

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
}));

const formatTime = (timeString) => {
  const time = timeString.split(':');
  return `${time[0]}:${time[1]}`;
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

const PendingAppointments = ({ appointments }) => {
  const [activeCategory, setActiveCategory] = useState('คิวทั้งหมด');
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedItems, setSelectedItems] = useState([]); // จัดการสินค้าที่เลือก
  const [searchTerm, setSearchTerm] = useState('');


  const resetPage = () => setPage(0);
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    resetPage();
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const handleSelectItem = (item) => {
    setSelectedItems((prevItems) => {
      const isDuplicate = prevItems.some(
        (i) =>
          i.id === item.id &&
          i.price_service === item.price_service &&
          i.category_name === item.category_name // เพิ่มตรวจสอบคุณสมบัติเฉพาะ
      );
  
      if (isDuplicate) {
        return prevItems.map((i) =>
          i.id === item.id &&
          i.price_service === item.price_service &&
          i.category_name === item.category_name
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
  
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };
  

  const calculateTotal = () => {
    return selectedItems.reduce(
      (sum, item) => sum + item.quantity * item.price_service,
      0
    );
  };

  const calculateTotalInvoice = () => {
    // ดึงค่าผลรวมจากฐานข้อมูล
    const selectedItemsData = selectedItems.reduce(
      (sum, item) => sum + (item.amount || 0) * (item.subtotal_price || 0),
      0
    );

    const selectedItemsTotal = selectedItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.price_service || 0),
      0
    );

    return selectedItemsTotal + selectedItemsData;
  
  };
  

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${api}/servicecategory`);
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
      const response = await fetch(url);
      if (!response.ok) {
        console.error("Failed to fetch data", response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };
  
  // ฟังก์ชันหลัก
  const handleClickOpen = useCallback((appointment) => {
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
          selectedItems = await fetchData(`${api}/history/vaccine/${appointment.appointment_id}`);
          if (selectedItems) {
            selectedItems = selectedItems.map((item) => ({
              ...item,
              price_service: parseFloat(item.price_service) || 0,
              quantity: item.quantity || 1,
            }));
          }
          break;
  
        case 'ฝากเลี้ยง':
          additionalData = await fetchData(`${api}/appointment/hotel/${appointment.appointment_id}`);
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
          selectedItems = await fetchData(`${api}/medical/invoice/${appointment.appointment_id}`);
          if (selectedItems) {
            selectedItems = selectedItems.map((item) => ({
              ...item,
              amount: parseFloat(item.amount) || 1,
              subtotal_price: parseFloat(item.subtotal_price) || 0,
            }));
            setSelectedItems((prevItems) => [
              ...selectedItems,
              ...prevItems.filter((item) => !selectedItems.some((d) => d.id === item.id)),
            ]);
          }
  
          // ดึงข้อมูล record_medicine
          const recordMedicineData = await fetchData(`${api}/appointment/hotel/${appointment.appointment_id}`);
          if (recordMedicineData) {
            setSelectedAppointment((prev) => ({
              ...prev,
              record_medicine: recordMedicineData.map((item) => item.record_medicine) || [],
            }));
          }
          console.log('recordMedicineData',recordMedicineData)
          break;
  
        default:
          setSelectedItems([]);
      }
  
      setLoading(false);
      setOpenPopup(true);
    };
  
    updateAppointmentDetails();
  }, [setLoading, setSelectedItems, setSelectedAppointment, setOpenPopup ]);
  


  
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

  const handleClose = () => {
    setSelectedItems([])
    setOpenPopup(false);
    setSelectedAppointment(null);
    setSelectedCategory('');
    setSearchTerm('');
  };

  const handlePay = () => {
    // Logic to handle payment
    handleClose(); // Close popup after payment action
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };


  console.log("record_medicine:", selectedAppointment?.record_medicine);

  const filteredAppointments = appointments.filter((appointment) => {
    if (activeCategory === 'คิวทั้งหมด') {
      return (
        appointment.queue_status === 'รอชำระเงิน' &&
        appointment.status === 'อนุมัติ'
      );
    }
    return true;
  });
  // console.log('filteredAppointments',filteredAppointments)

  const filteredCategories = categories.filter(service => 
    (!selectedCategory || service.category_type === selectedCategory) &&
    (!searchTerm || service.category_name.includes(searchTerm))
  );
  const paginatedCategories = filteredCategories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
              <TableCell>เลขที่นัดหมาย</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'appointment_time'}
                  direction={orderBy === 'appointment_time' ? order : 'asc'}
                  onClick={(event) =>
                    handleRequestSort(event, 'appointment_time')
                  }
                >
                  เวลา
                </TableSortLabel>
              </TableCell>
              <TableCell>ชื่อสัตว์</TableCell>
              <TableCell>ประเภทสัตว์เลี้ยง</TableCell>
              <TableCell>ชื่อเจ้าของ</TableCell>
              <TableCell>ประเภทนัดหมาย</TableCell>
              <TableCell>รายละเอียด</TableCell>
              <TableCell sx={{ width: '20%' }}></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments
              .sort(getComparator(order, orderBy))
              .map((appointment) => (
                <TableRow key={appointment.appointment_id}>
                  <TableCell>{dayjs(appointment.appointment_date).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{appointment.appointment_id}</TableCell>
                  <TableCell>
                    {appointment.appointment_time
                      ? formatTime(appointment.appointment_time)
                      : 'ตลอดทั้งวัน'}
                  </TableCell>
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
                    {dayjs(selectedAppointment.start_date).format('DD MMMM YYYY')}
                  </Typography>
                  <Typography>
                    <strong>กำหนดออก:</strong> {dayjs(selectedAppointment.end_date).format('DD MMMM YYYY')}
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
                  <TableCell>ชื่อบริการ</TableCell>
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
              ไม่มีรายการยา
            </Typography>
          )}
        </>
      )}

    {selectedItems.length === 0 ? (
      <Typography>ไม่มีรายการ</Typography>
    ) : selectedAppointment.type === "ตรวจรักษา" ? (
      <>
      <TableContainer component={Paper} sx={{ flexGrow: 1, maxHeight: '80vh', overflowY: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ชื่อบริการ</TableCell>
              <TableCell>จำนวน</TableCell>
              <TableCell>ราคารวม</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {selectedItems.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.category_name}</TableCell>
            <TableCell>{item.quantity || item.amount || 1}</TableCell>
            <TableCell>
            {(item.subtotal_price !== undefined && item.subtotal_price !== null)
              ? item.subtotal_price
              : (item.quantity || 0) * (item.price_service || 0)} บาท
            </TableCell>
          </TableRow>
        ))}
          </TableBody>
        </Table>
      </TableContainer>
        <Box mt={2} display="flex" justifyContent="space-between">
        <Typography variant="h6">ยอดรวม:</Typography>
        <Typography variant="h6">{calculateTotalInvoice()} บาท</Typography>
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
        <Typography variant="h6">{calculateTotal()} บาท</Typography>
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
        <Button onClick={handlePay} variant="contained" color="primary">
        ชำระเงิน
        </Button>
    </DialogActions>
    </Dialog>
    </Paper>
  );
};

export default PendingAppointments;

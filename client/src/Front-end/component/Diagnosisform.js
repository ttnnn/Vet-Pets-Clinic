import React, { useState, useEffect } from 'react';
import { TextField, Button, Paper, Box, Typography, 
  FormControl, FormLabel, RadioGroup, FormControlLabel, 
  Radio, Autocomplete, Select, MenuItem, List, 
  ListItem, ListItemText, InputAdornment, InputLabel, 
  OutlinedInput , Alert,Snackbar , Table,
  TableBody,TableCell,TableContainer,
  TableHead,TableRow,Pagination} from '@mui/material';

import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Import Thai locale for dayjs
import clinicAPI from 'clinicAPI';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate , useLocation } from 'react-router-dom';
import PostponeHotel from './PostponeHotel';
import { debounce } from 'lodash';
import { clinicAPI } from "../../utils/api";

dayjs.locale('th'); // Set dayjs to use Thai locale

const ExamStatusOptions = ['normal', 'abnormal', 'no exam'];

const DiagnosisForm = ({petId , appointmentId , ownerId}) => {
  const [personnelList, setPersonnelList] = useState([]); 
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDataSaved, setIsDataSaved] = useState(false); //ใช้เช็คว่าเซฟรึยัง
  const [alertMessage, setAlertMessage] = useState("");   // ข้อความสำหรับ Alert
  const [alertSeverity, setAlertSeverity] = useState("info"); // กำหนดประเภทของ alert
  const [openSnackbar, setOpenSnackbar] = useState(false); 
  const [openAdmitDialog, setOpenAdmitDialog] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null); 
  const [isQueueSent, setIsQueueSent] = useState(false); // Track if the queue is sent

  const location = useLocation();
  const fromOngoing = location.state?.fromOngoing || false;  //สำหรับเช็คว่าถ้ามาจากการกดส่งคิวรักษาจะสามารถกดปุ่มต่างๆได้ แต่ถ้ามาจากการแก้ประวัติจะบันทึกข้อมูลได้อย่างเดียว
  

  const navigate = useNavigate();
  // State for medical record
  const [formMedical, setFormMedical] = useState({
    rec_temperature: null,
    rec_pressure: null,
    rec_heartrate: null,
    rec_weight: '',
    rec_timee: dayjs().format('HH:mm'),
    rec_date: dayjs().format('YYYY-MM-DD'),
  });
  const [formData, setFormData] = useState({
    diag_cc: '',
    diag_ht: '',
    diag_pe: '',
    diag_majorproblem: '',
    diag_dx: '',
    diag_tentative: '',
    diag_final: '',
    diag_treatment: '',
    diag_client: '',
    diag_note: '',
  });
  const [formphysical, setFormphysical] = useState({
    phy_general: 'no exam',
    phy_integumentary: 'no exam',
    phy_musculo_skeletal: 'no exam',
    phy_circulatory: 'no exam',
    phy_respiratory: 'no exam',
    phy_digestive: 'no exam',
    phy_genito_urinary: 'no exam',
    phy_eyes: 'no exam',
    phy_ears: 'no exam',
    phy_neural_system: 'no exam',
    phy_lymph_nodes: 'no exam',
    phy_mucous_membranes: 'no exam',
    phy_dental: 'no exam',
  });

  const [formDataList, setFormDataList] = useState({
    ribs: '',
    subcutaneous_fat: '',
    abdomen: '',
    waist: '',
    result_bcs: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // จำนวนรายการต่อหน้า

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    const fetchMedicalAndPersonnel = async () => {
      try {
        // ตรวจสอบว่า appointmentId ไม่เป็น null ก่อนเรียก API
        if (!appointmentId) {
          setFormMedical('');
          setFormData('');
          setPersonnelList([]);
          setCategories([]);
          return; // หยุดการทำงานของฟังก์ชัน
        }
  
        // Fetch Medical Data
        setLoading();
        const medicalResponse = await clinicAPI.get(`/medical/form/${appointmentId}`);
    
        if (medicalResponse.data && medicalResponse.data.length > 0) {
          const medicalData = medicalResponse.data[0];
          setFormMedical({
            rec_temperature: medicalData.rec_temperature || null,
            rec_pressure: medicalData.rec_pressure || null,
            rec_heartrate: medicalData.rec_heartrate || null,
            rec_weight: medicalData.rec_weight || null,
            rec_timee: dayjs(medicalData.rec_timee).format('HH:mm'),
            rec_date: dayjs(medicalData.rec_date).format('YYYY-MM-DD'),
          });
          setFormData({
            diag_cc: medicalData.diag_cc || '',
            diag_ht: medicalData.diag_ht || '',
            diag_pe: medicalData.diag_pe || '',
            diag_majorproblem: medicalData.diag_majorproblem || '',
            diag_tentative: medicalData.diag_tentative || '',
            diag_final: medicalData.diag_final || '',
            diag_treatment: medicalData.diag_treatment || '',
            diag_note: medicalData.diag_note || '',

          });
          setFormphysical({
            phy_general: medicalData.phy_general || 'no exam',
            phy_integumentary: medicalData.phy_integumentary || 'no exam',
            phy_musculo_skeletal: medicalData.phy_musculo_skeletal || 'no exam',
            phy_circulatory: medicalData.phy_circulatory || 'no exam',
            phy_respiratory: medicalData.phy_respiratory || 'no exam',
            phy_digestive: medicalData.phy_digestive || 'no exam',
            phy_genito_urinary: medicalData.phy_genito_urinary || 'no exam',
            phy_eyes: medicalData.phy_eyes || 'no exam',
            phy_ears: medicalData.phy_ears || 'no exam',
            phy_neural_system: medicalData.phy_neural_system || 'no exam',
            phy_lymph_nodes: medicalData.phy_lymph_nodes || 'no exam',
            phy_mucous_membranes: medicalData.phy_mucous_membranes || 'no exam',
            phy_dental: medicalData.phy_dental || 'no exam',
          });
          setFormDataList({
            ribs: medicalData.ribs,
            subcutaneous_fat: medicalData.subcutaneous_fat,
            abdomen: medicalData.abdomen ||'',
            waist: medicalData.waist|| '',
            result_bcs: medicalData.result_bcs || '',
          })
          
        } else {
          // กรณีไม่พบข้อมูล ไม่ต้อง alert แต่ตั้งค่าฟอร์มให้ว่างเปล่า
          setFormMedical(null);
          setFormData(null);
        }
    
        // Fetch Personnel Data
        const personnelResponse = await clinicAPI.get(`/personnel`);
        setPersonnelList(personnelResponse.data);
  
        // Fetch Service Categories
        const response = await clinicAPI.get(`/servicecategory`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        // แสดงข้อความใน console เท่านั้น ไม่ alert
      }
    };
  
    fetchMedicalAndPersonnel();
  }, [appointmentId]);


  // ตั้งค่าเริ่มต้น (วันที่และเวลา)
  useEffect(() => {
    const now = dayjs(); //เวลาปัจจุบัน
    setFormMedical((prev) => ({
      ...prev,
      rec_date: now.format('YYYY-MM-DD'), // วันที่
      rec_timee: now.format('HH:mm'),     // เวลา
    }));
  }, []);

  // Handlers for form changes
  const handleMedicalChange = (field) => (event) => {
    setFormMedical({
      ...formMedical,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async () => {
  
    if (!formMedical.rec_temperature || isNaN(parseFloat(formMedical.rec_temperature))) {
      setAlertMessage("กรุณากรอกอุณหภูมิที่ถูกต้อง");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      return;
    }
  
    if (!formMedical.rec_weight || isNaN(parseFloat(formMedical.rec_weight))) {
      setAlertMessage("กรุณากรอกน้ำหนักที่ถูกต้อง");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      return;
    }
  
    if (!selectedPersonnel || !selectedPersonnel.personnel_id) {
      setAlertMessage("กรุณาเลือกสัตวแพทย์ที่รับผิดชอบ");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      return;
    }
    // ตรวจสอบค่าความดันโลหิต (Pressure) ว่ามีและอยู่ในรูปแบบที่ถูกต้อง
  const pressureRegex = /^\d{2,3}\/\d{2,3}$/; // รูปแบบต้องเป็น "ตัวเลข/ตัวเลข" เช่น 120/80
  if (formMedical.rec_pressure && !pressureRegex.test(formMedical.rec_pressure)) {
    setAlertMessage("กรุณากรอกค่าความดันโลหิตในรูปแบบที่ถูกต้อง เช่น 120/80");
    setAlertSeverity("warning");
    setOpenSnackbar(true);
    return;
  }
    // รวมวันที่และเวลา
    const timestamp = dayjs(`${formMedical.rec_date} ${formMedical.rec_timee}`).format('YYYY-MM-DD HH:mm:ss');
    // console.log('personnel_id' , selectedPersonnel)
    // เตรียม payload สำหรับ backend
    const payload = {
      medicalData: {
        ...formMedical,
        rec_temperature: parseFloat(formMedical.rec_temperature), 
        rec_weight: parseFloat(formMedical.rec_weight), 
        rec_time: timestamp, // รวมวันที่และเวลา
        pet_id: petId,         // เพิ่ม pet_id
        appointment_id: appointmentId, // เพิ่ม appointment_id
        personnel_id: selectedPersonnel ? selectedPersonnel.personnel_id : null,
      },
      diagnosisData: formData,
      physicalData: formphysical,
      
    };
    
    // console.log("rec_temperature:", parseFloat(formMedical.rec_temperature));
    // console.log("rec_weight:", parseFloat(formMedical.rec_weight));

    console.log("data:",payload);
    try {
 
      await clinicAPI.post(`/treatment/diagnosis`, payload);
      setIsDataSaved(true);  // เมื่อบันทึกสำเร็จให้เปลี่ยนสถานะ
      setAlertMessage("ข้อมูลได้ถูกบันทึกสำเร็จ!");
      setAlertSeverity("success");  // ประเภทของ Alert
      setOpenSnackbar(true);
      // handleReset();
      
    } catch (error) {
      setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setAlertSeverity("error");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
    }
  };
  

  const handleFormChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handlePhysicalChange = (field) => (event) => {
    setFormphysical({
      ...formphysical,
      [field]: event.target.value,
    });
  };

  const filteredServices = categories.filter((service) => {
    const matchesSearch =
      service.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || service.category_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });


  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRemoveItem = (category_id) => {
    setSelectedItems(selectedItems.filter((item) => item.category_id !== category_id)); // ลบรายการที่เลือก
  };
  
  

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  
  const handleQuantityChange = (categoryId, value) => {
    // เช็คว่าเป็นค่าว่างหรือไม่ และเปลี่ยนให้เป็น 0 ถ้าเป็นค่าว่าง
    const quantity = value === '' ? 0 : Math.max(0, parseInt(value)); // ตรวจสอบให้มีค่าต่ำสุดที่ 0
  
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.category_id === categoryId
          ? { ...item, quantity } // อัพเดตจำนวนของ item ที่เลือก
          : item
      )
    );
  };

  const calculateTotalPrice = (selectedItems) => {
    return selectedItems.reduce((total, item) => {
      // คำนวณราคาของแต่ละรายการโดยคูณราคาต่อหน่วยกับจำนวน
      return total + (item.price_service * item.quantity);
    }, 0); // เริ่มต้นที่ 0
  };
  
  const showAlert = (message, severity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenSnackbar(true);
  };


  const handleTopageAppointment = debounce(async () => {
    if (!isDataSaved) {
      showAlert("กรุณาบันทึกข้อมูลก่อน", "warning");
      return; // หยุดการทำงานหากยังไม่ได้บันทึก
    }
  
    if (!isQueueSent) {
      showAlert("กรุณาส่งคิวนัดหมายปัจจุบันก่อน", "warning");
      return; // หยุดการทำงานหากคิวยังไม่ได้ส่ง
    }

    navigate('/clinic/appointment', { state: { locationOwnerID: ownerId , locationActiveTab: 2 ,locationPetID : petId} });
  },300)

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);  // ปิด Snackbar
  };

  const handleToAdmit = debounce(() => {
    if (!isDataSaved) {
      showAlert("กรุณาบันทึกข้อมูลก่อน", "warning");
      return; // หยุดการทำงานหากยังไม่ได้บันทึก
    }
    
    console.log('appointmentId', appointmentId);
    console.log('petId', petId);
    console.log('openAdmitDialog', openAdmitDialog);
    
    setSelectedAppointmentId(appointmentId);
    setSelectedPetId(petId);
    setOpenAdmitDialog(true);
  }, 300); // ปรับระยะเวลาตามความเหมาะสม

  //ส่งคิว
  const handleSendQueue = debounce(async () => {
    try {
      if (!isDataSaved) {
        showAlert("กรุณาบันทึกข้อมูลก่อน", "warning");
        return; // หยุดการทำงานหากยังไม่ได้บันทึก
      }
      if (isQueueSent) { // ตรวจสอบว่าเคยส่งคิวไปแล้วหรือไม่
        showAlert("คุณกดส่งคิวไปแล้ว", "warning");
        return; // หยุดการทำงานหากเคยส่งคิวไปแล้ว
      }
       // 1. ถ้าไม่มีการเลือกรายการสินค้า ให้ทำแค่การอัปเดตสถานะคิว
    if (selectedItems.length === 0) {
      // อัปเดตสถานะคิว
      const statusUpdates = {
        appointment_id: appointmentId,
        pet_id: petId,
        status: 'อนุมัติ',
        queue_status: 'รอชำระเงิน',
      };

      await clinicAPI.put(`/appointment/${appointmentId}`, statusUpdates);
      showAlert("ข้อมูลถูกส่งเข้าคิวสำเร็จ", "success");
      setIsQueueSent(true); // กำหนดสถานะคิวว่าได้ถูกส่งไปแล้ว
      return; // หยุดการทำงานเมื่อไม่มีรายการสินค้า
    }

  
      // 2. ถ้ามีการเลือกรายการสินค้า ให้บันทึกข้อมูลทั้งหมด (ใบเสร็จ, การชำระเงิน, รายการสินค้า)
      const selectedItemsData = selectedItems.map((item) => ({
        category_id: item.category_id,
        amount: item.quantity,
        price_service: item.price_service,
      }));
      
      console.log('selectedItemsData',selectedItemsData)
      const paymentData = {
        total_payment: calculateTotalPrice(selectedItems), // คำนวณราคา
        payment_date: new Date(),
      };
      console.log('paymentData',paymentData)
      // 2. เรียก API เพื่อบันทึกข้อมูลทั้งหมด (ใบเสร็จ, การชำระเงิน, รายการสินค้า)
      const response = await clinicAPI.post(`/create-invoice`, {
        appointmentId,
        selectedItems: selectedItemsData,
        totalAmount: paymentData.total_payment,
      });

  
      if (response.data.status === 'success') {
        showAlert("ข้อมูลถูกบันทึกสำเร็จ", "success");
        setIsQueueSent(true); // กำหนดสถานะคิวว่าได้ถูกส่งไปแล้ว
        setSelectedItems([]);

        // 3. อัปเดตสถานะคิว
        const statusUpdates = {
          appointment_id: appointmentId,
          pet_id: petId,
          status: 'อนุมัติ',
          queue_status: 'รอชำระเงิน',
        };
  
        await clinicAPI.put(`/appointment/${appointmentId}`, statusUpdates);
        showAlert("ข้อมูลถูกส่งเข้าคิวสำเร็จ", "success");
  

      } else {
        showAlert("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
      }
  
    } catch (error) {
      showAlert("เกิดข้อผิดพลาดในการส่งข้อมูลเข้าคิว", "error");
    }
  }, 300); // กำหนดเวลาหน่วง 300ms
  

  const handleAddItem = (service) => {
    // ตรวจสอบว่า item นั้นๆ ยังไม่อยู่ใน selectedItems
    const existingItemIndex = selectedItems.findIndex((item) => item.category_id === service.category_id);
    if (existingItemIndex !== -1) {
      // ถ้ามีแล้วเพิ่มจำนวน
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1; // เพิ่มจำนวนในรายการที่มีอยู่
      setSelectedItems(updatedItems); // อัพเดต state
    } else {
      // ถ้าไม่มีให้เพิ่ม item ใหม่
      setSelectedItems([...selectedItems, { ...service, quantity: 1 }]);
    }
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h5" gutterBottom>
        เลขที่นัดหมาย : {appointmentId || ''}
    </Typography>
    <Box>
    <Typography variant="h6" gutterBottom>
        ผลการตรวจ Body Condition Score
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="medical results table">
          <TableHead>
            <TableRow>
              <TableCell align="center"  sx={{ backgroundColor: '#f0f0f0', color: '#333', fontWeight: 'bold' }}>Ribs</TableCell>
              <TableCell align="center"  sx={{ backgroundColor: '#f0f0f0', color: '#333', fontWeight: 'bold' }}>Subcutaneous Fat</TableCell>
              <TableCell align="center"  sx={{ backgroundColor: '#f0f0f0', color: '#333', fontWeight: 'bold' }}>Abdomen</TableCell>
              <TableCell align="center"  sx={{ backgroundColor: '#f0f0f0', color: '#333', fontWeight: 'bold' }} >Waist</TableCell>
              <TableCell align="center"  sx={{ backgroundColor: '#f0f0f0', color: '#333', fontWeight: 'bold' }} >Result BCS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center" >{formDataList.ribs}</TableCell>
              <TableCell align="center">{formDataList.subcutaneous_fat}</TableCell>
              <TableCell align="center">{formDataList.abdomen}</TableCell>
              <TableCell align="center">{formDataList.waist}</TableCell>
              <TableCell align="center">{formDataList.result_bcs}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
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

      {/* Medical Record Section */}
      <Box display="flex" flexDirection="row" gap={3} alignItems="center" mb={3} mt={5}>
        
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
       <Autocomplete
        options={personnelList.filter(personnel => personnel.role === 'สัตวแพทย์')}
        getOptionLabel={(personnel) => personnel ? `${personnel.first_name} ${personnel.last_name}` : ''}
        onChange={(event, value) => setSelectedPersonnel(value || null)}
        value={selectedPersonnel ? personnelList.find(p => p.personnel_id === selectedPersonnel.personnel_id) : null}
        renderInput={(params) => (
        <TextField {...params} label="สัตวแพทย์" variant="outlined" fullWidth />  )}
        style={{ flex: 0.5 ,maxWidth: '50%' }} 
      />
 

      </Box>

      <Box display="flex" flexDirection="row" gap={5}>
      {/* Temperature */}
      <FormControl variant="outlined" sx={{ width: '25ch' }}>
        <InputLabel shrink>Temperature</InputLabel>
        <OutlinedInput
          type="text"
          value={formMedical.rec_temperature}
          onChange={handleMedicalChange('rec_temperature')}
          endAdornment={<InputAdornment position="end">°C</InputAdornment>}
          label="Temperature"
        />
      </FormControl>

      {/* Pressure */}
      <FormControl variant="outlined" sx={{ width: '25ch' }}>
        <InputLabel shrink>Pressure</InputLabel>
        <OutlinedInput
          type="text"
          value={formMedical.rec_pressure}
          onChange={handleMedicalChange('rec_pressure')}
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
          value={formMedical.rec_heartrate}
          onChange={handleMedicalChange('rec_heartrate')}
          endAdornment={<InputAdornment position="end">bpm</InputAdornment>}
          label="Heart Rate"
        />
      </FormControl>

      {/* Weight */}
      <FormControl variant="outlined" sx={{ width: '25ch' }}>
        <InputLabel shrink>Weight</InputLabel>
        <OutlinedInput
          type="text"
          value={formMedical.rec_weight}
          onChange={handleMedicalChange('rec_weight')}
          endAdornment={<InputAdornment position="end">kg</InputAdornment>}
          label="Weight"
        />
      </FormControl>
    </Box>
      <Box display="flex" flexDirection="row" gap={3} sx={{marginTop: '40px'}}>
        {/* Left Column: Diagnosis Form */}
        <Box flex={1}>
          {['diag_cc', 'diag_ht', 'diag_pe', 'diag_majorproblem', 'diag_dx', 'diag_tentative', 'diag_final', 'diag_treatment',  'diag_client', 'diag_note'].map(
            (field) => (
              <Box mb={3} key={field}>
                <Typography variant="h7" gutterBottom>
                  {field.replace('diag_', '').toUpperCase()}:
                </Typography>
                <TextField
                  fullWidth
                  value={formData[field]}
                  onChange={handleFormChange(field)}
                  multiline
                />
              </Box>
            )
          )}
        </Box>

        {/* Right Column: Physical Examination */}
        <Box
          style={{
            border: '1px solid black',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '20px',
            maxWidth: '600px', // กำหนดความกว้างสูงสุด
          }}
        >
          <Typography variant="h6" gutterBottom>
            Physical Examination
          </Typography>
          {Object.keys(formphysical).map((field) => (
            <Box mb={2} key={field}>
              <FormControl>
                <FormLabel style={{ fontSize: '0.9rem' }}>
                  {field.replace('phy_', '').replace('_', ' ').toUpperCase()}
                </FormLabel>
                <RadioGroup
                  row
                  value={formphysical[field]}
                  onChange={handlePhysicalChange(field)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {ExamStatusOptions.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio size="small" />}
                      label={<span style={{ fontSize: '0.8rem' }}>{option}</span>}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          ))}
        </Box>
      </Box>
      <Box mt={2}  display="flex" justifyContent="flex-end" gap={2} >
          <Button variant="contained" color="primary" onClick={handleSubmit} >
          บันทึกการตรวจรักษา
        </Button>
       </Box>

      <Typography variant="h6" gutterBottom>
         รายการตรวจรักษา (Tx) และสั่งจ่ายยา (Rx)
      </Typography>

      <Box display="flex" flexDirection="column" gap={3}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 200 }}>
          <Typography>กำลังโหลดข้อมูล...</Typography>
        </Box>
      ) : (
        <Box display="flex" gap={3}>
          {/* ตารางรายการทั้งหมด */}
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              รายการทั้งหมด
            </Typography>
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              displayEmpty
              variant="outlined"
              sx={{ minWidth: 200, marginBottom: 2 }}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {[...new Set(categories.map((service) => service.category_type))].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="ค้นหาบริการ"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              sx={{ width: '100%', maxWidth: 600, marginBottom: 2 }}
            />
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ชื่อบริการ</TableCell>
                    <TableCell>ประเภท</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedServices.map((service) => (
                    <TableRow key={service.category_id}>
                      <TableCell>{service.category_name}</TableCell>
                      <TableCell>{service.category_type}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleAddItem(service)}>เพิ่ม</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" marginTop={2}>
              <Pagination
                count={Math.ceil(filteredServices.length / itemsPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </Box>

          {/* รายการที่เลือก */}
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              รายการที่เลือก
            </Typography>
            {selectedItems.length > 0 ?(
              <List>
                {selectedItems.map((item, index) => (
                  <ListItem
                    key={`${item.category_id}-${index}`}
                    secondaryAction={
                      <Box display="flex" gap={2} alignItems="center">
                        <Typography>จำนวน</Typography>
                        <TextField
                          type="number"
                          variant="outlined"
                          size="small"
                          value={item.quantity || ''}
                          onChange={(e) => handleQuantityChange(item.category_id, e.target.value)}
                          inputProps={{ min: 0, style: { textAlign: 'center' } }}
                          sx={{ width: 70 }}
                        />
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveItem(item.category_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={`${item.category_name}`}
                      secondary={`ประเภท: ${item.category_type}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary">ไม่มีรายการที่เลือก</Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>



      {/* Submit Button */}
      <Box mt={2}  display="flex" justifyContent="flex-end" gap={2} >
      <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleToAdmit}
          disabled={!fromOngoing} 
        >
          ส่งเข้า Admit
        </Button>

        <Button variant="outlined" color="primary"  onClick={handleTopageAppointment} disabled={!fromOngoing} >
          นัดหมายล่วงหน้า
        </Button>
        <Button variant="outlined" color="primary"  onClick={handleSendQueue} disabled={!fromOngoing} >
         ส่งคิว
        </Button>
      </Box>

      <PostponeHotel
        open={openAdmitDialog}
        handleClose={() => setOpenAdmitDialog(false)}
        appointmentId={selectedAppointmentId}
        petId={selectedPetId}
        isAdmitBooking={true} 
      />
    </Paper>
  );
};

export default DiagnosisForm;

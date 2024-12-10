import React, { useState, useEffect } from 'react';
import { TextField, Button, Paper, Box, Typography, 
  FormControl, FormLabel, RadioGroup, FormControlLabel, 
  Radio, Autocomplete, Select, MenuItem, List, 
  ListItem, ListItemText, InputAdornment, InputLabel, 
  OutlinedInput , Alert,Snackbar} from '@mui/material';

import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Import Thai locale for dayjs
import axios from 'axios';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import PostponeHotel from './PostponeHotel';

dayjs.locale('th'); // Set dayjs to use Thai locale
const api = 'http://localhost:8080/api/clinic';

const ExamStatusOptions = ['normal', 'abnormal', 'no exam'];

const DiagnosisForm = ({petId , appointmentId , ownerId}) => {
  // console.log('Pet ID:', petId);
  // console.log('appointmentId:', appointmentId);
  const [personnelList, setPersonnelList] = useState([]); 
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isDataSaved, setIsDataSaved] = useState(false); //ใช้เช็คว่าเซฟรึยัง
  const [alertMessage, setAlertMessage] = useState("");   // ข้อความสำหรับ Alert
  const [alertSeverity, setAlertSeverity] = useState("info"); // กำหนดประเภทของ alert
  const [openSnackbar, setOpenSnackbar] = useState(false); 
  // const [appointmentHotel, setAppointmentHotel] = useState([]);
  const [openAdmitDialog, setOpenAdmitDialog] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);


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

  // const handleReset = () => {
    // const now = dayjs();
    // setFormMedical({
      // rec_temperature: '',
      // rec_pressure: '',
      // rec_heartrate: '',
      // rec_weight: '',
      // rec_timee: now.format('HH:mm'),
      // rec_date: now.format('YYYY-MM-DD'),
    // });
    // setFormData({
      // diag_cc: '',
      // diag_ht: '',
      // diag_pe: '',
      // diag_majorproblem: '',
      // diag_dx: '',
      // diag_tentative: '',
      // diag_final: '',
      // diag_treatment: '',
      // diag_client: '',
      // diag_note: '',
    // });
    // setFormphysical({
      // phy_general: 'no exam',
      // phy_integumentary: 'no exam',
      // phy_musculo_skeletal: 'no exam',
      // phy_circulatory: 'no exam',
      // phy_respiratory: 'no exam',
      // phy_digestive: 'no exam',
      // phy_genito_urinary: 'no exam',
      // phy_eyes: 'no exam',
      // phy_ears: 'no exam',
      // phy_neural_system: 'no exam',
      // phy_lymph_nodes: 'no exam',
      // phy_mucous_membranes: 'no exam',
      // phy_dental: 'no exam',
    // });
    // setSelectedPersonnel(null);
  // };

  useEffect(() => {
    const fetchMedicalAndPersonnel = async () => {
      try {
        // Fetch Medical Data
        setLoading();
        const medicalResponse = await axios.get(`${api}/medical/form/${appointmentId}`);
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
          });
        } else {
          alert('ไม่พบข้อมูลการรักษานี้');
        }

        // Fetch Personnel Data
        const personnelResponse = await axios.get(`${api}/personnel`);
        setPersonnelList(personnelResponse.data);

        const response = await axios.get(`${api}/servicecategory`);
          // console.log('servicecategory' ,response.data )
          setCategories(response.data);

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('ไม่สามารถดึงข้อมูลได้');
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
 
      const response = await axios.post(`${api}/treatment/diagnosis`, payload);
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

  //เพิ่มรายการที่เลือก
  const handleServiceSelect = (event, value) => {
    if (value && !selectedItems.some((item) => item.category_id === value.category_id)) {
      setSelectedItems([...selectedItems, { ...value, quantity: 1 }]);
      setSelectedService(null); // รีเซตค่าที่เลือกใน Autocomplete
      setSearchTerm(''); // รีเซตค่าในกล่องค้นหา
    }
  };
  

  const handleRemoveItem = (category_id) => {
    setSelectedItems(selectedItems.filter((item) => item.category_id !== category_id)); // ลบรายการที่เลือก
  };
  
  

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  //จำนวนสินค้าที่ต้องการ 
  const handleQuantityChange = (category_id, quantity) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.category_id === category_id ? { ...item, quantity: Number(quantity) } : item
      )
    );
  };
  const handleTopageAppointment =()=>{
    if (!isDataSaved) {
      setAlertMessage("กรุณาบันทึกข้อมูลก่อน");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      return; // หยุดการทำงานหากยังไม่ได้บันทึก
    }

    navigate('/appointment', { state: { locationOwnerID: ownerId , locationActiveTab: 2 ,locationPetID : petId} });
  }
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);  // ปิด Snackbar
  };
  const handleToAdmit =()=>{
    if (!isDataSaved) {
      setAlertMessage("กรุณาบันทึกข้อมูลก่อน");
      setAlertSeverity("warning");  // ประเภทของ Alert
      setOpenSnackbar(true);  // เปิดการแสดง Snackbar
      return; // หยุดการทำงานหากยังไม่ได้บันทึก
    }
                
      setSelectedAppointmentId(appointmentId);
      setSelectedPetId(petId);
      setOpenAdmitDialog(true);
  }

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h5" gutterBottom>
        Medical Record and Diagnosis
      </Typography>
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

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 200 }}>
          <Typography>กำลังโหลดข้อมูล...</Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Dropdown and Search Section */}
          <Box display="flex" gap={2} alignItems="center">
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              displayEmpty
              variant="outlined"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {[...new Set(categories.map((service) => service.category_type))].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            <Autocomplete
              options={filteredServices}
              getOptionLabel={(option) => option.category_name}
              onChange={handleServiceSelect}
              value={selectedService}
              sx={{ width: '100%', maxWidth: 600 }}
              isOptionEqualToValue={(option, value) => option.category_id === value.category_id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ค้นหาบริการ"
                  placeholder="ค้นหา..."
                  variant="outlined"
                  sx={{ flex: 1 }}
                />
              )}

            />

          </Box>

          {/* เลือกรายการ+สั่งยา */}
          <Box>
            <Typography variant="h6" gutterBottom>
              รายการที่เลือก
            </Typography>
            {selectedItems.length > 0 ? (
              <List>
                {selectedItems.map((item,index) => (
                  <ListItem
                   key={`${item.category_id}-${index}`} 
                    secondaryAction={
                      <Box display="flex" gap={2} alignItems="center">
                      <Typography>จำนวน</Typography>
                      <TextField
                        // label="จำนวน"
                        type="number"
                        variant="outlined"
                        size="small"
                        value={item.quantity || 1} // ค่าจำนวนเริ่มต้นเป็น 0
                        onChange={(e) => handleQuantityChange(item.category_id, e.target.value)}
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


      {/* Submit Button */}
      <Box mt={2}  display="flex" justifyContent="flex-end" gap={2} >
      <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleToAdmit}
        >
          ส่งเข้า Admit
        </Button>

        <Button variant="outlined" color="primary"  onClick={handleTopageAppointment}>
          นัดหมายล่วงหน้า
        </Button>
        <Button variant="outlined" color="primary"  >
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

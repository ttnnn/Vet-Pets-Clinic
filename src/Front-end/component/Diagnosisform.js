import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Paper,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete
} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Import Thai locale for dayjs
import axios from 'axios';
dayjs.locale('th'); // Set dayjs to use Thai locale
const api = 'http://localhost:8080';

const ExamStatusOptions = ['normal', 'abnormal', 'no exam'];

const DiagnosisForm = ({petId}) => {
  console.log('Pet ID:', petId);
  const [personnelList, setPersonnelList] = useState([]); 
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  // State for medical record

  const defaultMedical = {
    rec_temperature: '',
    rec_pressure: '',
    rec_heartrate: '',
    rec_weight: '',
    rec_timee: '',
    rec_date: '',
  };
  
  const defaultDiagnosis = {
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
  };

  const defaultPhysical = {
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
  };

  const [formMedical, setFormMedical] = useState(defaultMedical);
  const [formData, setFormData] = useState(defaultDiagnosis);
  const [formphysical, setFormphysical] = useState(defaultPhysical);

  const handleReset = () => {
    const now = dayjs(); // เวลาปัจจุบัน
    setFormMedical({
      rec_temperature: '',
      rec_pressure: '',
      rec_heartrate: '',
      rec_weight: '',
      rec_timee: now.format('HH:mm'),
      rec_date: now.format('YYYY-MM-DD'),
    });
    setFormData(defaultDiagnosis);
    setFormphysical(defaultPhysical);
    setSelectedPersonnel('');
  };

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await axios.get(`${api}/personnel`);
        console.log('response',response)
        setPersonnelList(response.data);
      } catch (error) {
        console.error('Error fetching personnel:', error);
      }
    };
    fetchPersonnel();
  
  }, []);

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
        // appointment_id: formMedical.appointment_id, // เพิ่ม appointment_id
        personnel_id: selectedPersonnel ? selectedPersonnel.personnel_id : null,
      },
      diagnosisData: formData,
      physicalData: formphysical,
      
    };
    console.log("rec_temperature:", parseFloat(formMedical.rec_temperature));
console.log("rec_weight:", parseFloat(formMedical.rec_weight));

    console.log("data:",payload);
    try {
 
      const response = await axios.post(`${api}/treatment/diagnosis`, payload);
      alert(response.data.message); 
      handleReset()
      
    } catch (error) {
      console.error('Error saving records:', error);
      alert('ไม่สามารถบันทึกข้อมูลได้');
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

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h5" gutterBottom>
        Medical Record and Diagnosis
      </Typography>

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
        style={{ flex: 0.5 }} 
      />
 

      </Box>
      <Box display="flex" flexDirection="row" gap={5}>
        <TextField
          label="Temperature (°C)"
          type="text"
          value={formMedical.rec_temperature}
          onChange={handleMedicalChange('rec_temperature')}
          fullWidth
        />
        <TextField
          label="Pressure (mmHg)"
          type="text"
          value={formMedical.rec_pressure}
          onChange={handleMedicalChange('rec_pressure')}
          fullWidth
        />
        <TextField
          label="Heart Rate (bpm)"
          type="text"
          value={formMedical.rec_heartrate}
          onChange={handleMedicalChange('rec_heartrate')}
          fullWidth
        />
        <TextField
          label="Weight (kg)"
          type="text"
          value={formMedical.rec_weight}
          onChange={handleMedicalChange('rec_weight')}
          fullWidth
        />
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

      {/* Submit Button */}
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth>
          บันทึกการตรวจรักษา
        </Button>
      </Box>
    </Paper>
  );
};

export default DiagnosisForm;

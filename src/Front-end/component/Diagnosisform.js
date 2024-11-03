import React, { useState } from 'react';
import { TextField,  Button, Paper,Box,Typography } from '@mui/material';
import axios from 'axios';
const api = 'http://localhost:8080'

const DiagnosisForm = ()=> {
    const [formData, setFormData] = useState({
        diag_cc: '',
        diag_ht: '',
        diag_pe: '',
        diag_majorproblem: '',
        diag_dx: '',
        diag_tentative: '',
        diag_final: '',
        diag_treatment: '',
    });

    const handleChange = (field) => (event) => {
        setFormData({
            ...formData,
            [field]: event.target.value,
        });
    };

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${api}/treatment/diagnosis`, formData);
            alert(response.data.message);
        } catch (error) {
            alert('Failed to save the record.');
        }
    };

    return (
       
        <Paper style={{ padding: 20 }}>
        {/* Chief Complaint Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>Chief Complaint (CC) :</Typography>
          <TextField
            fullWidth
            value={formData.diag_cc}
            onChange={handleChange('diag_cc')}
          />
        </Box>
    
        {/* History Taking Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>History Taking (HT) :</Typography>
          <TextField
            fullWidth
            value={formData.diag_ht}
            onChange={handleChange('diag_ht')}
          />
        </Box>
    
        {/* Physical Examination Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>Physical Examination (PE) :</Typography>
          <TextField
            fullWidth
            value={formData.diag_pe}
            onChange={handleChange('diag_pe')}
          />
        </Box>
    
        {/* Major Problem Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>Major Problem :</Typography>
          <TextField
            fullWidth
            value={formData.diag_majorproblem}
            onChange={handleChange('diag_majorproblem')}
          />
        </Box>
    
        {/* Diagnosis Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>Diagnosis :</Typography>
          <TextField
            fullWidth
            value={formData.diag_dx}
            onChange={handleChange('diag_dx')}
          />
        </Box>
    
        {/* Tentative Diagnosis Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>Tentative Diagnosis :</Typography>
          <TextField
            fullWidth
            value={formData.diag_tentative}
            onChange={handleChange('diag_tentative')}
          />
        </Box>
    
        {/* Final Diagnosis Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>Final Diagnosis :</Typography>
          <TextField
            fullWidth
            value={formData.diag_final}
            onChange={handleChange('diag_final')}
          />
        </Box>
    
        {/* Treatment Section */}
        <Box mb={3}>
          <Typography variant="h7" gutterBottom>Treatment :</Typography>
          <TextField
            label=""
            fullWidth
            value={formData.diag_treatment}
            onChange={handleChange('diag_treatment')}
          />
        </Box>
    
        {/* Submit Button */}
        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth>
            บันทึกการตรวจรักษา
          </Button>
        </Box>
      </Paper>
    );
}


export default DiagnosisForm;

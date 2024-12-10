import React, { useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography } from '@mui/material';

const Register = () => {
  const [firstname, setFiratName] = useState('');
  const [lastname, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const Navigate = useNavigate();

  const handleRegister = (event) => {
    // Handle registration logic (e.g., API call)
    event.preventDefault();
    if (firstname.trim() === "") {
      console.log("Input is empty");
    } else {
      console.log("Input is not empty");
      Navigate('/home');
    }
   
  };


  return (
    <Container maxWidth="xs">
      <Typography variant="h4" gutterBottom>Register</Typography>
       <TextField
        error
        label="ชื่อ"
        variant="outlined"
        fullWidth
        margin="normal"
        value={firstname}
        onChange={(e) => setFiratName(e.target.value)}
      />
      <TextField
        error
        label="นามสกุล"
        variant="outlined"
        fullWidth
        margin="normal"
        value={lastname}
        onChange={(e) => setLastName(e.target.value)}
      />
      
      <TextField
        error
        label="Phone"
        variant="outlined"
        fullWidth
        margin="normal"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button variant="contained" color="primary" fullWidth onClick={handleRegister}>
        Register
      </Button>
    
      
    </Container>
  );
};

export default Register;

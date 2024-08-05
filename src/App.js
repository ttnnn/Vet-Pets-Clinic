import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom'; 
import './Front-end/Home.css';
import Navbar from './Front-end/Navbar';
import HomeDashboard from './Front-end/HomeDashboard';
import RegisterPage from './Front-end/RegisterPage';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className='Content'>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomeDashboard />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/appointment" element={<RegisterPage />} />
          <Route path="/category" element={<RegisterPage />} />
          <Route path="/finance" element={<RegisterPage />} />
          <Route path="/dashboard" element={<RegisterPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

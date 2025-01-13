import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'; 
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './Front-end/page/Navbar';
import HomePage from './Front-end/page/HomePage';
import RegisterPage from './Front-end/page/RegisterPage';
import AppointmentPage from './Front-end/page/AppointmentPage';
import FinancePage from './Front-end/page/FinancePage';
import CategoryPage from './Front-end/page/CategoryPage';
import LoginPage from './Front-end/page/LoginPage';
import PetProfilePage from './Front-end/page/ProfilePage'
import Register from './Front-end/customer/Register';
import Home from './Front-end/customer/Home';
import HistoryPage from './Front-end/customer/HistoryPage';
import PetsPage from './Front-end/customer/PetsPage';
import PetsDetail from './Front-end/customer/PetsDetail';
import AppointmentDetail from './Front-end/customer/AppointmentDetail';
import Line from './Front-end/customer/Line';
import LineAuth from './Front-end/customer/LineAuth'
import SecurityAdminPage from './Front-end/page/SecurityAdminPage';
import ServiceAppointment from './Front-end/customer/ServiceAppointment';
import PrivateRoute from './Front-end/customer/PrivateRoute'; 
import Dashboard from './Front-end/page/Dashboard';
import axios from 'axios';
const api = 'http://localhost:8080/api/clinic';

const theme = createTheme();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const location = useLocation();

    // ตรวจสอบ token ใน sessionStorage เมื่อโหลดหน้า
    useEffect(() => {
      const token = sessionStorage.getItem('token');
      if (token) {
        axios
          .get(`${api}/validate-token`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => {
            if (response.data.success) {
              setIsAuthenticated(true); // อัปเดตสถานะการล็อกอิน
            } else {
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('isAuthenticated');
              setIsAuthenticated(false);
            }
          })
          .catch(() => {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
          });
      }
    }, []); // ทำงานเมื่อโหลดหน้า
    
    const handleLogin = (token) => {
      sessionStorage.setItem('token', token); // บันทึก Token
      sessionStorage.setItem('isAuthenticated', 'true'); // บันทึกสถานะ
      setIsAuthenticated(true); // อัปเดต UI
    };
    
    const handleLogout = () => {
      sessionStorage.removeItem('token'); // ลบ Token
      sessionStorage.removeItem('isAuthenticated'); // ลบสถานะ
      setIsAuthenticated(false); // อัปเดต UI
    };
    




  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
         {isAuthenticated && location.pathname !== '/login' && <Navbar onLogout={handleLogout} />}

        <div className='Content'>
          <Routes>
            <Route 
              path="/login" 
              element={<LoginPage onLogin={handleLogin} />} 
            />
            <Route 
              path="/clinic/home" 
              element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clinic/register" 
              element={isAuthenticated ? <RegisterPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clinic/appointment" 
              element={isAuthenticated ? <AppointmentPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clinic/category" 
              element={isAuthenticated ? <CategoryPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clinic/finance" 
              element={isAuthenticated ? <FinancePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clinic/dashboard" 
              element={isAuthenticated ? <Dashboard/> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clinic/pet-profile"
               element={<PetProfilePage />} />

            <Route 
              path="/clinic/admin" 
              element={isAuthenticated ? <SecurityAdminPage/> : <Navigate to="/login" />} 
            />

             {/* สำหรับลูกค้า */}
             <Route path="/customer/line-login" element={<Line />} />
              <Route path="/customer/line" element={<LineAuth />} /> 
             <Route path="/customer/login" element={<Register />} />
              <Route element={<PrivateRoute />}>
                <Route path="/customer/home" element={<Home />} />
                <Route path="/customer/history" element={<HistoryPage />} />
                <Route path="/customer/pets" element={<PetsPage />} />
                <Route path="/customer/serviceappointment" element={<ServiceAppointment />} />
                <Route path="/customer/appointment" element={<AppointmentDetail />} />
                <Route path="/customer/petsdetail" element={<PetsDetail />} />
            
              </Route>
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

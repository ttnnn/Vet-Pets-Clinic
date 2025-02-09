import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom'; 
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './Front-end/page/Navbar';
import HomePage from './Front-end/page/HomePage';
import RegisterPage from './Front-end/page/RegisterPage';
import AppointmentPage from './Front-end/page/AppointmentPage';
import FinancePage from './Front-end/page/FinancePage';
import CategoryPage from './Front-end/page/CategoryPage';
import LoginPage from './Front-end/page/LoginPage';
import PetProfilePage from './Front-end/page/ProfilePage';
import Register from './Front-end/customer/Register';
import Home from './Front-end/customer/Home';
import HistoryPage from './Front-end/customer/HistoryPage';
import PetsPage from './Front-end/customer/PetsPage';
import PetsDetail from './Front-end/customer/PetsDetail';
import AppointmentDetail from './Front-end/customer/AppointmentDetail';
import Line from './Front-end/customer/Line';
import LineAuth from './Front-end/customer/LineAuth';
import SecurityAdminPage from './Front-end/page/SecurityAdminPage';
import ServiceAppointment from './Front-end/customer/ServiceAppointment';
import Dashboard from './Front-end/page/Dashboard';
import { Navigate } from 'react-router-dom';
import { customerAPI  } from "./utils/api";

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const ProtectedRouteLine = ({ element }) => {
  const lineToken = localStorage.getItem("lineToken");

  if (!lineToken) {
    return <Navigate to="/customer/login" />;
  }

  return element;
};

const NotFoundRedirect = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/customer")) {
    return <Navigate to="/customer/line-login" replace />;
  } else if (location.pathname.startsWith("/clinic")) {
    return <Navigate to="/login" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
};


const theme = createTheme();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();



     // ตรวจสอบ token ใน sessionStorage เมื่อโหลดหน้า
     useEffect(() => {
      const token = sessionStorage.getItem('token');
      if (token) {
        customerAPI
          .get(`/validate-token`, {
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
    sessionStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {isAuthenticated && location.pathname !== '/login' && <Navbar onLogout={handleLogout} />}
        <div className='Content'>
          <Routes>
            {/* หน้า Login */}
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

            {/* Protected Routes */}
            <Route 
              path="/clinic/home" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinic/register" 
              element={
                <ProtectedRoute>
                  <RegisterPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinic/appointment" 
              element={
                <ProtectedRoute>
                  <AppointmentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinic/category" 
              element={
                <ProtectedRoute>
                  <CategoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinic/finance" 
              element={
                <ProtectedRoute>
                  <FinancePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinic/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinic/admin" 
              element={
                <ProtectedRoute>
                  <SecurityAdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clinic/pet-profile"
              element={<PetProfilePage />} 
            />

            {/* สำหรับลูกค้า */}
           
              {/* ต้อง Login LINE ก่อน */}
              <Route path="/customer/line-login" element={<Line />} />
              <Route path="/customer/line" element={<LineAuth />} />
              <Route path="/customer/login" element={<Register />} />

              {/* เส้นทางที่ต้อง Login ก่อนเข้าใช้งาน */}
              <Route path="/customer/home" element={<ProtectedRouteLine element={<Home />} />} />
              <Route path="/customer/history" element={<ProtectedRouteLine element={<HistoryPage />} />} />
              <Route path="/customer/pets" element={<ProtectedRouteLine element={<PetsPage />} />} />
              <Route path="/customer/serviceappointment" element={<ProtectedRouteLine element={<ServiceAppointment />} />} />
              <Route path="/customer/appointment" element={<ProtectedRouteLine element={<AppointmentDetail />} />} />
              <Route path="/customer/petsdetail" element={<ProtectedRouteLine element={<PetsDetail />} />} />
              
               {/* แยกเส้นทาง 404 ตามประเภทของ user */}
            <Route path="*" element={<NotFoundRedirect />} />

          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;



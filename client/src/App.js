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

const theme = createTheme();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const location = useLocation();

  useEffect(() => {
    // Check if the user is authenticated when the app loads
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated'); // Clear login status
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {location.pathname !== '/login' && isAuthenticated && <Navbar onLogout={handleLogout} />}
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
              element={isAuthenticated ? <RegisterPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clinic/pet-profile"
               element={<PetProfilePage />} />

            <Route 
              path="/clinic/admin" 
              element={isAuthenticated ? <SecurityAdminPage/> : <Navigate to="/login" />} 
            />

             {/* สำหรับลูกค้า */}
            <Route path="/customer/login" element={<Register />} />
              <Route element={<PrivateRoute />}>
                <Route path="/customer/home" element={<Home />} />
                <Route path="/customer/history" element={<HistoryPage />} />
                <Route path="/customer/pets" element={<PetsPage />} />
                <Route path="/customer/serviceappointment" element={<ServiceAppointment />} />
                <Route path="/customer/appointment" element={<AppointmentDetail />} />
                <Route path="/customer/petsdetail" element={<PetsDetail />} />
                <Route path="/customer/line" element={<LineAuth />} />
                <Route path="/customer/line-login" element={<Line />} />
              </Route>
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

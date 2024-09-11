import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'; 
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './Front-end/Navbar';
import HomePage from './Front-end/HomePage';
import RegisterPage from './Front-end/RegisterPage';
import AppointmentPage from './Front-end/AppointmentPage';
import FinancePage from './Front-end/FinancePage';
import CategoryPage from './Front-end/CategoryPage';
import LoginPage from './Front-end/LoginPage';


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
              path="/home" 
              element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <RegisterPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/appointment" 
              element={isAuthenticated ? <AppointmentPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/category" 
              element={isAuthenticated ? <CategoryPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/finance" 
              element={isAuthenticated ? <FinancePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <RegisterPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

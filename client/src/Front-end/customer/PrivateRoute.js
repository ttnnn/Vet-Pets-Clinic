// PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const user = sessionStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/customer/login" />;  // หากไม่มีข้อมูลผู้ใช้ใน sessionStorage ให้นำทางไปยังหน้า login
  }
  
  return <Outlet />;  // หากผู้ใช้ล็อกอินแล้ว ให้แสดงเนื้อหาของหน้า
};

export default PrivateRoute;

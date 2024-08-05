import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <Link to="/home" className="sidebar-item">หน้าหลัก</Link>
        </li>
        <li>
          <Link to="/register" className="sidebar-item">เวชระเบียน</Link>
        </li>
        <li>
          <Link to="/appointment" className="sidebar-item">การนัดหมาย</Link>
        </li>
        <li>
          <Link to="/category" className="sidebar-item">หมวดหมู่บริการ</Link>
        </li>
        <li>
          <Link to="/finance" className="sidebar-item">การเงิน</Link>
        </li>
        <li>
          <Link to="/dashboard" className="sidebar-item">Dashboard</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;

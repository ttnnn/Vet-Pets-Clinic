import React, { useState } from 'react';
import './Navbar.css';
import logo from '../Logo.jpg';
import menuicon from '../menu.png';

function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const userEmail = "user@example.com"; // อีเมลผู้ใช้ที่เข้าสู่ระบบ
  
    const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };
  
    const handleLogout = () => {
      // เพิ่มโค้ดสำหรับการออกจากระบบที่นี่
      console.log('Logged out');
    };
  
    return (
      <div className="navbar">
        <img src={logo} alt="Logo" className="logo" />
        <div className="title">คลินิกรักษาสัตว์สองคุณหมอ</div>
        <div className="profile">
          <img
            src={menuicon}
            alt="Profile"
            className="menuicon"
            onClick={toggleDropdown}
          />
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item">{userEmail}</div>
            
              <button className="dropdown-item logout-button" onClick={handleLogout}>
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }


export default Navbar;

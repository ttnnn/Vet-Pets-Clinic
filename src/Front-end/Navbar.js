import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import menuicon from '../menu.png';

function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const userEmail = "user@example.com";
    const navigate = useNavigate();

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = () => {
        // เพิ่มโค้ดสำหรับการออกจากระบบที่นี่
        console.log('Logged out');

        // ตัวอย่าง: ลบโทเค็นและเปลี่ยนเส้นทางไปที่หน้า Login
        localStorage.removeItem('authToken');
        navigate('/');

        setIsDropdownOpen(false);
    };

    return (
        <div className="navbar">
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

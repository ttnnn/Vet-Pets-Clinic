import React from 'react';
import './RegisterPage.css';
import Sidebar from './Sidebar';

const RegisterPage = () => {
  return (
    <div className="main-container">
      <Sidebar />
      <div className="register-container">
        <div className="button-group">
          <button className="tab-button active">ลงทะเบียนสัตว์เลี้ยงใหม่</button>
          <button className="tab-button">ค้นหาข้อมูลลูกค้า</button>
        </div>
        <h1>ลงทะเบียนสัตว์เลี้ยงใหม่</h1>
        <form className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อลูกค้า:</label>
              <input type="text" name="customerName" />
            </div>
            <div className="form-group">
              <label>นามสกุล:</label>
              <input type="text" name="customerSurname" />
            </div>
            <div className="form-group">
              <label>เบอร์โทรศัพท์:</label>
              <input type="text" name="phoneNumber" />
            </div>
          </div>
          <button type="submit" className="submit-button">ลงทะเบียนสัตว์เลี้ยงใหม่</button>
          <p>สัตว์เลี้ยงของคุณ</p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;

import React, { useState } from 'react';


const AppointmentList = ({ appointments }) => {
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const categories = ['ทั้งหมด', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];

  const filteredAppointments = appointments.filter(appointment => {
    if (activeCategory === 'ทั้งหมด') {
      return true;
    }
    return appointment.category === activeCategory;
  });

  return (
    <div className="appointment-container">
      <div className="appointment-categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-button ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="appointment-list">
        {filteredAppointments.map((appointment, index) => (
          <div key={index} className="appointment-item">
            <p>{appointment.name}</p>
            <p>เวลานัดหมาย : {appointment.time}</p>
            <div>
              <button className="cancel-button">ยกเลิก</button>
              <button className="call-button">ส่งคิว</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentList;

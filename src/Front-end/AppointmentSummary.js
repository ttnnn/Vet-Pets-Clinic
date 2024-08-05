import React from 'react';

const AppointmentSummary = ({ totalAppointments, ongoingAppointments, pendingPayment, tomorrowAppointments }) => {
  return (
    <div className="appointment-summary">
      <div className="summary-item all">
        <h2>คิวทั้งหมด</h2>
        <p>{totalAppointments}</p>
      </div>
      <div className="summary-item ongoing">
        <h2>กำลังให้บริการ</h2>
        <p>{ongoingAppointments}</p>
      </div>
      <div className="summary-item pending">
        <h2>กำลังชำระเงิน</h2>
        <p>{pendingPayment}</p>
      </div>
      <div className="summary-item tomorrow">
        <h2>คิวพรุ่งนี้</h2>
        <p>{tomorrowAppointments}</p>
      </div>
    </div>
  );
};

export default AppointmentSummary;

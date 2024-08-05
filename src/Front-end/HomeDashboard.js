import React from 'react';
import Sidebar from './Sidebar';
import AppointmentSummary from './AppointmentSummary';
import AppointmentList from './AppointmentList';

const appointments = [
  { name: 'คอลลิน', service: 'อาบน้ำ-ตัดขน', time: '09:30 นาฬิกา' },
  { name: 'ลูฟี่', service: 'ตรวจรักษา', time: '09:30 นาฬิกา' },
  { name: 'ข้าวเหนียว', service: 'ฝากเลี้ยง', time: '09:30 นาฬิกา' },
  { name: 'เต้าหู้', service: 'วัคซีน', time: '09:30 นาฬิกา' }
];

const HomeDashboard = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <h1>ตารางนัดหมายวันที่ 30 มิถุนายน 2567</h1>
        <AppointmentSummary
          totalAppointments={5}
          ongoingAppointments={3}
          pendingPayment={1}
          tomorrowAppointments={36}
        />
        <AppointmentList appointments={appointments} />
      </div>
    </div>
  );
};

export default HomeDashboard;

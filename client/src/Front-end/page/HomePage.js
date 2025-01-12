import React, { useState , useEffect} from 'react';
import {  Typography, Box, Paper} from '@mui/material';
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory
import axios from 'axios';
import dayjs from 'dayjs';
import AppointmentList from '../component/AppointmentList';
import OngoingAppointments from '../component/OngoingAppointment';
import PendingAppointments from '../component/PendingAppointments';
import CircularProgress from '@mui/material/CircularProgress';
import AdmitTable from '../component/AdmitTable';
import {useLocation } from 'react-router-dom';
// Categories for filtering

const api = 'http://localhost:8080/api/clinic';

const formatDate = (date) => {
  const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear() + 543; // Adding 543 for Thai Buddhist year

  return `ตารางนัดหมายวันนี้ ${day} ${month} ${year}`;
};


const AppointmentSummary = ({ 
  totalAppointments, 
  ongoingAppointments, 
  pendingPayment, 
  tomorrowAppointments, 
  onClickSummary ,
  totalAppointmentsDay
}) => {
  const [activeTab, setActiveTab] = useState('total'); // เพิ่ม state สำหรับติดตาม Tab ที่กำลังกด

  const handleTabClick = (tabName) => {
    setActiveTab(tabName); // อัปเดต Tab ที่กำลังกด
    onClickSummary(tabName); // เรียกฟังก์ชันเดิม
  };

  return (
    <Box>
       <Typography variant="h6" sx={{ mb: 2, textAlign: 'left' }}>จำนวนการเข้าใช้บริการวันนี้ {totalAppointmentsDay} คิว</Typography>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', cursor: 'pointer' }} 
          onClick={() => handleTabClick('total')}
        >
          <Typography variant="h6">รอรับบริการ</Typography>
          <Typography variant="h4">{totalAppointments}</Typography>
        </Paper>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#f0f4c3', cursor: 'pointer' }} 
          onClick={() => handleTabClick('ongoing')}
        >
          <Typography variant="h6">กำลังให้บริการ</Typography>
          <Typography variant="h4">{ongoingAppointments}</Typography>
        </Paper>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#f8d7da', cursor: 'pointer' }} 
          onClick={() => handleTabClick('pending-payment')}
        >
          <Typography variant="h6">รอชำระเงิน</Typography>
          <Typography variant="h4">{pendingPayment}</Typography>
        </Paper>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#c3eaf0', cursor: 'pointer' }} 
        >
          <Typography variant="h6">คิวพรุ่งนี้</Typography>
          <Typography variant="h4">{tomorrowAppointments}</Typography>
        </Paper>
      </Box>
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'left' }}>
        {activeTab === 'total' && 'รอรับบริการ'}
        {activeTab === 'ongoing' && 'กำลังให้บริการ'}
        {activeTab === 'pending-payment' && 'รอชำระเงิน'}
      </Typography>
    </Box>
  );
};



// HomeDashboard component

const HomeDashboard = () => {
  const location = useLocation(); 
  const [appointments, setAppointments] = useState([]);
  // const [view, setView] = useState('total');
  const [view, setView] = useState(location.state?.locationActiveTab === 1 ? 'ongoing' : 'total');
  const [loading, setLoading] = useState(false); // Loading state
 

  const fetchAppointments = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get(`${api}/appointment`);
      setAppointments(response.data);
      // console.log('Fetched appointments:', response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
    finally {
      setLoading(false); // Stop loading
    }
  };

  const updateAppointmentStatus = async (appointment_id, statusUpdates) => {
    try {
      await axios.put(`${api}/appointment/${appointment_id}`, statusUpdates);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  //คิวที่มีวันที่ตรงกับวันนี้ + คิวฝากเลี้ยงที่กำลังรับบริการ 
  const totalAppointmentsDay = appointments.filter((a) => {
    return (
      (dayjs(a.appointment_date).isSame(today, 'day') && a.status === 'อนุมัติ') ||
      (a.type_service === 'ฝากเลี้ยง' && a.queue_status === 'กำลังให้บริการ')
    );
  }).length;

  //จำนวนคิวที่รอรับบริการ
  const totalAppointments = appointments.filter(
    (a) => a.queue_status === 'รอรับบริการ' && dayjs(a.appointment_date).isSame(today, 'day') && a.status === 'อนุมัติ'
  ).length;

  //จำนวนคิวที่กำลังให้บริการ
  const ongoingAppointments = appointments.filter((a) => {
    const isToday = dayjs(a.appointment_date).isSame(today, 'day');
    const isApproved = a.status === 'อนุมัติ';
  
    if (a.type_service === 'ตรวจรักษา') {
      // ถ้าเป็นตรวจรักษาและสถานะ admit ให้ไม่สนใจวัน
      if (a.queue_status === 'admit' && isApproved) {
        return true;
      }
      // ถ้าเป็นตรวจรักษาและสถานะกำลังให้บริการ ให้นับเฉพาะวันนี้
      return a.queue_status === 'กำลังให้บริการ' && isToday && isApproved;
    }
  
    if (a.type_service === 'ฝากเลี้ยง') {
      // นับเฉพาะกำลังให้บริการสำหรับฝากเลี้ยง
      return a.queue_status === 'กำลังให้บริการ' && isApproved;
    }
  
    // นับทั้งกำลังให้บริการและ admit สำหรับบริการอื่น ๆ
    return (
      (a.queue_status === 'กำลังให้บริการ' || a.queue_status === 'admit') &&
      isToday &&
      isApproved
    );
  }).length;
  
  
  
//ถ้ายังไม่ชำระเงินจะยังขึ้นแสดงไว้
  const pendingPayment = appointments.filter(
    (a) => a.queue_status === 'รอชำระเงิน' &&
        a.status === 'อนุมัติ'
    ).length;


  const tomorrowAppointments = appointments.filter((a) =>
    dayjs(a.appointment_date).isSame(tomorrow, 'day') && a.status === 'อนุมัติ'
  ).length;

  const handleNavigation = (summaryType) => {
    setView(summaryType);
  };

  const filteredAppointments = (status) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    return appointments.filter((a) => {
        const appointmentDate = new Date(a.appointment_date); // Assuming `a.date` is the appointment date
         if (status === "รอชำระเงิน") {
           return a.queue_status === status;
       }

        if (a.type_service === "ฝากเลี้ยง") {
            // Show all "ฝากเลี้ยง" that are waiting for payment
            return a.queue_status === status ;
        } else {
            // Show other appointment types only if they are today
            return (
                a.queue_status === status &&
                appointmentDate >= todayStart &&
                appointmentDate < todayEnd
            );
        }
    });
};

  
  const currentDate = new Date();
  const formattedDate = formatDate(currentDate);

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" align="left" gutterBottom>
          {formattedDate}
        </Typography>
        <AppointmentSummary
          totalAppointments={totalAppointments}
          ongoingAppointments={ongoingAppointments}
          pendingPayment={pendingPayment}
          tomorrowAppointments={tomorrowAppointments}
          onClickSummary={handleNavigation}
          totalAppointmentsDay= {totalAppointmentsDay}
        />
         {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress/>
          </Box>
        ) : (
          <>
        {view === 'total' && (
          <AppointmentList
            appointments={filteredAppointments('รอรับบริการ')}
            onMoveToOngoing={(appointment_id) => updateAppointmentStatus(appointment_id, { status: 'อนุมัติ' , queue_status: 'กำลังให้บริการ', })}
            onCancelAppointment={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { status: 'ยกเลิกนัด', queue_status: 'ยกเลิกนัด' })
            }
          />
        )}
        {view === 'ongoing' && (
          <>
          <OngoingAppointments
            appointments={filteredAppointments('กำลังให้บริการ')}
            onMoveToPending={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { status: 'อนุมัติ' ,queue_status: 'รอชำระเงิน' })
            }
            onRevertToPending={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { status: 'อนุมัติ' , queue_status: 'รอรับบริการ' })
            }
          />
          <AdmitTable
            appointments={filteredAppointments('admit')}
            onMoveToPending={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { status: 'อนุมัติ' ,queue_status: 'รอชำระเงิน' })
            }
          />
          </>
        )}
        {view === 'pending-payment' && (
          <PendingAppointments
            appointments={filteredAppointments('รอชำระเงิน')} 
            update = {fetchAppointments}
          />
        )}
        </>
)}
      </Box>
    </Box>
  );
};

export default HomeDashboard;

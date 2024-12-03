import React, { useState , useEffect} from 'react';
import {  Typography, Box, Paper, Tab} from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory
import axios from 'axios';
import dayjs from 'dayjs';
import AppointmentList from './component/AppointmentList';
import OngoingAppointments from './component/OngoingAppointment';
import PendingAppointments from './component/PendingAppointments';
// Categories for filtering

const api = 'http://localhost:8080';

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover': {
    color: '#40a9ff',
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'black',
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));
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
       <Typography variant="h6" sx={{ mb: 2, textAlign: 'left' }}>จำนวนการเข้าใช้บริการ {totalAppointmentsDay} คิว</Typography>
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
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('total');
 

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${api}/appointment`);
      setAppointments(response.data);
      console.log('Fetched appointments:', response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
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
  
  const totalAppointments = appointments.filter(
    (a) => a.queue_status === 'รอรับบริการ' && dayjs(a.appointment_date).isSame(today, 'day') && a.status === 'อนุมัติ'
  ).length;

  const ongoingAppointments = appointments.filter((a) => {
    if (a.type_service !== 'ฝากเลี้ยง') {
      return (
        a.queue_status === 'กำลังให้บริการ' &&
        dayjs(a.appointment_date).isSame(today, 'day') &&
        a.status === 'อนุมัติ'
      );
    } else {
      return a.queue_status === 'กำลังให้บริการ' &&  a.status === 'อนุมัติ';
    }
  }).length;
  
//ถ้ายังไม่ชำระเงินจะยังขึ้นแสดงไว้
  const pendingPayment = appointments.filter((a) => {
    return (
      (a.type_service !== 'ฝากเลี้ยง' &&
        a.queue_status === 'รอชำระเงิน' &&
        dayjs(a.appointment_date).isSame(today, 'day') &&
        a.status === 'อนุมัติ') ||
      (a.type_service === 'ฝากเลี้ยง' &&
        a.queue_status === 'รอชำระเงิน' &&
        a.status === 'อนุมัติ')
    );
  }).length;


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
        {view === 'total' && (
          <AppointmentList
            appointments={filteredAppointments('รอรับบริการ')}
            onMoveToOngoing={(appointment_id) => updateAppointmentStatus(appointment_id, { queue_status: 'กำลังให้บริการ', })}
            onCancelAppointment={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { status: 'ยกเลิกนัด', queue_status: 'ยกเลิกนัด' })
            }
          />
        )}
        {view === 'ongoing' && (
          <OngoingAppointments
            appointments={filteredAppointments('กำลังให้บริการ')}
            onMoveToPending={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { queue_status: 'รอชำระเงิน' })
            }
            onRevertToPending={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { queue_status: 'รอรับบริการ' })
            }
          />
        )}
        {view === 'pending-payment' && (
          <PendingAppointments
            appointments={filteredAppointments('รอชำระเงิน')}
          />
        )}
      </Box>
    </Box>
  );
};

export default HomeDashboard;

import React, { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import axios from 'axios';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


const api = 'http://localhost:8080';

const HolidayFilter = ({ children }) => {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await axios.get(`${api}/dayoff`);
        console.log('Fetched holidays:', response.data);
        setHolidays(response.data);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };
  
    fetchHolidays();
  }, []);
  

  const isHoliday = (date) => {
    const dayOfWeek = dayjs(date).format('dddd'); // ดึงชื่อวันในสัปดาห์
    return holidays.some((holiday) => {
      if (holiday.dayoff_type === 'weekly') {
        // แปลง recurring_days จาก JSON string เป็น array
        const recurringDays = JSON.parse(holiday.recurring_days || '[]');
        return recurringDays.includes(dayOfWeek); // ตรวจสอบว่าตรงกับวันใน recurring_days
      }
      if (holiday.dayoff_type === 'temporary') {
        // ตรวจสอบวันที่อยู่ในช่วงวันหยุด
        return dayjs(date).isBetween(
          dayjs(holiday.date_start),
          dayjs(holiday.date_end),
          'day',
          '[]' // รวมวันเริ่มต้นและวันสิ้นสุด
        );
      }
      return false;
    });
  };
  
  const filterDate = (date) => {
    // กรองวันหยุด โดยเลือกวันที่ไม่ใช่วันหยุด
    return isHoliday(date);
  };
  

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { shouldDisableDate: filterDate })
      )}
    </LocalizationProvider>
  );
};

export default HolidayFilter;

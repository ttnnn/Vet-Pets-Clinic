import React, { useEffect, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {format } from 'date-fns';
import { clinicAPI } from "../../utils/api";


const HolidayFilter = ({ children }) => {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await clinicAPI.get(`/dayoff`);
        setHolidays(response.data);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };

    fetchHolidays();
  }, []);

  const isHoliday = (date) => {
    const dayOfWeek = format(date, 'EEEE'); // วันในสัปดาห์ เช่น Monday
    return holidays.some((holiday) => {
      if (holiday.dayoff_type === 'weekly') {
        const recurringDays = Array.isArray(holiday.recurring_days)
          ? holiday.recurring_days
          : JSON.parse(holiday.recurring_days || '[]');
        return recurringDays.includes(dayOfWeek);
      }
      if (holiday.dayoff_type === 'temporary') {
        const startDate = new Date(holiday.date_start).setHours(0, 0, 0, 0);
        const endDate = new Date(holiday.date_end).setHours(23, 59, 59, 999);
        const checkDate = date.setHours(0, 0, 0, 0);
      
        return checkDate >= startDate && checkDate <= endDate;
      }
      
      return false;
    });
  };

  const filterDate = (date) => {
    return isHoliday(date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { shouldDisableDate: filterDate })
      )}
    </LocalizationProvider>
  );
};

export default HolidayFilter;

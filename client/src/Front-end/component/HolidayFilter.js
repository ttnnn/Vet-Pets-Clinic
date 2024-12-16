import React, { useEffect, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isWithinInterval, parseISO, format } from 'date-fns';
import axios from 'axios';

const api = 'http://localhost:8080/api/clinic';

const HolidayFilter = ({ children }) => {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await axios.get(`${api}/dayoff`);
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
        return isWithinInterval(date, {
          start: parseISO(holiday.date_start),
          end: parseISO(holiday.date_end),
        });
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

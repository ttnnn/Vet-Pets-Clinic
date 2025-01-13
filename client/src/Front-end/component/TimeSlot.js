import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@mui/material';
import axios from 'axios';

const api = 'http://localhost:8080/api/clinic';

const generateTimeSlots = (startHour, endHour, stepMinutes, isToday, typeService) => {
  const slots = [];
  const start = new Date();
  start.setHours(startHour, 0, 0, 0);

  const end = new Date();
  console.log('typeService',typeService)
  if (typeService === 'อาบน้ำ-ตัดขน') {
    end.setHours(18, 0, 0, 0); // จำกัดให้สิ้นสุดที่ 18:00 สำหรับ "อาบน้ำ-ตัดขน"
  } else {
    end.setHours(endHour, 0, 0, 0); // สิ้นสุดที่ 20:30 สำหรับบริการอื่นๆ
  }

  const formatTime = (date) =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  let current = start;
  
  if (typeService !== 'ฝากเลี้ยง') {
    while (current < end) {
      const next = new Date(current.getTime() + stepMinutes * 60000);
      slots.push(`${formatTime(current)} - ${formatTime(next)}`);
      current = next;
    }
  }
  
  

  return slots;
};

const TimeSlotPicker = ({ TypeService, selectedDate, onTimeSelect }) => {
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  const getStepMinutes = useCallback(() => {
    switch (TypeService) {
      case 'อาบน้ำ-ตัดขน':
        return 90; // 1 ชั่วโมง 30 นาที
      case 'ฝากเลี้ยง':
        return 0; // ไม่ต้องการช่วงเวลา
      default:
        return 30; // เริ่มต้นที่ 30 นาที
    }
  }, [TypeService]);

  const formatDate = (date) => {
    const validDate = new Date(date);
    if (isNaN(validDate.getTime())) {
      console.error('Invalid date:', date);
      return ''; // คืนค่าเป็นสตริงว่างในกรณีที่ date ไม่ถูกต้อง
    }

    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const day = String(validDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (selectedDate && TypeService) {
        const formattedDate = formatDate(selectedDate);
        console.log('selectedDate', selectedDate);
        console.log('formattedDate', formattedDate);

        try {
          const response = await axios.get(`${api}/appointments/booked-times?date=${formattedDate}&type_service=${TypeService}`);
          console.log('API Response:', response.data);

          const cleanedBookedSlots = Array.isArray(response.data)
            ? response.data.map(slot => (typeof slot === 'string' ? slot.replace('+07', '') : slot))
            : [];
          setBookedSlots(cleanedBookedSlots);
        } catch (error) {
          console.error('Error fetching booked time slots:', error);
        }
      }
    };

    fetchBookedSlots();

    const stepMinutes = getStepMinutes();
    const isToday = selectedDate && formatDate(selectedDate) === formatDate(new Date());
    
    let slots = generateTimeSlots(9, 20, stepMinutes, isToday, TypeService); // ใช้ slot ที่ได้จากฟังก์ชัน generateTimeSlots

    // กรองช่วงเวลาที่เหลือจากเวลาปัจจุบัน
    if (isToday) {
      const now = new Date();
      const nowTime = now.getHours() * 60 + now.getMinutes(); // เวลาเป็นนาที
      slots = slots.filter(slot => {
        const startTime = slot.split(' - ')[0];
        const [hours, minutes] = startTime.split(':').map(Number);
        const slotTime = hours * 60 + minutes;
        return slotTime > nowTime;
      });
    }

    setTimeSlots(slots);
    setSelectedTime(null);
    onTimeSelect(null);
  }, [TypeService, selectedDate, getStepMinutes, onTimeSelect]);

  const handleTimeSelect = (time) => {
    if (time === selectedTime) {
      setSelectedTime(null);
      onTimeSelect(null);
    } else {
      setSelectedTime(time);
      onTimeSelect(time);
    }
  };

  const isBooked = (time) => {
    const startTime = time.split(' - ')[0];
    const formattedStartTime = startTime + ':00';
    return bookedSlots.includes(formattedStartTime);
  };

  return (
    <div>
      {timeSlots.length > 0 ? (
        timeSlots.map((time, index) => (
          <Button
            key={index}
            onClick={() => handleTimeSelect(time)}
            style={{
              margin: '5px',
              backgroundColor: selectedTime === time ? '#87CEFA' : (isBooked(time) ? 'lightgray' : 'white'),
              border: '1px solid',
              borderColor: selectedTime === time ? '#87CEFA' : (isBooked(time) ? 'darkgray' : 'black'),
              borderRadius: '5px',
              cursor: isBooked(time) ? 'not-allowed' : 'pointer',
              color: isBooked(time) ? 'darkgray' : 'black',
              fontWeight: isBooked(time) ? 'normal' : 'bold',
            }}
            disabled={isBooked(time)}
          >
            {time} 
          </Button>
        ))
      ) : (
        <p style={{ textAlign: 'center', color: 'red' }}>ไม่มีช่วงเวลาที่สามารถจองได้</p>
      )}
    </div>
  );
};

export default TimeSlotPicker;

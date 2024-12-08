import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@mui/material';
import axios from 'axios';

const api = 'http://localhost:8080/api/clinic';

const generateTimeSlots = (startHour, endHour, stepMinutes, isToday) => {
  const slots = [];
  const now = new Date();
  const start = new Date();

  // ถ้าวันที่เลือกเป็นวันปัจจุบัน และเวลาปัจจุบันมากกว่า startHour ให้เริ่มสร้าง slot จากเวลาปัจจุบัน
  if (isToday && (now.getHours() > startHour || (now.getHours() === startHour && now.getMinutes() > 0))) {
    start.setHours(now.getHours(), Math.ceil(now.getMinutes() / stepMinutes) * stepMinutes, 0, 0);
  } else {
    start.setHours(startHour, 0, 0, 0);
  }

  const end = new Date();
  end.setHours(endHour, 30, 0, 0); // สิ้นสุดที่ 20:30

  
  const formatTime = (date) =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  let current = start;

  while (current < end) {
    const next = new Date(current.getTime() + stepMinutes * 60000);
    slots.push(`${formatTime(current)} - ${formatTime(next)}`);
    current = next;
  }

  return slots;
};

const TimeSlotPicker = ({ TypeService, selectedDate, onTimeSelect }) => {
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  // console.log('TypeService' ,TypeService)
  // console.log('selectedDate' ,selectedDate)
  // console.log('bookedSlots' ,bookedSlots)
  // console.log('timeSlots',timeSlots)
  // console.log('selectedTime',selectedTime)
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
    // ตรวจสอบให้แน่ใจว่า date เป็นอ็อบเจกต์ Date
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
        console.log('selectedDate',selectedDate)
        console.log('formattedDate',formattedDate)

        try {
          const response = await axios.get(`${api}/appointments/booked-times?date=${formattedDate}&type_service=${TypeService}`);
          console.log('API Response:', response.data);

          // const cleanedBookedSlots = response.data.map(slot => slot.replace('+07', ''));
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
    const slots = stepMinutes === 0 ? [] : generateTimeSlots(9, 20, stepMinutes, isToday);
    setTimeSlots(slots);
    setSelectedTime(null);
    onTimeSelect(null);
  }, [TypeService, selectedDate, getStepMinutes, onTimeSelect]);

  const handleTimeSelect = (time) => {
    if (time === selectedTime) {  //ถ้าคลิกช่วงเวลาเดิม selectedTime จะถูกตั้งค่าเป็น null เพื่อยกเลิกการเลือก
      setSelectedTime(null);
      onTimeSelect(null);
    } else {
      setSelectedTime(time); //เซตเวลาที่เลือก
      onTimeSelect(time);
    }
  };
  //ตรวจสอบว่าช่วงเวลานั้น ๆ ถูกจองหรือไม่  includes จะเป็นการเช็คว่า array นั้นมีค่าที่เราต้องการมั้ย
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
            onClick={() => handleTimeSelect(time)} //เซตเวลาที่กดเลือก
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
            disabled={isBooked(time)} //ช่วงเวลาที่ถูกจองแล้ว ปิดการใช้งานปุ่ม
          >
            {time} 
          </Button> //ช่วงเวลา TimeSlot ที่สร้างขึ้น
        ))
      ) : (
        ''
      )}
    </div>
  );
};

export default TimeSlotPicker;

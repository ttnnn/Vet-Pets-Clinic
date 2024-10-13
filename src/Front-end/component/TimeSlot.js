import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@mui/material';
import axios from 'axios'; // Make sure to import axios

const api = 'http://localhost:8080';

const generateTimeSlots = (startHour, endHour, stepMinutes) => {
  const slots = [];
  const start = new Date();
  start.setHours(startHour, 0, 0, 0);
  const end = new Date();
  end.setHours(endHour, 0, 0, 0);

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

  const getStepMinutes = useCallback(() => {
    switch (TypeService) {
      case 'อาบน้ำ-ตัดขน':
        return 90; // 1 hour 30 minutes
      case 'ฝากเลี้ยง':
        return 0; // No slots available
      default:
        return 30; // Default is 30 minutes
    }
  }, [TypeService]);
  
  const fetchBookedSlots = async (selectedDate) => {  //เช็คว่าวันเวลาที่เลือกว่างมั้ย
    console.log('date:', selectedDate);
    if (selectedDate && TypeService) {
      // Format the date to YYYY-MM-DD
      const formattedDate = formatDate(selectedDate);
      
      try {
        const response = await axios.get(`${api}/appointments/booked-times?date=${formattedDate}&type_service=${TypeService}`);
        setBookedSlots(response.data);
        console.log('setBookedSlots:', response.data);
      } catch (error) {
        console.error('Error fetching booked time slots:', error);
      }
      console.log('formattedDate:', formattedDate);
    }
  };
  
  // Helper function to format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  

  useEffect(() => {
    fetchBookedSlots(selectedDate);
    const stepMinutes = getStepMinutes();
    const slots = stepMinutes === 0 ? [] : generateTimeSlots(9, 20, stepMinutes);
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
    const startTime = time.split(' - ')[0]; // Get the start time from the time slot
    const formattedStartTime = startTime + ':00'; // Add seconds to match the HH:mm:ss format
    return bookedSlots.includes(formattedStartTime); // Check if the formatted start time is in the booked slots list
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
              borderColor: selectedTime === time ? '#87CEFA' : (isBooked(time) ? 'darkgray' : 'black'), // Change border color based on state
              borderRadius: '5px',
              cursor: isBooked(time) ? 'not-allowed' : 'pointer',
              color: isBooked(time) ? 'darkgray' : 'black',
              fontWeight: isBooked(time) ? 'normal' : 'bold',
            }}
            disabled={isBooked(time)} // Disable if the slot is already booked
          >
            {time}
          </Button>
        ))
      ) : ( ''
      )}
    </div>
  );
};

export default TimeSlotPicker;

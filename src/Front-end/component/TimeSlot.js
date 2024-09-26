import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@mui/material';
import axios from 'axios';

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
        return 0; // No slots
      default:
        return 30; // Default is 30 minutes
    }
  }, [TypeService]);

  useEffect(() => {
    if (selectedDate && TypeService) {
      const stepMinutes = getStepMinutes();
      const slots = stepMinutes === 0 ? [] : generateTimeSlots(9, 20, stepMinutes);
      setTimeSlots(slots);
      setSelectedTime(null);
      onTimeSelect(null);

      // Fetch booked slots from API
      // const formattedDate = selectedDate.toISOString().split('T')[0];
      //  axios.get(`${api}/appointments/booked-slots`, {
          // params: { TypeService, date: formattedDate }
        // })
        // .then((response) => {
          // setBookedSlots(response.data); // Handle booked slots from API response
        // })
        // .catch((error) => {
          // console.error('Error fetching booked slots:', error.response ? error.response.data : error.message);
        // });
    }
  }, [TypeService, selectedDate, getStepMinutes, onTimeSelect]);

  const handleTimeSelect = (time) => {
    const selectedStartTime = time.split(' - ')[0]; // Extract start time from time slot

    if (bookedSlots.includes(selectedStartTime)) {
      alert('This time slot is already booked. Please select another one.');
      return;
    }

    if (time === selectedTime) {
      setSelectedTime(null);
      onTimeSelect(null);
    } else {
      setSelectedTime(time);
      onTimeSelect(time);
    }
  };

  return (
    <div>
      {timeSlots.length > 0 ? (
        timeSlots.map((time, index) => {
          const isBooked = bookedSlots.includes(time.split(' - ')[0]);

          return (
            <Button
              key={index}
              onClick={() => handleTimeSelect(time)}
              style={{
                margin: '5px',
                backgroundColor: selectedTime === time ? 'lightgreen' : 'white',
                border: '1px solid teal',
                borderRadius: '5px',
                cursor: 'pointer',
                opacity: isBooked ? 0.5 : 1 // Visual feedback for booked slots
              }}
              disabled={isBooked}
            >
              {time} {isBooked && '(Booked)'}
            </Button>
          );
        })
      ) : (
        ''
      )}
    </div>
  );
};

export default TimeSlotPicker;

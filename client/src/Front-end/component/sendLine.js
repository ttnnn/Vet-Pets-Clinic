import axios from 'axios';
import { clinicAPI } from "../../utils/api";

const sendLineMessage = async (lineUserId, message, appointmentId) => {
  try {
    const response = await clinicAPI.post(`/send-line-message`, {
      lineUserId,
      message,
      appointmentId,
    });
    console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
};

export default sendLineMessage;

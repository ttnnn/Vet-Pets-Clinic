import axios from 'axios';

const api = 'http://localhost:8080/api/clinic';
const sendLineMessage = async (lineUserId, message, appointmentId) => {
  try {
    const response = await axios.post(`${api}/send-line-message`, {
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

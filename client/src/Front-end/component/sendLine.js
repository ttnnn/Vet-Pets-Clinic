import { clinicAPI } from "../../utils/api";

const sendLineMessage = async (lineUserId, message, appointmentId) => {
  try {
     await clinicAPI.post(`/send-line-message`, {
      lineUserId,
      message,
      appointmentId,
    })
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
};

export default sendLineMessage;

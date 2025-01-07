const axios = require('axios');
const LINE_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;


const sendLineMessage = async (lineUserId, message) => {
  try {
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: lineUserId,
        messages: [{ type: 'text', text: message }],
      },
      {
        headers: {
          'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending LINE message:', error);
    throw error;
  }
};

module.exports = sendLineMessage;

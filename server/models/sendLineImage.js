const axios = require('axios');

const LINE_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN; // Access Token ของ LINE

const sendLineMessageWithImage = async (lineId, imageUrl) => {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
  };

  const body = {
    to: lineId,
    messages: [
      {
        type: 'image',
        originalContentUrl: imageUrl, // URL ของรูปภาพจาก Cloudinary
        previewImageUrl: imageUrl,   // URL ของรูปตัวอย่าง
      },
    ],
  };

  await axios.post(url, body, { headers });
};

module.exports = { sendLineMessageWithImage };

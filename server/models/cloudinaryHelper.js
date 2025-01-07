const crypto = require('crypto');
require('dotenv').config();

function generateCloudinarySignature(payload) {
  const { timestamp, public_id } = payload;

  const paramsToSign = {
    timestamp,
    public_id,
  };

  const stringToSign = Object.keys(paramsToSign)
    .map(key => `${key}=${paramsToSign[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha256')
    .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  return signature;
}

module.exports = { generateCloudinarySignature };

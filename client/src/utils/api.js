import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || 'https://two-vet-pets-clinic.onrender.com';


// API สำหรับลูกค้า
export const customerAPI = axios.create({
  baseURL: `${BASE_URL}/customer`,
  headers: { "Content-Type": "application/json" },
});

// API สำหรับคลินิก
export const clinicAPI = axios.create({
  baseURL: `${BASE_URL}/clinic`,
  headers: { "Content-Type": "application/json" },
});

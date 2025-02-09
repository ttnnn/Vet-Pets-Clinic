import React, { useRef, useState, useEffect ,useCallback } from 'react';
import html2canvas from 'html2canvas';
import { CircularProgress, Backdrop ,Snackbar, Alert} from '@mui/material';
import dayjs from 'dayjs';
import axios from 'axios';
import 'dayjs/locale/th';
import { clinicAPI } from "../../utils/api";

const ReceiptComponent = ({ receiptData , isPending }) => {
  const [DataReceipt, setDataReceipt] = useState([]);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchDataReceipt = useCallback(async () => {
    try {
      const response = await clinicAPI.get(`/product/receipt/${receiptData.invoice_id}`);
      // console.log('API Response:', response.data); // ตรวจสอบข้อมูลที่ได้จาก API
      setDataReceipt(response.data); // เก็บข้อมูลใน state
    } catch (error) {
      console.error('Error fetching DataReceipt:', error);
    } finally {
      setLoading(false);
    }
  }, [receiptData.invoice_id]); // Add dependencies for dynamic values
  useEffect(() => {
    fetchDataReceipt();
  }, [fetchDataReceipt]); // Add fetchDataReceipt to the dependency array
  

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleDownloadReceipt = async () => {
    if (receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt_${Date.now()}.jpeg`;
      link.click();
    }
  };

  const handleUploadWithSignature = async () => {
    
    if (!DataReceipt[0]?.line_id) {
      showSnackbar('กรุณาลงทะเบียนในไลน์ก่อนส่งใบเสร็จ', 'error');
      return;
    }
  
    if (receiptRef.current) {
      // const canvas = await html2canvas(receiptRef.current, { scale: 1 });
      const canvas = await html2canvas(receiptRef.current, { 
        scale: 3, 
        backgroundColor: '#fff' 
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          return;
        }
  
        const timestamp = Math.floor(Date.now() / 1000); // Timestamp ปัจจุบัน
        const uploadPreset = 'receipt_pic'; // Upload Preset ของคุณ
  
        try {
          setLoading(true); 
          // ขอ Signature จากเซิร์ฟเวอร์
          const signatureResponse = await clinicAPI.post(`/generate-signature`, {
            timestamp,
            upload_preset: uploadPreset,
          });
  
          const { signature, apiKey, cloudName } = signatureResponse.data;
  
          // สร้าง FormData สำหรับอัปโหลด
          const formData = new FormData();
          formData.append('file', blob, 'receipt.jpg');
          formData.append('timestamp', timestamp);
          formData.append('upload_preset', uploadPreset);
          formData.append('api_key', apiKey);
          formData.append('signature', signature);
  
          // อัปโหลดไปยัง Cloudinary
          const uploadResponse = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
  
          const imageUrl = uploadResponse.data.secure_url;
                 // ส่ง URL ไปยัง LINE ผ่าน API

                 
          const lineResponse = await clinicAPI.post(`/sendLineReceipt`, {
              lineId: DataReceipt[0]?.line_id,  // LINE ID ของลูกค้า
              imageUrl: imageUrl,  // URL ของรูปใบเสร็จ
            });
          
          if (lineResponse.status === 200) {
            showSnackbar('ส่งใบเสร็จไปยัง LINE สำเร็จ', 'success');
            } else {
            showSnackbar('การส่งใบเสร็จไปยัง LINE ล้มเหลว', 'error');
            }
  
          // ส่ง URL นี้ไปยัง LINE หรือทำอย่างอื่น
        } catch (error) {
          // console.error('Error uploading image:', error);
          showSnackbar('เกิดข้อผิดพลาดในการอัปโหลด', 'error');
        }finally {
          setLoading(false);
        }
      }, 'image/jpeg', 1.0);
    }
  };
  
  

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', textAlign: 'center' ,maxWidth: '100%',  // ไม่ให้เกินขนาด Dialog
      height: 'auto'}}>
        
    <div
      ref={receiptRef}
        style={{
        padding: '20px',
        margin: '20px auto',
        width: '400px',
        backgroundColor: '#fff',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
        }}
    >
        <h2 style={{ marginBottom: '20px'  , textAlign: 'center' }}>ใบเสร็จรับเงิน</h2>
        <div
        style={{
            display: "flex",
            justifyContent: "center",  // จัดแนวนอนให้อยู่กลาง
            alignItems: "center",      // จัดแนวตั้งให้อยู่กลาง
            height: "20vh",           // ให้ความสูงของ div ครอบคลุมพื้นที่ทั้งหมด
            overflow: "hidden",        // ป้องกันการแสดงผลส่วนที่เกิน
        }}
        >
        <div
            style={{
            width: "150px",           // ขนาดของวงกลม
            height: "150px",          // ขนาดของวงกลม
            borderRadius: "50%",      // ทำให้เป็นวงกลม
            overflow: "hidden",       // ป้องกันไม่ให้รูปภาพเกินขอบวงกลม
            }}
        >
            <img
            src="/Logo.jpg" // เส้นทางของรูปภาพใน public
            alt="Animal"
            style={{
                width: "100%",      // ให้ขนาดเต็มภายใน div
                height: "100%",     // ให้ขนาดเต็มภายใน div
                objectFit: "cover", // ให้รูปภาพเต็มพื้นที่
            }}
            />
        </div>
        </div>
        
        <p style={{ textAlign: 'center',marginBottom: '20px' }}> 654/8 ประชาอุทิศ ทุ่งครุ <br/>กรุงเทพมหานคร 10140</p>
        {DataReceipt.length > 0 ? (
          <>
            <p>
              รหัสชำระเงิน: <strong>#{receiptData.payment_id}-{dayjs(receiptData.invoice_date).format('YYYYMMDD')}</strong>
            </p>
            <p>ชื่อลูกค้า: <strong>{DataReceipt[0]?.fullname || 'ไม่ระบุชื่อ'}</strong></p>
            <p>วันที่ออกใบเสร็จ: <strong>{new Date().toLocaleDateString()}</strong></p>
            <hr style={{ margin: '20px 0' }} />
            <h3>รายการสินค้า</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ชื่อรายการ</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>จำนวน</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>ราคา</th>
                </tr>
              </thead>
              <tbody>
                {DataReceipt.map((item, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.category_name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{item.amount}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{item.subtotal_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>ไม่มีข้อมูลใบเสร็จ</p>
        )}

        <p style={{ textAlign: 'right' }}>
            ยอดชำระ: <strong>{DataReceipt[0]?.total_payment || 'ไม่พบข้อมูล'} บาท</strong>
        </p>

        <p style={{ textAlign: 'center' }}> <strong>ขอบคุณที่ใช้บริการ</strong> </p>

      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        <button
          onClick={handleDownloadReceipt}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          ดาวน์โหลดใบเสร็จ
        </button>
        
        {isPending && (
          <button
            onClick={handleUploadWithSignature}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: loading ? '#aaa' : '#28a745', // เปลี่ยนสีปุ่มเมื่อกำลังโหลด
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              marginLeft: '10px', // ระยะห่างระหว่างปุ่ม
              cursor: loading ? 'not-allowed' : 'pointer', // ปิดการกดปุ่มเมื่อโหลด
              position: 'relative', // สำหรับวางตำแหน่ง CircularProgress
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
           /// ปิดการกดปุ่มระหว่างโหลด
          >
            ส่งใบเสร็จไปที่ LINE
          </button>                
        )}

        <Backdrop open={loading} sx={{ color: '#fff', zIndex: 1201 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
      </div>         
    <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ReceiptComponent;

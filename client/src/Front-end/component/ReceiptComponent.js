import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';
import axios from 'axios';
import 'dayjs/locale/th';

const api = 'http://localhost:8080/api/clinic';

const ReceiptComponent = ({ receiptData }) => {
  const [DataReceipt, setDataReceipt] = useState([]);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();

  useEffect(() => {
    // console.log('ReceiptData Props:', receiptData); // ตรวจสอบ props ที่ส่งมา
    fetchDataReceipt();
  }, []);

  const fetchDataReceipt = async () => {
    try {
      const response = await axios.get(`${api}/product/receipt/${receiptData.invoice_id}`);
    //   console.log('API Response:', response.data); // ตรวจสอบข้อมูลที่ได้จาก API
      setDataReceipt(response.data); // เก็บข้อมูลใน state
    } catch (error) {
      console.error('Error fetching DataReceipt:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <p>กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', textAlign: 'center' }}>
    <div
      ref={receiptRef}
        style={{
        padding: '20px',
        margin: '20px auto',
        width: '600px',
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
              รหัสชำระเงิน: <strong>#{receiptData.invoice_id}-{dayjs().format('YYYYMMDD')}</strong>
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
            ยอดชำระ: <strong>{DataReceipt[0].total_payment} บาท</strong>
        </p>
        
        <p style={{ textAlign: 'center' }}> <strong>ขอบคุณที่ใช้บริการ</strong> </p>

      </div>
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
    </div>
  );
};

export default ReceiptComponent;

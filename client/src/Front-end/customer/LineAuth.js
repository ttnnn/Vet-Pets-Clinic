import  { useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import liff from '@line/liff'; // Make sure you have installed and imported the liff SDK

const LineAuth = () => {
    const navigate = useNavigate();

    // สร้าง handleLogin ฟังก์ชันและใช้ useCallback เพื่อหลีกเลี่ยงการสร้างใหม่ในการ render ทุกครั้ง
    const handleLogin = useCallback(async () => {
        try {
            const profile = await liff.getProfile();
            const idToken = liff.getIDToken();
            console.log(profile, idToken);
            navigate("/login"); 
        } catch (err) {
            console.log(err);
        }
    }, [navigate]); 

    useEffect(() => {
        liff.init({ liffId: '2006068191-vAnqlBk7' })
            .then(() => {
                handleLogin();
                console.log("LIFF initialized");
            })
            .catch((err) => {
                // Initialization failed
                console.error("LIFF initialization failed", err);
            });
    }, [handleLogin]); // เพิ่ม handleLogin ใน dependency array

};

export default LineAuth;

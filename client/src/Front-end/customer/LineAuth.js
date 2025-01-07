import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";

const LineAuth = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ฟังก์ชันสำหรับการล็อกอินและดึงข้อมูลผู้ใช้
    const isTokenExpired = (idToken) => {
        try {
            const decoded = JSON.parse(atob(idToken.split(".")[1]));
            return Date.now() >= decoded.exp * 1000; // exp อยู่ในหน่วยวินาที
        } catch {
            return true;
        }
    };

    const handleLogin = useCallback(async () => {
        try {
            if (!liff.isLoggedIn()) {
                liff.login();
            } else {
                const idToken = liff.getIDToken();

                if (isTokenExpired(idToken)) {
                    console.warn("Token has expired. Redirecting to login...");
                    liff.logout();
                    liff.login();
                    return;
                }

                const profile = await liff.getProfile();
                const {pictureUrl} = profile;
                // console.log("User Profile:", profile);
                // console.log("ID Token:", idToken);

                navigate("/customer/login", { state: { idToken ,pictureUrl } });
            }
        } catch (err) {
            console.error("Error during login:", err);
            setError("Failed to log in with LINE.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);


    

    useEffect(() => {
        liff.init({ liffId: "2006068191-vAnqlBk7" })
            .then(() => {
                console.log("LIFF initialized");
                handleLogin();
            })
            .catch((err) => {
                console.error("LIFF initialization failed:", err);
                setError("Failed to initialize LIFF.");
                setLoading(false);
            });
    }, [handleLogin]);

    // แสดงข้อความระหว่างรอการโหลด
    if (loading) {
        return <div>Loading...</div>;
    }

    // แสดงข้อความข้อผิดพลาด (ถ้ามี)
    if (error) {
        return <div>Error: {error}</div>;
    }

    return null; // ไม่ต้องแสดง UI ในคอมโพเนนต์นี้
};

export default LineAuth;
 
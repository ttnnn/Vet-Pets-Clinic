import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";

const lineliff = process.env.REACT_APP_LIFF_ID;

const LineAuth = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            await liff.ready; // รอให้ LIFF โหลดเสร็จก่อน
            if (!liff.isLoggedIn()) {
                liff.login({ redirectUri: window.location.href });
                return;
            }
            
            const idToken = liff.getIDToken();
            if (!idToken) {
                console.warn("ID Token not found. Trying login again...");
                liff.login({ redirectUri: window.location.href });
                return;
            }
    
            if (isTokenExpired(idToken)) {
                alert("Your session has expired. Please log in again.");
                liff.logout();
                liff.login({ redirectUri: window.location.href });
                return;
            }
    
            localStorage.setItem("lineToken", idToken);
            const profile = await liff.getProfile();
            navigate("/customer/login", { state: { idToken, pictureUrl: profile.pictureUrl } });
    
        } catch (err) {
            console.error("Error during login:", err);
            setError("Failed to log in with LINE.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);
    

    useEffect(() => {
        if (!lineliff) {
           // console.error("LIFF ID is not set. Please check your .env configuration.");
            setError("LIFF ID is missing.");
            setLoading(false);
            return;
        }

        liff.init({ liffId: lineliff })
            .then(() => {
              //  console.log("LIFF initialized");
                handleLogin();
            })
            .catch((err) => {
                //console.error("LIFF initialization failed. Check if the LIFF ID is correct:", err);
                setError("Failed to initialize LIFF. Please try again later.");
                setLoading(false);
            });
    }, [handleLogin]);
    
    return (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", marginTop: "50px" }}>Loading, please wait...</div>
          ) : (
            error && <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</div>
          )}
        </div>
      );
      
};

export default LineAuth;

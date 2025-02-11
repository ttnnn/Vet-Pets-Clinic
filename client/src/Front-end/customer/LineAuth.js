import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
console.log('LIFF SDK:', liff);
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
        console.log("handleLogin called");
        try {
            if (!liff.isLoggedIn()) {
                console.warn("User not logged in. Redirecting to login...");
                liff.login();
                return;
            }
    
            console.log("Waiting for LIFF to be ready...");
            await liff.ready;
            console.log("LIFF is ready");
    
            const idToken = liff.getIDToken();
            console.log("ID Token:", idToken);
    
            if (!idToken) {
                console.error("ID Token is null. Trying to re-login...");
                liff.login();
                return;
            }
    
            if (isTokenExpired(idToken)) {
                alert("Your session has expired. Please log in again.");
                liff.logout();
                liff.login();
                return;
            }
    
            const profile = await liff.getProfile();
            console.log("User Profile:", profile);
    
            localStorage.setItem("lineToken", idToken);
            localStorage.setItem("pictureUrl", profile.pictureUrl);
    
            navigate("/customer/login");
        } catch (err) {
            console.error("Error during login:", err);
            setError("Failed to log in with LINE.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);
    
    useEffect(() => {
        console.log("useEffect triggered");
    
        if (!lineliff) {
            console.error("LIFF ID is not set. Please check your .env configuration.");
            setError("LIFF ID is missing.");
            setLoading(false);
            return;
        }
    
        liff.init({ liffId: lineliff })
            .then(() => {
                console.log("LIFF initialized successfully");
                handleLogin();
            })
            .catch((err) => {
                console.error("LIFF initialization failed:", err);
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

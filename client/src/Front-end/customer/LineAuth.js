import { useEffect, useState } from "react";
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

    const handleLogin = async () => {
        console.log("🔄 handleLogin called");

        try {
            console.log("🔍 Checking login status...");
            console.log("🔍 liff.isLoggedIn():", liff.isLoggedIn());

            if (!liff.isLoggedIn()) {
                console.warn("⚠️ User not logged in. Redirecting to LIFF login...");
                liff.login();
                return;
            }

            console.log("🕐 Waiting for LIFF to be ready...");
            await liff.ready;
            console.log("✅ LIFF is ready");

            console.log("📱 Is in LINE App:", liff.isInClient());

            let idToken = liff.getIDToken();
            let accessToken = liff.getAccessToken();

            console.log("🔑 ID Token:", idToken);
            console.log("🔑 Access Token:", accessToken);

            if (!idToken && accessToken) {
                console.log("⚠️ Using Access Token instead of ID Token");
                idToken = accessToken;
            }

            if (!idToken) {
                console.error("❌ No valid token found. Trying to re-login...");
                liff.login();
                return;
            }

            if (isTokenExpired(idToken)) {
                alert("⚠️ Your session has expired. Please log in again.");
                liff.logout();
                liff.login();
                return;
            }

            const profile = await liff.getProfile();
            console.log("👤 User Profile:", profile);

            localStorage.setItem("lineToken", idToken);
            localStorage.setItem("pictureUrl", profile.pictureUrl);

            navigate("/customer/login");
        } catch (err) {
            console.error("❌ Error during login:", err);
            setError("Failed to log in with LINE.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("🔄 useEffect triggered!");

        if (!lineliff) {
            console.error("❌ LIFF ID is missing!");
            setError("LIFF ID is missing.");
            setLoading(false);
            return;
        }

        liff.init({ liffId: lineliff })
            .then(() => {
                console.log("✅ LIFF initialized successfully", lineliff);

                if (!liff.isLoggedIn()) {
                    console.warn("⚠️ User not logged in. Redirecting to LIFF login...");
                    liff.login();
                } else {
                    console.log("🔄 Calling handleLogin directly...");
                    handleLogin();
                }
            })
            .catch((err) => {
                console.error("❌ LIFF initialization failed:", err);
                setError("Failed to initialize LIFF. Please try again later.");
                setLoading(false);
            });
    }, []);

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

import { Navigate, useLocation } from "react-router-dom";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../../Costants";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../api";
import LinearIndeterminate from "../../LinearIndeterminate";
import { logout } from "../../redux/actions/authentication/logoutAction";
import { jwtDecode } from "jwt-decode";

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(true);
    const location = useLocation();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.user); // Accessing user state from userReducer

    useEffect(() => {
        checkAuth();
    }, [authState, dispatch]); // Re-run the effect when authState changes

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                throw new Error("No token found");
            }

            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;

            if (decoded.exp < now) {
                // Token expired, try refreshing
                const refreshed = await refreshToken();
                if (!refreshed) {
                    localStorage.removeItem(ACCESS_TOKEN);
                    localStorage.removeItem(REFRESH_TOKEN);
                    localStorage.removeItem("persist:root");
                    dispatch(logout());
                    throw new Error("Token refresh failed");
                }
            }

            setIsAuthorized(true);
        } catch (error) {
            console.error("Authorization error:", error);
            setIsAuthorized(false);
            dispatch(logout());
        }
    };

    const refreshToken = async () => {
        try {
            const refresh = localStorage.getItem(REFRESH_TOKEN);
            if (!refresh) {
                return false;
            }

            const res = await api.post("/token/refresh/", { refresh });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                return true;
            }
        } catch (error) {
            console.error("Token refresh error:", error);
        }

        return false;
    };

    // Show loading indicator while checking authorization
    if (isAuthorized === null) {
        return <LinearIndeterminate />;
    }



    // Check if the current path is an authentication path
    const isAuthPath = location.pathname.includes("auth");

    console.log("isAuthorized:", isAuthorized);
    console.log("isAuthPath:", isAuthPath);


    // Redirect to login if not authorized and not on an auth path
    if (!isAuthorized && !isAuthPath) {
        return <Navigate to="/auth/login" />;
    }


    // Optimized conditional rendering
    if (isAuthorized && isAuthPath) {
        return <Navigate to="/" />;
    }


    return children
}

export default ProtectedRoute;

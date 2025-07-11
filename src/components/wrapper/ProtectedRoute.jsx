import { Navigate, useLocation } from "react-router-dom";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../../Costants";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../api";
import LinearIndeterminate from "../../LinearIndeterminate";
import { logout } from "../../redux/actions/authentication/logoutAction";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
}) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.userReducer?.data);

  useEffect(() => {
    checkAuth();
  }, [user, dispatch]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        throw new Error("No token found");
      }

      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          localStorage.clear();
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

  // Show loader while determining
  if (isAuthorized === null) {
    return <LinearIndeterminate />;
  }

  const isAuthPath = location.pathname.includes("auth");

  // Not logged in and not on auth page
  if (!isAuthorized && !isAuthPath) {
    return <Navigate to="/auth/login" />;
  }

  // Logged in but navigating to auth page
  if (isAuthorized && isAuthPath) {
    return <Navigate to="/" />;
  }

  // ✅ If user is logged in, now check permissions and roles
  const userPermissions = user?.user_permissions || [];
  const userRoles = user?.groups || [];

  const hasRequiredPermissions =
    !requiredPermissions.length ||
    requiredPermissions.some((perm) => userPermissions.includes(perm));

  const hasRequiredRoles =
    !requiredRoles.length ||
    requiredRoles.some((role) => userRoles.includes(role));

  if (!hasRequiredPermissions || !hasRequiredRoles) {
    Swal.fire({
      title: "Access Denied",
      text: "You don’t have permission to access this page.",
      icon: "warning",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      confirmButtonText: "Go to Dashboard",
    }).then(() => {
      window.location.href = "/";
    });

    return null;
  }

  return children;
}

export default ProtectedRoute;

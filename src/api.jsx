import axios from "axios";
import { ACCESS_TOKEN, API_BASE_URL, REFRESH_TOKEN } from "./Costants";
import { jwtDecode } from "jwt-decode";
import showLoginDialog from "./pages/authentication/loginModal";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    config.headers.Accept = "application/json";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.config.url &&
      error.config.url.includes("/user/login") ||
      error.config.url.includes("/user/register") ||
      error.config.url.includes("/user/refresh") ||
      error.config.url.includes("/user/logout") ||
      error.config.url.includes("/token/")) {
      return Promise.reject(error);
    }

      if (
        error.response &&
        (error.response.status === 401 || error.response.data?.status === 8001)
      ) {
        try {
          const didRefresh = await checkAuthStatus();
          if (didRefresh) {
            const newAccessToken = localStorage.getItem(ACCESS_TOKEN);
            error.config.headers.Authorization = `Bearer ${newAccessToken}`;
            return api.request(error.config); // retry original request
          } else {
            const didLogin = await showLoginDialog();
            if (didLogin) {
              const newAccessToken = localStorage.getItem(ACCESS_TOKEN);
              error.config.headers.Authorization = `Bearer ${newAccessToken}`;
              return api.request(error.config);
            } else {
              window.location.href = "/auth/login"; // Redirect to login page if login fails
            }
          }
        } catch (e) {
          showLoginDialog();
          window.location.href = "/auth/login";
        }
      }

    return Promise.reject(error);
  }
);



const checkAuthStatus = async () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN);

  if (!accessToken) {
    logout();
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if (tokenExpiration < now) await refreshToken();

    return true;
  } catch (error) {
    logout();
    return false;
  }
};

const refreshToken = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN);
  if (!refreshToken) {
    logout();
    return false;
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      "refresh": refreshToken,
    });

    if (res.status === 200) {
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    logout();
    return false;
  }
};

const logout = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};



export default api;
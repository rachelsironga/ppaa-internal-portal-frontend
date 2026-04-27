import axios from "axios";
import { ACCESS_TOKEN, API_BASE_URL, REFRESH_TOKEN } from "./Costants";
import showLoginDialog from "./pages/authentication/loginModal";
import Swal from "sweetalert2";

const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let refreshPromise = null;

let isLoginDialogOpen = false;
let loginPromise = null;

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    config.headers.Accept = "application/json";
    const u = config.url || "";
    const publicAuthPath =
      u.includes("/user/login") ||
      u.includes("/user/register") ||
      u.includes("/user/new_login") ||
      u.includes("/user/forgot-password");
    if (token && !publicAuthPath) {
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
    const originalRequest = error.config;

    // Ignore auth endpoints
    if (
      originalRequest?.url?.includes("/user/login") ||
      originalRequest?.url?.includes("/user/register") ||
      originalRequest?.url?.includes("/user/new_login") ||
      originalRequest?.url?.includes("/user/refresh") ||
      originalRequest?.url?.includes("/user/logout") ||
      originalRequest?.url?.includes("/user/forgot-password") ||
      originalRequest?.url?.includes("/token/")
    ) {
      return Promise.reject(error);
    }

    // Handle 401 / token expired
    if (
      error.response &&
      (error.response.status === 401 || error.response.data?.status === 8001)
    ) {
      // Prevent infinite retry loop
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        /** ============================
         *  TOKEN REFRESH (SINGLE RUN)
         *  ============================
         */
        console.log("----------->Starting token refresh process...");
        if (!isRefreshing) {
          console.log("----------->Token refresh initiated.");
          isRefreshing = true;
          refreshPromise = refreshToken()
            .then((ok) => ok)
            .finally(() => {
              isRefreshing = false;
              console.log("----------->Token refresh process completed.");
            });
        }

        const refreshed = await refreshPromise;

        if (refreshed) {
          const newToken = localStorage.getItem(ACCESS_TOKEN);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        /** ============================
         *  LOGIN DIALOG (SINGLE RUN)
         *  ============================
         */
        if (!isLoginDialogOpen) {
          isLoginDialogOpen = true;
          loginPromise = showLoginDialog()
            .then((success) => success)
            .finally(() => {
              isLoginDialogOpen = false;
            });
        }

        const didLogin = await loginPromise;

        if (didLogin) {
          const newToken = localStorage.getItem(ACCESS_TOKEN);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        // Login canceled or failed
        logout();
        window.location.href = "/auth/login";
        return Promise.reject(error);
      } catch (e) {
        logout();
        window.location.href = "/auth/login";
        return Promise.reject(e);
      }
    }

    /** ============================
     *  403 ACCESS DENIED
     *  ============================
     */
    if (
      error.response &&
      (error.response.status === 403 || error.response.data?.status === 8006)
    ) {
      Swal.fire({
        title: "Access Denied!",
        text: "You don’t have permission to proceed with this action",
        icon: "warning",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
        confirmButtonText: "Go to Dashboard",
      }).then(() => {
        window.location.href = "/";
      });
    }

    return Promise.reject(error);
  }
);



// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (
//       (error.config.url && error.config.url.includes("/user/login")) ||
//       error.config.url.includes("/user/register") ||
//       error.config.url.includes("/user/refresh") ||
//       error.config.url.includes("/user/logout") ||
//       error.config.url.includes("/token/")
//     ) {
//       return Promise.reject(error);
//     }

//     if (
//       error.response &&
//       (error.response.status === 401 || error.response.data?.status === 8001)
//     ) {
//       try {
//         const didRefresh = await checkAuthStatus();
//         if (didRefresh) {
//           const newAccessToken = localStorage.getItem(ACCESS_TOKEN);
//           error.config.headers.Authorization = `Bearer ${newAccessToken}`;
//           return api.request(error.config); // retry original request
//         } else {
//           const didLogin = await showLoginDialog();
//           if (didLogin) {
//             const newAccessToken = localStorage.getItem(ACCESS_TOKEN);
//             error.config.headers.Authorization = `Bearer ${newAccessToken}`;
//             return api.request(error.config);
//           } else {
//             window.location.href = "/auth/login"; // Redirect to login page if login fails
//           }
//         }
//       } catch (e) {
//         showLoginDialog();
//         window.location.href = "/auth/login";
//       }
//     }
//     if (
//       (error.response && error.status === 403) ||
//       error.response.data?.status === 8006
//     ) {
//       Swal.fire({
//         title: "Access Denied!",
//         text: "You don’t have permission to  proceed with the Action",
//         icon: "warning",
//         allowOutsideClick: false, // User can't click outside to close
//         allowEscapeKey: false, // User can't press ESC to close
//         allowEnterKey: false, // User can't press ENTER to close
//         showCancelButton: false, // Only one button
//         confirmButtonText: "Go to Dashboard",
//         customClass: {
//           confirmButton: "swal2-confirm btn btn-primary", // You can adjust styling here
//         },
//       }).then((result) => {
//         // Redirect when the user clicks the button
//         if (result.isConfirmed) {
//           window.location.href = "/"; // Change to your dashboard URL
//         }
//       });
//     }

//     return Promise.reject(error);
//   }
// );



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
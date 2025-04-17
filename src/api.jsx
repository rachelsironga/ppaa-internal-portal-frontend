import axios from "axios";
import { ACCESS_TOKEN, API_BASE_URL } from "./Costants"

const api = axios.create({
    baseURL: API_BASE_URL
})


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        // config.headers["Content-Encoding"] = "application/json";
        config.headers.Accept = "application/json"
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default api;
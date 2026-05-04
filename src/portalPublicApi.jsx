import axios from "axios";
import { jwtDecode } from "jwt-decode";
import api from "./api";
import { API_BASE_URL, ACCESS_TOKEN } from "./Costants";

/** Axios instance without JWT — for internal-portal routes that allow anonymous access. */
export const portalPublicApi = axios.create({
  baseURL: API_BASE_URL,
});

portalPublicApi.interceptors.request.use((config) => {
  config.headers.Accept = "application/json";
  return config;
});

/**
 * Public download/dashboard endpoints reject invalid JWTs before AllowAny runs.
 * Use no Authorization when there is no valid access token; otherwise use the main api client
 * so staff can fetch non-published files when appropriate.
 */
export function clientForPortalFileDownload() {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (!token) return portalPublicApi;
  try {
    const exp = jwtDecode(token).exp;
    if (typeof exp !== "number" || Date.now() / 1000 >= exp) {
      return portalPublicApi;
    }
  } catch {
    return portalPublicApi;
  }
  return api;
}

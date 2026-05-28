import axios from "axios";

// תומך בשני שמות: VITE_APP_API_BASE_URL (זהה ל-mnm-admin) ו-VITE_API_BASE_URL.
// אם אף אחד לא מוגדר → "/api" יחסי שעובר דרך Vite proxy (dev בלבד).
const baseURL =
  import.meta.env.VITE_APP_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

const client = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor: צירוף Bearer מ-localStorage לכל בקשה.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → ניקוי טוקן והפניית הדפדפן לדף הלוגין (אם לא כבר שם).
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("agentToken");
      localStorage.removeItem("agentInfo");
      if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;

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

// נתיבים פומביים שהלקוח מגיע אליהם עם טוקן ב-URL. אם הלקוח פותח קישור
// במכשיר שבו יש טוקן סוכן שפג (למשל הטאבלט של הסוכן), ריענון הפרופיל יחזיר
// 401 — ואסור שזה יזרוק את הלקוח מדף ההצעה/ההסכם לדף הלוגין של הסוכן.
const PUBLIC_PATH_PREFIXES = ["/quote/", "/sign-contract/"];
const isPublicPath = () =>
  typeof window !== "undefined" &&
  PUBLIC_PATH_PREFIXES.some((prefix) => window.location.pathname.startsWith(prefix));

// 401 → ניקוי טוקן והפניית הדפדפן לדף הלוגין (אם לא כבר שם, ולא בדף פומבי).
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("agentToken");
      localStorage.removeItem("agentInfo");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.endsWith("/login") &&
        !isPublicPath()
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;

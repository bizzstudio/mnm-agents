// publicClient — ללא Authorization header. בשימוש לקצוות שמאומתים דרך
// טוקן ב-URL (כמו /contracts/by-token/:token), כדי לא לדלוף טוקן סוכן
// במקרה שהדף נפתח גם בעת שהסוכן מחובר.
import axios from "axios";

const baseURL =
    import.meta.env.VITE_APP_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/api";

const publicClient = axios.create({
    baseURL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});

export default publicClient;

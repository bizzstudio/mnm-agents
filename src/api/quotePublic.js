// api/quotePublic.js
//
// קצוות הצעת המחיר שהלקוח מגיע אליהם מהקישור במייל/וואטסאפ.
// publicClient — בלי Authorization, כדי שלא ידלוף טוקן סוכן אם הדף נפתח
// באותו דפדפן שבו הסוכן מחובר.

import publicClient from "./publicClient";

export const getQuoteByToken = async (token) => {
    const { data } = await publicClient.get(
        `/quotes/by-token/${encodeURIComponent(token)}`
    );
    return data;
};

export const respondToQuote = async (token, { decision, name, note }) => {
    const { data } = await publicClient.post(
        `/quotes/by-token/${encodeURIComponent(token)}/respond`,
        { decision, name, note }
    );
    return data;
};

// כתובות ישירות — נפתחות בטאב חדש (הקצה מאומת ע"י הטוקן, אין header).
const base = () =>
    (import.meta.env.VITE_APP_API_BASE_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        "/api").replace(/\/$/, "");

export const quotePrintUrl = (token) =>
    `${base()}/quotes/by-token/${encodeURIComponent(token)}/print`;

export const quotePdfUrl = (token, download = false) =>
    `${base()}/quotes/by-token/${encodeURIComponent(token)}/pdf${download ? "?download=1" : ""}`;

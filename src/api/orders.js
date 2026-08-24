import client from "./client";

// האפליקציה יוצרת הצעות מחיר בלבד (orderType:"quote"). השרת אוכף זאת גם כן.
// payload: { mainCustomerId, customerId?, cart:[{product, quantity, price}], orderType:"quote", note? }
export const createOrder = async (payload) => {
  const { data } = await client.post("/agent/orders", payload);
  return data;
};

export const listOrders = async (params = {}) => {
  const { data } = await client.get("/agent/orders", { params });
  return data;
};

export const getOrder = async (id) => {
  const { data } = await client.get(`/agent/orders/${id}`);
  return data;
};

// ===================== מסמך ההצעה, שליחה ללקוח, מצב אישור =====================

// גרסת ה-HTML של המסמך — לשימוש בהדפסה (ראה utils/printDocument).
export const fetchQuoteHtml = async (id) => {
  const { data } = await client.get(`/agent/orders/${id}/html`, {
    responseType: "text",
  });
  return data;
};

// ה-PDF נשלף כ-blob דרך axios (ולא ע"י פתיחת URL בטאב חדש), כי ה-Authorization
// נשלח ב-header — כתובת "עירומה" בטאב חדש תחזור 401.
export const downloadQuotePdf = async (id, fileName) => {
  const { data: blob } = await client.get(`/agent/orders/${id}/pdf`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || `הצעת-מחיר-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

// שליחת ההצעה ללקוח במייל (עם PDF מצורף וקישור לאישור).
export const sendQuoteToCustomer = async (id, { email, message } = {}) => {
  const { data } = await client.post(`/agent/orders/${id}/send`, { email, message });
  return data; // { sentToEmail, url, quote }
};

// קישור צפייה/אישור לשיתוף (וואטסאפ / העתקה), בלי שליחת מייל.
export const getQuoteShareLink = async (id) => {
  const { data } = await client.post(`/agent/orders/${id}/share-link`);
  return data; // { token, url, expiresAt, quote }
};

// עדכון ידני של תשובת הלקוח: approve | reject | reset
export const setQuoteApproval = async (id, decision, note) => {
  const { data } = await client.post(`/agent/orders/${id}/approval`, { decision, note });
  return data; // { quote }
};

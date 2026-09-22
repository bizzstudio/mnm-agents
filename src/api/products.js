import client from "./client";

export const listProducts = async ({ q, category, mainCustomerId, page = 1, limit = 30 } = {}) => {
  const { data } = await client.get("/agent/products", {
    params: { q, category, mainCustomerId, page, limit },
  });
  return data;
};

export const getProduct = async (id, mainCustomerId) => {
  const { data } = await client.get(`/agent/products/${id}`, {
    params: mainCustomerId ? { mainCustomerId } : {},
  });
  return data;
};

// mainCustomerId — במחירון סגור (ישיבות) השרת מחזיר רק קטגוריות עם מוצרים ממנו.
export const listCategories = async (mainCustomerId) => {
  const { data } = await client.get("/agent/categories", {
    params: mainCustomerId ? { mainCustomerId } : {},
  });
  return data;
};

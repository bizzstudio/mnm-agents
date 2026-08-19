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

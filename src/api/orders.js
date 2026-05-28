import client from "./client";

// payload: { mainCustomerId, customerId?, cart:[{product, quantity, price?, agentDiscountPercent?}],
//   orderType:"order"|"quote", note?, agentDiscountPercent? }
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

export const convertQuoteToOrder = async (id) => {
  const { data } = await client.post(`/agent/orders/${id}/convert-to-order`);
  return data;
};

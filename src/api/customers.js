import client from "./client";

export const listCustomers = async (q = "") => {
  const { data } = await client.get("/agent/customers", {
    params: q ? { q } : {},
  });
  return data;
};

export const getCustomer = async (id) => {
  const { data } = await client.get(`/agent/customers/${id}`);
  return data;
};

export const createCustomer = async (payload) => {
  const { data } = await client.post("/agent/customers", payload);
  return data;
};

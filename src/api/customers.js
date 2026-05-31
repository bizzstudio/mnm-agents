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

export const updateCustomer = async (id, payload) => {
  const { data } = await client.put(`/agent/customers/${id}`, payload);
  return data;
};

export const deleteCustomer = async (id) => {
  const { data } = await client.delete(`/agent/customers/${id}`);
  return data;
};

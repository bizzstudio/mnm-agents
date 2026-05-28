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

export const listCategories = async () => {
  const { data } = await client.get("/agent/categories");
  return data;
};

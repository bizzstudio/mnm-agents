import client from "./client";

export const loginAgent = async ({ phone, password }) => {
  const { data } = await client.post("/agent/login", { phone, password });
  return data;
};

export const getMe = async () => {
  const { data } = await client.get("/agent/me");
  return data;
};

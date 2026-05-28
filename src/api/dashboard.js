import client from "./client";

export const getDashboard = async (range = "month") => {
  const { data } = await client.get("/agent/dashboard", { params: { range } });
  return data;
};

import client from "./client";
import publicClient from "./publicClient";

// ===== קצוות סוכן (דורש login) =====

export const sendContract = async (mainCustomerId, force = false) => {
    const { data } = await client.post("/agent/contracts/send", {
        mainCustomerId,
        force,
    });
    return data;
};

// בלי mainCustomerId — מחזיר רק AwaitingAgent (לדשבורד).
export const listPendingForAgent = async () => {
    const { data } = await client.get("/agent/contracts");
    return data;
};

export const listContractsForCustomer = async (mainCustomerId) => {
    const { data } = await client.get("/agent/contracts", {
        params: { mainCustomerId },
    });
    return data;
};

// מחזיר agent-token חתימה עבור הסכם ב-AwaitingAgent — לפתיחת דף החתימה מתוך
// mnm-agents בלי לחכות למייל.
export const getAgentSignToken = async (contractId) => {
    const { data } = await client.post(`/agent/contracts/${contractId}/sign-link`);
    return data.token;
};

// ===== קצוות פומביים (מאומתים דרך טוקן ב-URL — בלי login) =====

export const getContractByToken = async (token) => {
    const { data } = await publicClient.get(
        `/contracts/by-token/${encodeURIComponent(token)}`
    );
    return data;
};

export const submitContractByToken = async (token, payload) => {
    const { data } = await publicClient.post(
        `/contracts/by-token/${encodeURIComponent(token)}/submit`,
        payload
    );
    return data;
};

// utils/quoteStatus.js
//
// תרגום quote.approval (מהשרת) לתווית + צבע. מקור אמת אחד לכל המסכים,
// כדי שהסוכן, הלקוח והמשרד יראו בדיוק את אותה מילה.

export const QUOTE_APPROVAL = {
    draft: { label: "טרם נשלחה", short: "טרם נשלחה", color: "#6b7280", bg: "bg-gray-100", text: "text-gray-700" },
    sent: { label: "נשלחה ללקוח — בבדיקה", short: "בבדיקה", color: "#f59e0b", bg: "bg-amber-100", text: "text-amber-800" },
    viewed: { label: "הלקוח צפה — בבדיקה", short: "נצפתה", color: "#3b82f6", bg: "bg-blue-100", text: "text-blue-800" },
    approved: { label: "אושר ע\"י הלקוח", short: "אושר", color: "#16a34a", bg: "bg-green-100", text: "text-green-800" },
    rejected: { label: "לא אושר", short: "לא אושר", color: "#dc2626", bg: "bg-red-100", text: "text-red-800" },
};

export const approvalOf = (order) => order?.quote?.approval || "draft";

export const approvalMeta = (key) => QUOTE_APPROVAL[key] || QUOTE_APPROVAL.draft;

// האם הלקוח כבר השיב (אושר/לא אושר) — חוסם שליחה חוזרת "בשקט".
export const hasResponded = (key) => key === "approved" || key === "rejected";

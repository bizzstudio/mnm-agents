// utils/priceTiers.js
//
// מחירוני הסוכנים ואישור המחיר הפנימי. מקביל ל-utils/agentPriceTiers
// ול-services/agentPriceApprovalService בבקאנד (פרויקטים נפרדים, בלי קוד משותף).

export const PRICE_TIER_LABELS = {
  small: "לקוחות קטנים",
  institutional: "לקוחות מוסדיים",
};

export const DEFAULT_PRICE_TIER = "small";

// סוכן בלי השדה (פרופיל שנשמר לפני העדכון) חשוף למחירון הקטנים בלבד.
export const agentTiersOf = (agent) => {
  const list = Array.isArray(agent?.priceTiers)
    ? agent.priceTiers.filter((t) => PRICE_TIER_LABELS[t])
    : [];
  return list.length ? list : [DEFAULT_PRICE_TIER];
};

export const defaultTierFor = (agent) => {
  const tiers = agentTiersOf(agent);
  return tiers.includes(DEFAULT_PRICE_TIER) ? DEFAULT_PRICE_TIER : tiers[0];
};

export const customerTierOf = (customer) =>
  PRICE_TIER_LABELS[customer?.agentPriceTier] ? customer.agentPriceTier : DEFAULT_PRICE_TIER;

// ===== אישור מחיר =====

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const EPS = 0.01;

// "below" / "above" כשהמחיר מחוץ לטווח שהמחירון מתיר, אחרת null.
// אותו אפסילון של אגורה כמו בשרת (agentPriceGuard).
// ערך חסר (null / "") אינו מספר: Number(null) הוא 0, ובלי הבדיקה מחיר שעוד לא
// נבחר היה מסומן "מתחת", וגבול חסר היה הופך כל מחיר ל"מעל".
const numOrNull = (v) =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);

export const outOfRangeOf = (price, min, max) => {
  const p = numOrNull(price);
  if (p === null) return null;
  const lo = numOrNull(min);
  const hi = numOrNull(max);
  if (lo !== null && p < round2(lo) - EPS) return "below";
  if (hi !== null && p > round2(hi) + EPS) return "above";
  return null;
};

export const OUT_OF_RANGE_LABELS = {
  below: "מתחת למינימום — דורש אישור",
  above: "מעל המקסימום — דורש אישור",
};

export const PRICE_APPROVAL = {
  pending: {
    label: "ממתינה לאישור",
    text: "ההצעה הועברה לאישור המשרד. אפשר יהיה לשלוח אותה ללקוח אחרי שתאושר.",
    box: "bg-amber-50 border-amber-200 text-amber-900",
    badge: "bg-amber-100 text-amber-800",
  },
  approved: {
    label: "ההצעה אושרה",
    text: "",
    box: "bg-green-50 border-green-200 text-green-900",
    badge: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "ההצעה לא אושרה",
    text: "אי אפשר לשלוח את ההצעה ללקוח. יש להוציא הצעה חדשה במחירים מתוקנים.",
    box: "bg-red-50 border-red-200 text-red-900",
    badge: "bg-red-100 text-red-800",
  },
};

// אותו סימון אחרי שההצעה הוחלטה — "דורש אישור" כבר לא נכון.
export const OUT_OF_RANGE_SHORT = {
  below: "מתחת למינימום",
  above: "מעל המקסימום",
};

// החלטת המשרד על מוצר שחרג מהטווח (cart[].priceDecision).
export const LINE_DECISION_LABELS = {
  approved: "המחיר אושר",
  rejected: "המחיר לא אושר",
};

export const priceApprovalOf = (order) => order?.priceApproval?.status || "none";

// הצעה שממתינה לאישור או שנדחתה לא יכולה לצאת ללקוח.
export const isPriceBlocked = (order) => {
  const s = priceApprovalOf(order);
  return s === "pending" || s === "rejected";
};

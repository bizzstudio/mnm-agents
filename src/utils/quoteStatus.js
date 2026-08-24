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

// ===== מע"מ =====
// מחירי ההצעה נקובים לפני מע"מ, וכל מסך שמציג סכום מציג שלוש שורות:
// לפני מע"מ / מע"מ / סה"כ לתשלום.
//
// האחוז האמיתי מגיע מהשרת: דף הלקוח מקבל אותו ב-publicQuoteView, ומסכי הסוכן
// מקבלים אותו בפרופיל (getMe → agent.vatPercent), שמקורו ב-VAT_PERCENTAGE.
// הקבוע כאן הוא ברירת מחדל בלבד, לרגע שלפני שהפרופיל נטען.
const VAT_PERCENT_FALLBACK = 18;

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// מקבל סכום לפני מע"מ ומחזיר { percent, base, vat, total }.
// פטור ממע"מ בשורה — פירות וירקות. ערך חסר נחשב חייב במע"מ (ראה priceUtils
// בבקאנד: אי אפשר להבחין בין ברירת המחדל בסכימה לבין פטור אמיתי).
const isLineVatExempt = (line) => line?.isVatFree === true;

const lineAmount = (line) =>
  Number(
    line?.lineTotal != null
      ? line.lineTotal
      : (Number(line?.unitPrice ?? line?.price) || 0) * (Number(line?.quantity) || 0)
  ) || 0;

/**
 * פירוט מע"מ להצעה לפי שורות: המע"מ מחושב רק על השורות החייבות בו.
 * מקביל ל-quoteVatBreakdown בבקאנד (שני פרויקטים נפרדים, בלי קוד משותף).
 */
export const vatBreakdownForLines = (lines, totalBeforeVat, percent) => {
  const p = normalizePercent(percent);
  const list = Array.isArray(lines) ? lines : [];
  let vatableBase = 0;
  let exemptBase = 0;
  for (const line of list) {
    const amount = lineAmount(line);
    if (isLineVatExempt(line)) exemptBase += amount;
    else vatableBase += amount;
  }
  const base = round2(totalBeforeVat != null ? totalBeforeVat : vatableBase + exemptBase);
  const vat = round2((vatableBase * p) / 100);
  return {
    percent: p,
    base,
    vat,
    total: round2(base + vat),
    exemptBase: round2(exemptBase),
    hasExempt: exemptBase > 0,
  };
};

const normalizePercent = (percent) =>
  Number.isFinite(Number(percent)) && Number(percent) > 0
    ? Number(percent)
    : VAT_PERCENT_FALLBACK;

// utils/whatsapp.js
//
// פתיחת וואטסאפ עם הודעה מוכנה — כולל תמיכה ב-WhatsApp Business.
//
// הבעיה: קישור wa.me נפתח באפליקציית הוואטסאפ שרשומה במכשיר. כשמותקנות שתי
// האפליקציות (רגילה + ביזנס), המערכת בוחרת את הרגילה, ואז ההודעה נשלחת
// מהחשבון הפרטי של הסוכן במקום מחשבון העסק.
//
// מה אפשר לעשות:
//   אנדרואיד – אפשר לכוון במפורש לחבילה com.whatsapp.w4b דרך intent://,
//              עם כתובת נפילה (browser_fallback_url) למקרה שהיא לא מותקנת.
//   iOS / מחשב – שתי האפליקציות רושמות את אותה סכימה ואין דרך לבחור ביניהן.
//              שם נשארים ב-wa.me, ולכן המסך מציע גם "העתק הודעה" — הדרך
//              היחידה שמבטיחה שליחה מהאפליקציה שהסוכן בוחר.

const isAndroid = () =>
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent || "");

// מנרמל טלפון ישראלי לפורמט הבינלאומי (972…). null אם לא נראה כמו מספר.
export const waNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
};

// כתובת wa.me הרגילה — משמשת גם כנפילה ל-intent באנדרואיד.
const webUrl = (num, encodedText) =>
  num
    ? `https://wa.me/${num}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

/**
 * מחזיר את הכתובת לפתיחת וואטסאפ עם ההודעה.
 * @param {string} phone טלפון היעד (אפשר ריק — ייפתח בורר אנשי קשר)
 * @param {string} text  גוף ההודעה
 * @param {boolean} [preferBusiness=true] לכוון ל-WhatsApp Business כשאפשר
 */
export const whatsappUrl = (phone, text, preferBusiness = true) => {
  const num = waNumber(phone);
  const encoded = encodeURIComponent(String(text || ""));
  const web = webUrl(num, encoded);

  if (!preferBusiness || !isAndroid()) return web;

  const target = num ? `send/?phone=${num}&text=${encoded}` : `send/?text=${encoded}`;
  return (
    `intent://${target}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;` +
    `S.browser_fallback_url=${encodeURIComponent(web)};end`
  );
};

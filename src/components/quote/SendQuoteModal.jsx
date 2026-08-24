// חלונית שליחת ההצעה ללקוח.
//
// שני מסלולים:
//   מייל   — השרת שולח מייל עם PDF מצורף + קישור לאישור.
//   קישור  — השרת מחזיר קישור; הסוכן שולח בוואטסאפ / מעתיק.
// בשני המסלולים ההצעה עוברת ל"נשלחה ללקוח — בבדיקה".

import { useState } from "react";
import { FiCopy, FiMail, FiX, FiLink, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { sendQuoteToCustomer, getQuoteShareLink } from "@/api/orders";

const errText = (err) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "object") return msg.he || msg.en;
  return msg || "שגיאה בשליחה";
};

// מנרמל טלפון ישראלי ל-wa.me (972…). מחזיר null אם לא נראה כמו מספר.
const waNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
};

const SendQuoteModal = ({ order, onClose, onSent }) => {
  const defaultEmail = order?.mainCustomer?.email || order?.user_info?.email || "";
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const quoteNo = order?.invoice || String(order?._id || "").slice(-6);

  const handleEmail = async () => {
    setError("");
    setOkMsg("");
    setNotice("");
    if (!email.trim()) {
      setError("הזן כתובת מייל");
      return;
    }
    setBusy("email");
    try {
      const res = await sendQuoteToCustomer(order._id, { email: email.trim(), message });
      setOkMsg(`ההצעה נשלחה ל-${res.sentToEmail}`);
      setLink(res.url || "");
      onSent?.(res.quote);
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy("");
    }
  };

  const ensureLink = async () => {
    if (link) return link;
    const res = await getQuoteShareLink(order._id);
    setLink(res.url);
    onSent?.(res.quote);
    return res.url;
  };

  const waUrl = (url) => {
    const text = `שלום${order?.mainCustomer?.name ? ` ${order.mainCustomer.name}` : ""},\nמצורפת הצעת מחיר ${quoteNo} בסך ₪${Number(order?.total || 0).toLocaleString()}.\nלצפייה ואישור: ${url}`;
    const num = waNumber(order?.mainCustomer?.phone || order?.user_info?.contact);
    return num
      ? `https://wa.me/${num}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleWhatsapp = async () => {
    setError("");
    // הטאב נפתח *לפני* ה-await: אחרי בקשת רשת הדפדפן כבר לא רואה מחווה של
    // משתמש וחוסם window.open. אם הקישור כבר בידינו — פותחים אותו מיד.
    const win = link ? window.open(waUrl(link), "_blank") : window.open("", "_blank");
    if (link) {
      if (!win) setError("החלון נחסם — העתק את הקישור למטה ושלח ידנית");
      return;
    }

    setBusy("wa");
    try {
      const url = await ensureLink();
      if (win) win.location.href = waUrl(url);
      else setError("החלון נחסם — הקישור מוצג למטה, אפשר להעתיק ולשלוח ידנית");
    } catch (err) {
      if (win) win.close();
      setError(errText(err));
    } finally {
      setBusy("");
    }
  };

  const handleCopy = async () => {
    setError("");
    setNotice("");
    setBusy("copy");
    try {
      const url = await ensureLink();
      try {
        // clipboard זמין רק ב-secure context (HTTPS/localhost). בטאבלט שמחובר
        // ל-IP פנימי ב-HTTP הוא לא קיים — ואז מציגים את הקישור לבחירה ידנית.
        if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        setNotice("הדפדפן לא מאפשר העתקה אוטומטית — הקישור למטה, סמן והעתק");
      }
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">שליחת ההצעה ללקוח</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
            <FiX />
          </button>
        </div>

        <label className="block mb-3">
          <span className="text-sm font-semibold text-gray-700">מייל הלקוח</span>
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
            className="field mt-1"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-semibold text-gray-700">הודעה אישית (אופציונלי)</span>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="לדוגמה: המחירים בתוקף לשבועיים, אשמח לתשובה"
            className="field mt-1 min-h-[70px]"
          />
        </label>

        {error && (
          <div className="rounded-xl bg-danger/10 text-danger-dark px-4 py-2.5 text-sm mb-3">
            {error}
          </div>
        )}
        {okMsg && (
          <div className="rounded-xl bg-success/10 text-success px-4 py-2.5 text-sm mb-3">
            {okMsg}
          </div>
        )}
        {notice && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 text-sm mb-3">
            {notice}
          </div>
        )}

        <button
          onClick={handleEmail}
          disabled={!!busy}
          className="btn-primary w-full mb-3"
        >
          <FiMail /> {busy === "email" ? "שולח..." : "שלח במייל (כולל PDF)"}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleWhatsapp} disabled={!!busy} className="btn-secondary">
            <FaWhatsapp className="text-green-600" /> וואטסאפ
          </button>
          <button onClick={handleCopy} disabled={!!busy} className="btn-secondary">
            {copied ? <FiCheck className="text-success" /> : <FiCopy />}{" "}
            {copied ? "הועתק" : "העתק קישור"}
          </button>
        </div>

        {link && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <FiLink /> קישור הצפייה והאישור של הלקוח:
            </p>
            <p
              dir="ltr"
              className="text-[11px] bg-gray-50 border border-gray-200 rounded-xl p-2 break-all select-all"
            >
              {link}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendQuoteModal;

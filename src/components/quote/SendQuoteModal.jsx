// חלונית שליחת ההצעה ללקוח.
//
// שני מסלולים:
//   מייל   — השרת שולח מייל עם PDF מצורף + קישור לאישור.
//   קישור  — השרת מחזיר קישור; הסוכן שולח בוואטסאפ / מעתיק.
// בשני המסלולים ההצעה עוברת ל"נשלחה ללקוח — בבדיקה".

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FiCopy, FiMail, FiX, FiLink, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { sendQuoteToCustomer, getQuoteShareLink } from "@/api/orders";
import { whatsappUrl } from "@/utils/whatsapp";

const errText = (err) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "object") return msg.he || msg.en;
  return msg || "שגיאה בשליחה";
};

const SendQuoteModal = ({ order, onClose, onSent }) => {
  // "הוכן ע"י" — הסוכן המחובר, שמקבל עותק של כל הצעה שנשלחת.
  const { agent } = useAuth();
  const agentEmail = agent?.email || "";
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

  const customerPhone = order?.mainCustomer?.phone || order?.user_info?.contact;

  const buildMessage = (url) =>
    `שלום${order?.mainCustomer?.name ? ` ${order.mainCustomer.name}` : ""},\n` +
    `מצורפת הצעת מחיר ${quoteNo} בסך ₪${Number(order?.total || 0).toLocaleString()}.\n` +
    `לצפייה ואישור: ${url}`;

  // באנדרואיד הכתובת מכוונת ל-WhatsApp Business; ראה utils/whatsapp.
  const waUrl = (url) => whatsappUrl(customerPhone, buildMessage(url));

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

  // mode: "link" — הקישור בלבד | "message" — ההודעה המלאה לוואטסאפ ביזנס
  const handleCopy = async (mode = "link") => {
    setError("");
    setNotice("");
    setBusy(mode === "message" ? "copyMsg" : "copy");
    try {
      const url = await ensureLink();
      const value = mode === "message" ? buildMessage(url) : url;
      try {
        // clipboard זמין רק ב-secure context (HTTPS/localhost). בטאבלט שמחובר
        // ל-IP פנימי ב-HTTP הוא לא קיים — ואז מציגים את הקישור לבחירה ידנית.
        if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
        await navigator.clipboard.writeText(value);
        setCopied(mode === "message" ? "message" : "link");
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
          {agentEmail && (
            <span className="block text-xs text-gray-500 mt-1">
              עותק יישלח אוטומטית גם אליך (<span dir="ltr">{agentEmail}</span>)
            </span>
          )}
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

        <button onClick={handleWhatsapp} disabled={!!busy} className="btn-secondary w-full mb-2">
          <FaWhatsapp className="text-green-600" />{" "}
          {busy === "wa" ? "פותח..." : "שליחה בוואטסאפ"}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* באייפון אי אפשר לכוון לוואטסאפ ביזנס — העתקת ההודעה היא הדרך
              להדביק אותה באפליקציה שהסוכן בוחר. */}
          <button
            onClick={() => handleCopy("message")}
            disabled={!!busy}
            className="btn-secondary"
          >
            {copied === "message" ? <FiCheck className="text-success" /> : <FiCopy />}{" "}
            {copied === "message" ? "הועתק" : "העתק הודעה"}
          </button>
          <button onClick={() => handleCopy("link")} disabled={!!busy} className="btn-secondary">
            {copied === "link" ? <FiCheck className="text-success" /> : <FiCopy />}{" "}
            {copied === "link" ? "הועתק" : "העתק קישור"}
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

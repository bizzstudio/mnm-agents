// שורת הפעולות של הצעת מחיר: הדפסה, קובץ PDF, שליחה ללקוח.
//
// מרוכז בקומפוננטה אחת כי אותן שלוש פעולות מופיעות גם במסך ההצעה וגם במסך
// "ההצעה נשמרה". ההדפסה עוברת דרך iframe (ולא חלון קופץ) — ראה
// utils/printDocument. אם ההדפסה נחסמה, נופלים להורדת PDF ומסבירים למשתמש.

import { useState } from "react";
import { FiPrinter, FiDownload, FiSend } from "react-icons/fi";
import { fetchQuoteHtml, downloadQuotePdf } from "@/api/orders";
import { printHtmlDocument } from "@/utils/printDocument";
import SendQuoteModal from "@/components/quote/SendQuoteModal";

const errText = (err) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "object") return msg.he || msg.en;
  return msg || "שגיאה";
};

const QuoteActions = ({ order, onQuoteChange }) => {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSend, setShowSend] = useState(false);

  const id = order?._id;
  const fileName = `הצעת-מחיר-${order?.invoice || String(id || "").slice(-6)}.pdf`;

  const handlePrint = async () => {
    setError("");
    setNotice("");
    setBusy("print");
    try {
      const html = await fetchQuoteHtml(id);
      try {
        await printHtmlDocument(html);
      } catch {
        // ההדפסה נחסמה (webview / דפדפן מוגבל) — מורידים קובץ להדפסה ידנית.
        await downloadQuotePdf(id, fileName);
        setNotice("לא ניתן לפתוח חלון הדפסה — הורד קובץ PDF שאפשר להדפיס");
      }
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy("");
    }
  };

  const handleDownload = async () => {
    setError("");
    setNotice("");
    setBusy("download");
    try {
      await downloadQuotePdf(id, fileName);
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={handlePrint} disabled={!!busy} className="btn-secondary text-sm px-2">
          <FiPrinter /> {busy === "print" ? "מכין..." : "הדפסה"}
        </button>
        <button onClick={handleDownload} disabled={!!busy} className="btn-secondary text-sm px-2">
          <FiDownload /> {busy === "download" ? "מכין..." : "קובץ PDF"}
        </button>
        <button
          onClick={() => setShowSend(true)}
          disabled={!!busy}
          className="btn-primary text-sm px-2"
        >
          <FiSend /> שליחה
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl bg-danger/10 text-danger-dark px-4 py-2.5 text-sm text-start">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 text-sm text-start">
          {notice}
        </div>
      )}

      {showSend && (
        <SendQuoteModal
          order={order}
          onClose={() => setShowSend(false)}
          onSent={onQuoteChange}
        />
      )}
    </>
  );
};

export default QuoteActions;

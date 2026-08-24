// pages/QuoteView.jsx
//
// דף הצעת המחיר של הלקוח — public route (בלי login), אימות דרך הטוקן ב-URL.
// זה הדף שעונה על "הרבה לפני החתימה הלקוח רוצה לראות אם המחירים מתאימים לו":
// הוא רואה את הפריטים והמחירים, יכול להדפיס / להוריד PDF, ומאשר או לא מאשר.
//
// אין כאן שום נתון פנימי — טווחי המחיר של הסוכן לא נשלחים לקצה הזה כלל
// (ראה publicQuoteView בבקאנד).

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiPrinter, FiDownload } from "react-icons/fi";
import {
    getQuoteByToken,
    respondToQuote,
    quotePrintUrl,
    quotePdfUrl,
} from "@/api/quotePublic";

const money = (n) =>
    `₪${Number(n || 0).toLocaleString("he-IL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const dateStr = (d) => {
    if (!d) return "";
    const x = new Date(d);
    return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

const errText = (err) => {
    const msg = err?.response?.data?.message;
    if (typeof msg === "object") return msg.he || msg.en;
    return msg || "שגיאה בטעינת ההצעה";
};

const QuoteView = () => {
    const { token } = useParams();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mode, setMode] = useState(""); // "" | approve | reject
    const [name, setName] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState("");

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        getQuoteByToken(token)
            .then((d) => {
                if (cancelled) return;
                setQuote(d);
                setName(d.responderName || "");
            })
            .catch((err) => !cancelled && setError(errText(err)))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [token]);

    const submit = async (decision) => {
        setError("");
        setSubmitting(true);
        try {
            const res = await respondToQuote(token, { decision, name, note });
            setQuote(res.quote);
            // alreadyResponded → התשובה נרשמה בפעם קודמת (רענון / לחיצה כפולה),
            // ואין להציג "תודה, נשלח לסוכן" כאילו זו תשובה חדשה.
            setDone(res.alreadyResponded ? "" : res.approval);
            setMode("");
        } catch (err) {
            setError(errText(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                טוען הצעת מחיר...
            </div>
        );

    if (error && !quote)
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow p-6 max-w-sm text-center">
                    <FiXCircle className="mx-auto text-red-500" size={44} />
                    <h1 className="text-lg font-bold mt-3 mb-1">לא ניתן להציג את ההצעה</h1>
                    <p className="text-sm text-gray-600">{error}</p>
                    <p className="text-xs text-gray-400 mt-3">
                        אם הקישור פג תוקף — פנה לסוכן שלך לקבלת קישור מעודכן.
                    </p>
                </div>
            </div>
        );

    const responded = quote.approval === "approved" || quote.approval === "rejected";
    const approved = quote.approval === "approved";

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-3" dir="rtl">
            <div className="max-w-2xl mx-auto">
                {/* כותרת */}
                <div className="bg-white rounded-2xl shadow-sm p-5 mb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-gray-500">{quote.company}</p>
                            <h1 className="text-xl font-bold text-gray-800">
                                הצעת מחיר {quote.number}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                לכבוד {quote.customerName || "—"}
                            </p>
                        </div>
                        <div className="text-end text-xs text-gray-500">
                            <p>תאריך: {dateStr(quote.createdAt)}</p>
                            <p>בתוקף עד: {dateStr(quote.validUntil)}</p>
                            {quote.agent?.name && <p className="mt-1">סוכן: {quote.agent.name}</p>}
                        </div>
                    </div>

                    {quote.expired && !responded && (
                        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 text-sm">
                            תוקף הקישור פג. אפשר לצפות במחירים, אך לאישור יש לפנות לסוכן.
                        </div>
                    )}
                </div>

                {/* פריטים */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="text-start p-3">פריט</th>
                                <th className="p-3 w-14">כמות</th>
                                <th className="p-3 w-24">מחיר</th>
                                <th className="p-3 w-24">סה"כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(quote.items || []).map((it, i) => (
                                <tr key={i} className="border-t border-gray-100">
                                    <td className="p-3">
                                        <span className="font-medium">{it.title}
                                        {it.vatFree && (
                                            <span className="text-[11px] text-amber-700"> *</span>
                                        )}</span>
                                    </td>
                                    <td className="p-3 text-center">{it.quantity}</td>
                                    <td className="p-3 text-center">{money(it.price)}</td>
                                    <td className="p-3 text-center font-semibold">
                                        {money(it.lineTotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="p-4 border-t border-gray-100">
                        {quote.discount > 0 && (
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">סכום ביניים</span>
                                <span>{money(quote.subTotal)}</span>
                            </div>
                        )}
                        {quote.discount > 0 && (
                            <div className="flex justify-between text-sm mb-1 text-red-600">
                                <span>הנחה</span>
                                <span>-{money(quote.discount)}</span>
                            </div>
                        )}
                        {quote.totalWithVat != null ? (
                            <>
                                <div className="flex justify-between text-sm mb-1 pt-2 border-t border-gray-100">
                                    <span className="text-gray-500">סה"כ לפני מע"מ</span>
                                    <span>{money(quote.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">מע"מ {quote.vatPercent}%</span>
                                    <span>{money(quote.vatAmount)}</span>
                                </div>
                                {quote.vatExemptAmount > 0 && (
                                    <div className="flex justify-between text-xs mb-1 text-gray-400">
                                        <span>מזה פטור ממע"מ</span>
                                        <span>{money(quote.vatExemptAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                    <span>סה"כ לתשלום</span>
                                    <span className="text-green-800">{money(quote.totalWithVat)}</span>
                                </div>
                                {quote.vatExemptAmount > 0 && (
                                    <p className="text-[11px] text-gray-400 mt-2">
                                        * פריטים המסומנים בכוכבית פטורים ממע"מ.
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                <span>סה"כ</span>
                                <span className="text-green-800">{money(quote.total)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {quote.note && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3 text-sm">
                        <span className="font-semibold">הערות: </span>
                        {quote.note}
                    </div>
                )}

                {/* הדפסה / קובץ */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <a
                        href={quotePrintUrl(token)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700"
                    >
                        <FiPrinter /> הדפסה
                    </a>
                    <a
                        href={quotePdfUrl(token, true)}
                        className="bg-white border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700"
                    >
                        <FiDownload /> הורדת PDF
                    </a>
                </div>

                {/* אישור / אי-אישור */}
                {responded ? (
                    <div
                        className={`rounded-2xl p-5 text-center border-2 ${
                            approved
                                ? "bg-green-50 border-green-500 text-green-800"
                                : "bg-red-50 border-red-500 text-red-800"
                        }`}
                    >
                        {approved ? (
                            <FiCheckCircle className="mx-auto" size={40} />
                        ) : (
                            <FiXCircle className="mx-auto" size={40} />
                        )}
                        <p className="font-bold text-lg mt-2">
                            {approved ? "ההצעה אושרה" : "ההצעה סומנה כלא מאושרת"}
                        </p>
                        <p className="text-sm mt-1">
                            {done
                                ? "תודה! התשובה נשלחה לסוכן."
                                : `נרשם ${dateStr(quote.respondedAt)}${quote.responderName ? ` · ${quote.responderName}` : ""}`}
                        </p>
                        {quote.responseNote && (
                            <p className="text-sm mt-1 text-gray-600">{quote.responseNote}</p>
                        )}
                        {approved && (
                            <p className="text-xs text-gray-600 mt-3">
                                הסוכן ייצור קשר להמשך התהליך והשלמת ההסכם.
                            </p>
                        )}
                    </div>
                ) : quote.expired ? null : (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <p className="font-bold text-gray-800 mb-1">האם המחירים מתאימים לך?</p>
                        <p className="text-sm text-gray-500 mb-4">
                            התשובה נשלחת ישירות לסוכן. אין בכך התחייבות לחתימה על הסכם.
                        </p>

                        {mode === "" ? (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setMode("approve")}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
                                >
                                    <FiCheckCircle /> מאשר את ההצעה
                                </button>
                                <button
                                    onClick={() => setMode("reject")}
                                    className="bg-white border border-red-300 text-red-700 rounded-xl py-3 font-bold flex items-center justify-center gap-2"
                                >
                                    <FiXCircle /> לא מאשר
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-sm font-semibold text-gray-700">שם מלא</span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="השם שלך"
                                        className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-700"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {mode === "approve" ? "הערה (אופציונלי)" : "מה לא מתאים? (אופציונלי)"}
                                    </span>
                                    <textarea
                                        rows={2}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 min-h-[70px] focus:outline-none focus:border-green-700"
                                        placeholder={
                                            mode === "approve"
                                                ? "לדוגמה: אפשר לתאם אספקה לשבוע הבא"
                                                : "לדוגמה: המחיר על שמן קנולה גבוה מדי"
                                        }
                                    />
                                </label>

                                {error && (
                                    <div className="rounded-xl bg-red-50 text-red-700 px-4 py-2.5 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => submit(mode)}
                                        disabled={submitting || !name.trim()}
                                        className={`rounded-xl py-3 font-bold text-white disabled:opacity-50 ${
                                            mode === "approve"
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-red-600 hover:bg-red-700"
                                        }`}
                                    >
                                        {submitting
                                            ? "שולח..."
                                            : mode === "approve"
                                                ? "שליחת אישור"
                                                : "שליחת אי-אישור"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMode("");
                                            setError("");
                                        }}
                                        disabled={submitting}
                                        className="rounded-xl py-3 font-bold bg-white border border-gray-200 text-gray-700"
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <p className="text-center text-[11px] text-gray-400 mt-4">
                    מסמך זה אינו חשבונית ואינו מהווה דרישת תשלום.
                </p>
            </div>
        </div>
    );
};

export default QuoteView;

import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiXCircle,
  FiRotateCcw,
  FiClock,
} from "react-icons/fi";
import dayjs from "dayjs";
import { getOrder, setQuoteApproval } from "@/api/orders";
import Loader from "@/components/common/Loader";
import ApprovalBadge from "@/components/quote/ApprovalBadge";
import PriceScale from "@/components/quote/PriceScale";
import QuoteActions from "@/components/quote/QuoteActions";
import { approvalOf, hasResponded, VAT_NOTE } from "@/utils/quoteStatus";
import { DEFAULT_PRODUCT_IMAGE, getPrimaryProductImageUrl } from "@/utils/productImage";

const errText = (err) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "object") return msg.he || msg.en;
  return msg || "שגיאה";
};

const EVENT_LABELS = {
  sent: "נשלחה ללקוח",
  viewed: "הלקוח פתח את ההצעה",
  approved: "אושרה",
  rejected: "לא אושרה",
  draft: "הוחזרה לטיוטה",
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showScales, setShowScales] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const fetchOrder = () =>
    getOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (key, fn) => {
    setError("");
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy("");
    }
  };

  // סימון ידני של תשובת הלקוח. note נשלח רק בדחייה.
  const handleApproval = (decision, note = "") =>
    runAction(decision, async () => {
      const res = await setQuoteApproval(id, decision, note);
      setOrder((prev) => (prev ? { ...prev, quote: res.quote } : prev));
      setRejectOpen(false);
      setRejectNote("");
    });

  const applyQuote = (quote) =>
    setOrder((prev) => (prev ? { ...prev, quote } : prev));

  if (loading) return <Loader />;
  if (!order)
    return (
      <div className="p-6 text-center">
        <p>הצעת המחיר לא נמצאה</p>
        <Link to="/orders" className="btn-secondary mt-4 inline-flex">חזרה</Link>
      </div>
    );

  const approval = approvalOf(order);
  const responded = hasResponded(approval);
  const q = order.quote || {};
  const events = [...(q.events || [])].reverse();

  return (
    <div className="px-4 sm:px-6 py-4 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/orders")}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
        >
          <FiArrowRight />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          הצעת מחיר #{order.invoice || order._id.slice(-6)}
        </h1>
        <ApprovalBadge approval={approval} className="ms-auto" />
      </div>

      {/* פעולות — הדפסה, קובץ, שליחה ללקוח */}
      <div className="card p-3 mb-3">
        <QuoteActions order={order} onQuoteChange={applyQuote} />

        {/* תשובת הלקוח — סימון ידני למי שענה בטלפון */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">
            {responded
              ? `תשובת הלקוח נרשמה ${q.respondedAt ? dayjs(q.respondedAt).format("DD/MM/YYYY HH:mm") : ""}${q.respondedBy?.startsWith("agent:") ? " (סומן ע\"י הסוכן)" : ""}`
              : "קיבלת תשובה בטלפון? סמן כאן:"}
          </p>
          {responded ? (
            <button
              onClick={() => handleApproval("reset")}
              disabled={!!busy}
              className="btn-secondary text-sm w-full"
            >
              <FiRotateCcw /> החזר ל"ממתין לאישור"
            </button>
          ) : rejectOpen ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="סיבת אי-האישור (אופציונלי) — לדוגמה: המחיר על שמן קנולה גבוה"
                className="field min-h-[70px] text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleApproval("reject", rejectNote)}
                  disabled={!!busy}
                  className="btn text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  <FiXCircle /> {busy === "reject" ? "שומר..." : "סמן כלא אושר"}
                </button>
                <button
                  onClick={() => {
                    setRejectOpen(false);
                    setRejectNote("");
                  }}
                  disabled={!!busy}
                  className="btn-secondary text-sm"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleApproval("approve")}
                disabled={!!busy}
                className="btn text-sm bg-green-600 text-white hover:bg-green-700"
              >
                <FiCheckCircle /> {busy === "approve" ? "שומר..." : "הלקוח אישר"}
              </button>
              <button
                onClick={() => setRejectOpen(true)}
                disabled={!!busy}
                className="btn text-sm bg-red-600 text-white hover:bg-red-700"
              >
                <FiXCircle /> לא אושר
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-danger/10 text-danger-dark px-4 py-2.5 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="card p-4 mb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">לקוח</p>
            <p className="font-semibold">{order.mainCustomer?.name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">תאריך</p>
            <p className="font-semibold">{dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">מצב מול הלקוח</p>
            <ApprovalBadge approval={approval} full />
          </div>
          <div>
            <p className="text-gray-500 text-xs">סכום</p>
            <p className="font-bold text-brand-dark">₪{order.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">סטטוס במערכת</p>
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-white text-xs"
              style={{ background: order.status?.color || "#6b7280" }}
            >
              {order.status?.heName || order.status?.name || "—"}
            </span>
          </div>
          {q.sentToEmail && (
            <div>
              <p className="text-gray-500 text-xs">נשלחה אל</p>
              <p className="font-semibold text-xs break-all" dir="ltr">{q.sentToEmail}</p>
            </div>
          )}
        </div>

        {q.responseNote && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">הערת הלקוח:</p>
            <p className="text-sm">{q.responseNote}</p>
          </div>
        )}

        {order.customer_note && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">הערה:</p>
            <p className="text-sm">{order.customer_note}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-gray-700">פריטים</h2>
        <button
          onClick={() => setShowScales((v) => !v)}
          className="text-xs font-semibold text-brand-dark underline"
        >
          {showScales ? "הסתר סקלות מחיר" : "הצג סקלות מחיר (פנימי)"}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {(order.cart || []).map((item, idx) => (
          <div key={idx} className="card p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                <img
                  src={getPrimaryProductImageUrl(item) || DEFAULT_PRODUCT_IMAGE}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">
                  {item.title?.he || item.title?.en || "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} × ₪{item.price?.toLocaleString() || 0}
                </p>
              </div>
              <p className="font-bold">
                ₪{((item.price || 0) * (item.quantity || 0)).toLocaleString()}
              </p>
            </div>

            {/* איזה מחיר נבחר מתוך הטווח המותר — לעיני הסוכן בלבד */}
            {showScales && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                <PriceScale
                  price={item.price}
                  min={item.allowedMinPrice}
                  max={item.allowedMaxPrice}
                  pricingMode={item.pricingMode}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <div className="flex justify-between mb-1 text-sm">
          <span>סכום ביניים</span>
          <span>₪{(order.subTotal || 0).toLocaleString()}</span>
        </div>
        {order.agentDiscountAmount > 0 && (
          <div className="flex justify-between mb-1 text-sm text-danger-dark">
            <span>הנחת סוכן ({order.agentDiscountPercent}%)</span>
            <span>-₪{order.agentDiscountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
          <span>סה"כ</span>
          <span className="text-brand-dark">₪{order.total.toLocaleString()}</span>
        </div>
        <p className="mt-2 text-center font-bold text-xs text-brand-dark bg-brand-superLight rounded-lg py-1.5">
          {VAT_NOTE}
        </p>
      </div>

      {/* יומן ההצעה — "איפה זה עומד מבחינת הלקוח" */}
      {events.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <FiClock /> מה קרה עם ההצעה
          </h2>
          <ul className="space-y-2">
            {events.map((ev, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 text-xs w-28 flex-shrink-0">
                  {dayjs(ev.at).format("DD/MM/YY HH:mm")}
                </span>
                <span className="flex-1">
                  <span className="font-semibold">
                    {EVENT_LABELS[ev.type] || ev.type}
                  </span>
                  {ev.note && <span className="text-gray-500"> — {ev.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;

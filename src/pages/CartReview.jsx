import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiTrash2, FiArrowRight, FiFileText, FiMinus, FiPlus, FiAlertTriangle } from "react-icons/fi";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createOrder } from "@/api/orders";
import { getCustomer } from "@/api/customers";
import QuantityInput from "@/components/common/QuantityInput";
import Empty from "@/components/common/Empty";
import PriceScale from "@/components/quote/PriceScale";
import { DEFAULT_PRODUCT_IMAGE, getPrimaryProductImageUrl } from "@/utils/productImage";
import { vatBreakdownForLines } from "@/utils/quoteStatus";
import { OUT_OF_RANGE_LABELS, outOfRangeOf } from "@/utils/priceTiers";

const PRICE_STEP = 0.1;
const round2 = (n) => Math.round(Number(n) * 100) / 100;

const CartReview = () => {
  const navigate = useNavigate();
  const { agent } = useAuth();
  const {
    cart,
    activeMainCustomerId,
    totals,
    updateQuantity,
    updateLinePrice,
    removeItem,
    setNote,
    setPriceApprovalNote,
    setPriceTier,
    clear,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // סל ששמור מלפני שהקטלוג רשם בו את המחירון (למשל טיוטה מלפני העדכון) —
  // שולפים את קבוצת הלקוח כדי שהודעת האישור המוסדי תוצג נכון.
  useEffect(() => {
    if (!activeMainCustomerId || cart.priceTier) return;
    let alive = true;
    getCustomer(activeMainCustomerId)
      .then((c) => {
        if (alive) setPriceTier(activeMainCustomerId, c?.agentPriceTier || "small");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainCustomerId, cart.priceTier]);

  // סכומי העגלה הם לפני מע"מ; מוצג פירוט כדי שהסוכן יראה את הסכום הסופי.
  const vat = vatBreakdownForLines(cart.items, totals.total, agent?.vatPercent);

  // שורות שהמחיר שלהן מחוץ לטווח המחירון — ההצעה תעבור לאישור מחיר.
  const outOfRangeCount = cart.items.filter((i) =>
    outOfRangeOf(i.unitPrice, i.allowedMin, i.allowedMax)
  ).length;
  // הצעה ללקוח מוסדי עוברת אישור תמיד, גם כשכל המחירים בטווח.
  const isInstitutional = cart.priceTier === "institutional";
  const needsApproval = outOfRangeCount > 0 || isInstitutional;

  if (!activeMainCustomerId) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <Empty title="לא נבחר לקוח" description="עבור לבחירת לקוח לפני יצירת הצעת מחיר" />
        <Link to="/customers" className="btn-primary mt-4 inline-flex">
          לבחירת לקוח
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");
    if (cart.items.length === 0) {
      setError("הסל ריק");
      return;
    }
    if (cart.items.some((i) => !(Number(i.unitPrice) > 0))) {
      setError("יש שורה בלי מחיר. הזן מחיר גדול מ-0 לכל מוצר.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        mainCustomerId: activeMainCustomerId,
        cart: cart.items.map((i) => ({
          product: i.productId,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
        orderType: "quote",
        note: cart.note || undefined,
        priceApprovalNote: needsApproval ? cart.priceApprovalNote || undefined : undefined,
      };
      const res = await createOrder(payload);
      clear();
      navigate(`/confirmation/${res._id}`);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.lineErrors?.length) {
        const first = data.lineErrors[0];
        const range = first.allowedRange;
        const rangeStr = range
          ? ` (טווח מותר: ₪${range.min} - ₪${range.max})`
          : "";
        setError(
          `שגיאת מחירים: ${data.lineErrors.length} שורות.${rangeStr}`
        );
      } else {
        const msg = data?.message;
        setError(typeof msg === "object" ? msg.he || msg.en : msg || "שגיאה");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-4 max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-2 mb-3">
        <Link to="/catalog" className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
          <FiArrowRight />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">סיכום הצעת מחיר</h1>
      </div>

      {cart.items.length === 0 ? (
        <Empty title="הסל ריק" description="חזור לקטלוג כדי להוסיף מוצרים" />
      ) : (
        <div className="space-y-3">
          {cart.items.map((i) => {
            const title = i.title?.he || i.title?.en || "—";
            const lineTotal = round2(i.unitPrice * i.quantity);
            const hasRange = i.allowedMin !== i.allowedMax;
            const outOfRange = outOfRangeOf(i.unitPrice, i.allowedMin, i.allowedMax);

            return (
              <div
                key={i.productId}
                className={`card p-3 ${outOfRange ? "border-amber-300 bg-amber-50/40" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                    <img
                      src={getPrimaryProductImageUrl(i) || DEFAULT_PRODUCT_IMAGE}
                      alt={title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-brand-dark font-bold text-base">
                        ₪{i.unitPrice.toLocaleString()}
                      </span>
                      {(hasRange || outOfRange) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                          {hasRange ? `טווח: ₪${i.allowedMin} – ₪${i.allowedMax}` : `מחיר: ₪${i.allowedMin}`}
                        </span>
                      )}
                      {outOfRange && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-xs font-bold">
                          <FiAlertTriangle size={12} /> {OUT_OF_RANGE_LABELS[outOfRange]}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(i.productId)}
                    className="p-2 text-danger hover:bg-danger/10 rounded-xl self-start"
                    aria-label="מחק"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">כמות</p>
                    <QuantityInput
                      value={i.quantity}
                      onChange={(v) => updateQuantity(i.productId, v)}
                    />
                  </div>

                  {hasRange && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">מחיר ליחידה</p>
                      <div className="inline-flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden h-11">
                        <button
                          type="button"
                          onClick={() =>
                            updateLinePrice(
                              i.productId,
                              Math.max(PRICE_STEP, i.unitPrice - PRICE_STEP)
                            )
                          }
                          aria-label="הפחת מחיר"
                          className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          <FiMinus />
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          step={PRICE_STEP}
                          min={0}
                          value={i.unitPrice}
                          onChange={(e) => updateLinePrice(i.productId, e.target.value)}
                          onClick={(e) => e.currentTarget.select()}
                          className="w-20 h-full text-center font-bold text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateLinePrice(i.productId, i.unitPrice + PRICE_STEP)
                          }
                          aria-label="הוסף מחיר"
                          className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="ms-auto text-end">
                    <p className="text-xs text-gray-500">סה"כ שורה</p>
                    <p className="font-bold text-lg">₪{lineTotal.toLocaleString()}</p>
                  </div>
                </div>

                {/* איפה המחיר שנבחר יושב בטווח המותר — תצוגה פנימית לסוכן */}
                {hasRange && !outOfRange && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                    <PriceScale
                      price={i.unitPrice}
                      min={i.allowedMin}
                      max={i.allowedMax}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="card p-4">
            <label className="block">
              <span className="font-semibold text-gray-700">הערה ללקוח / להצעת המחיר</span>
              <textarea
                value={cart.note || ""}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="field mt-1 min-h-[80px]"
                placeholder="לדוגמה: לאסוף מהמחסן ביום שלישי"
              />
            </label>
          </div>

          <div className="card p-4 bg-brand-superLight border-brand/20">
            <div className="flex justify-between text-sm border-t border-brand/20 pt-2 mt-2">
              <span className="text-gray-600">סה"כ לפני מע"מ</span>
              <span>₪{vat.base.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">מע"מ {vat.percent}%</span>
              <span>₪{vat.vat.toLocaleString()}</span>
            </div>
            {vat.hasExempt && (
              <p className="text-[11px] text-gray-500 mt-1">
                ₪{vat.exemptBase.toLocaleString()} פטורים ממע"מ (פירות וירקות)
              </p>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-brand/20 pt-2 mt-2">
              <span>סה"כ לתשלום</span>
              <span className="text-brand-dark">₪{vat.total.toLocaleString()}</span>
            </div>
          </div>

          {needsApproval && (
            <div className="card p-4 border-amber-300 bg-amber-50">
              <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
                <FiAlertTriangle className="mt-0.5 shrink-0" />
                <span>
                  {isInstitutional && "הצעה ללקוח מוסדי עוברת אישור של המשרד. "}
                  {outOfRangeCount === 1 && "שורה אחת מחוץ לטווח המחירון ותאושר בנפרד. "}
                  {outOfRangeCount > 1 &&
                    `${outOfRangeCount} שורות מחוץ לטווח המחירון, וכל אחת תאושר בנפרד. `}
                  תוכל לשלוח את ההצעה ללקוח רק אחרי שתאושר.
                </span>
              </p>
              <label className="block mt-3">
                <span className="text-sm text-amber-900">הסבר למאשר (מומלץ)</span>
                <textarea
                  value={cart.priceApprovalNote || ""}
                  onChange={(e) => setPriceApprovalNote(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="field mt-1 min-h-[70px] bg-white"
                  placeholder="לדוגמה: לקוח מוסדי גדול, מתחרה מציע 5% פחות"
                />
              </label>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-danger/10 text-danger-dark px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`btn-primary w-full ${needsApproval ? "bg-amber-600 hover:bg-amber-700" : ""}`}
            >
              <FiFileText />{" "}
              {submitting
                ? "שומר..."
                : needsApproval
                  ? "שמור והעבר לאישור"
                  : "שמור כהצעת מחיר"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartReview;

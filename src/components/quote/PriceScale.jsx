// סקלת המחיר של השורה — תצוגה *פנימית לסוכן בלבד*.
//
// מציגה איזה מחיר נבחר מתוך הטווח המותר (מינימום–מקסימום) שנשמר בשורת ההצעה
// בזמן היצירה (allowedMinPrice / allowedMaxPrice). אלה מחירי המערכת ואינם
// מופיעים במסמך שנשלח ללקוח — ראה quoteDocumentService בבקאנד.

const round2 = (n) => Math.round(Number(n) * 100) / 100;

const isNum = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));

const PriceScale = ({ price, min, max, pricingMode }) => {
  // הצעות שנוצרו לפני שהטווח נשמר בשורה — אין מה להציג, ואסור להציג "מחיר
  // קבוע" כי זו קביעה שגויה לגביהן.
  if (!isNum(min) || !isNum(max)) {
    return <p className="text-xs text-gray-400">טווח המחיר לא נשמר בהצעה זו</p>;
  }

  if (round2(max) <= round2(min)) {
    return (
      <p className="text-xs text-gray-500">
        מחיר קבוע{pricingMode ? ` (${pricingMode === "list" ? "מחירון" : "ללא טווח"})` : ""}
      </p>
    );
  }

  const lo = round2(min);
  const hi = round2(max);
  const chosen = Math.min(Math.max(round2(price), lo), hi);
  const pct = ((chosen - lo) / (hi - lo)) * 100;

  // איפה המחיר יושב בטווח — מנוסח כמו שסוכן חושב עליו.
  const position =
    pct <= 5 ? "מינימום" : pct >= 95 ? "מקסימום" : `${Math.round(pct)}% מהטווח`;

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
        <span>מינ׳ ₪{lo}</span>
        <span className="font-bold text-gray-700">
          נבחר ₪{chosen} · {position}
        </span>
        <span>מקס׳ ₪{hi}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-gradient-to-l from-green-300 via-amber-300 to-red-300">
        <span
          className="absolute -top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-700 shadow"
          style={{ insetInlineStart: `calc(${pct}% - 7px)` }}
          aria-hidden
        />
      </div>
    </div>
  );
};

export default PriceScale;

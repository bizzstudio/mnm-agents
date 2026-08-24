import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import dayjs from "dayjs";
import { listOrders } from "@/api/orders";
import Loader from "@/components/common/Loader";
import Empty from "@/components/common/Empty";
import ApprovalBadge from "@/components/quote/ApprovalBadge";
import { approvalOf } from "@/utils/quoteStatus";

// סינון לפי מה שהלקוח עשה עם ההצעה. "בבדיקה" מאגד sent+viewed — מבחינת
// הסוכן שני המצבים זהים: ההצעה אצל הלקוח וממתינה לתשובה.
const FILTERS = [
  { key: "", label: "הכל" },
  { key: "sent,viewed", label: "בבדיקה" },
  { key: "approved", label: "אושרו" },
  { key: "rejected", label: "לא אושרו" },
  { key: "draft", label: "טרם נשלחו" },
];

const MyOrders = () => {
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    listOrders({ type: "quote", limit: 50, ...(filter ? { approval: filter } : {}) })
      .then(setData)
      .catch(() => setData({ data: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-3">הצעות המחיר שלי</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition ${
              filter === f.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : (data.data || []).length === 0 ? (
        <Empty
          title="אין הצעות מחיר להצגה"
          description={filter ? "נסה סינון אחר" : "עבור לקטלוג כדי ליצור הצעת מחיר ראשונה"}
        />
      ) : (
        <div className="space-y-2">
          {data.data.map((o) => (
            <Link
              key={o._id}
              to={`/orders/${o._id}`}
              className="card p-4 flex items-center gap-3 hover:border-brand transition"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white bg-orange-400">
                <FiFileText />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {o.mainCustomer?.name || "—"}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{dayjs(o.createdAt).format("DD/MM/YYYY HH:mm")}</span>
                  <ApprovalBadge approval={approvalOf(o)} />
                  <span>#{o.invoice || o._id.slice(-6)}</span>
                </div>
              </div>
              <div className="text-end">
                {/* הסכום השמור הוא לפני מע"מ (כמו בכל הדוחות והיעדים). מציינים
                    זאת כדי שלא ייראה כסתירה מול "סה"כ לתשלום" במסך ההצעה. */}
                <p className="font-bold text-brand-dark">
                  ₪{(o.total || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">לפני מע"מ</p>
                <p className="text-xs text-gray-400">{o.cart?.length || 0} פריטים</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;

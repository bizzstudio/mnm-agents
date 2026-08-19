import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import dayjs from "dayjs";
import { listOrders } from "@/api/orders";
import Loader from "@/components/common/Loader";
import Empty from "@/components/common/Empty";

const MyOrders = () => {
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listOrders({ type: "quote", limit: 50 })
      .then(setData)
      .catch(() => setData({ data: [], total: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">הצעות המחיר שלי</h1>

      {loading ? (
        <Loader />
      ) : (data.data || []).length === 0 ? (
        <Empty title="אין הצעות מחיר עדיין" description="עבור לקטלוג כדי ליצור הצעת מחיר ראשונה" />
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
                  {o.status?.heName && (
                    <span
                      className="px-2 py-0.5 rounded-full text-white text-[10px]"
                      style={{ background: o.status.color || "#6b7280" }}
                    >
                      {o.status.heName}
                    </span>
                  )}
                  <span>הצעת מחיר</span>
                </div>
              </div>
              <div className="text-end">
                <p className="font-bold text-brand-dark">
                  ₪{(o.total || 0).toLocaleString()}
                </p>
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

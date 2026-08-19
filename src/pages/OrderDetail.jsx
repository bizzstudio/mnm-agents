import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import dayjs from "dayjs";
import { getOrder } from "@/api/orders";
import Loader from "@/components/common/Loader";
import { DEFAULT_PRODUCT_IMAGE, getPrimaryProductImageUrl } from "@/utils/productImage";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Loader />;
  if (!order)
    return (
      <div className="p-6 text-center">
        <p>הצעת המחיר לא נמצאה</p>
        <Link to="/orders" className="btn-secondary mt-4 inline-flex">חזרה</Link>
      </div>
    );

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
            <p className="text-gray-500 text-xs">סטטוס</p>
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-white text-xs"
              style={{ background: order.status?.color || "#6b7280" }}
            >
              {order.status?.heName || order.status?.name || "—"}
            </span>
          </div>
          <div>
            <p className="text-gray-500 text-xs">סכום</p>
            <p className="font-bold text-brand-dark">₪{order.total.toLocaleString()}</p>
          </div>
        </div>
        {order.customer_note && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">הערה:</p>
            <p className="text-sm">{order.customer_note}</p>
          </div>
        )}
      </div>

      <h2 className="font-bold text-gray-700 mb-2">פריטים</h2>
      <div className="space-y-2 mb-4">
        {(order.cart || []).map((item, idx) => (
          <div key={idx} className="card p-3 flex items-center gap-3">
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
      </div>
    </div>
  );
};

export default OrderDetail;

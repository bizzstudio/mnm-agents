import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCheckCircle, FiHome, FiList } from "react-icons/fi";
import { getOrder } from "@/api/orders";
import Loader from "@/components/common/Loader";

const Confirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!order)
    return (
      <div className="p-6 text-center">
        <p>ההזמנה לא נמצאה</p>
        <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">חזרה לדשבורד</Link>
      </div>
    );

  const isQuote = order.orderType === "quote";

  return (
    <div className="px-4 sm:px-6 py-8 max-w-lg mx-auto text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
        <FiCheckCircle size={48} />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {isQuote ? "הצעת המחיר נשמרה!" : "ההזמנה נשלחה!"}
      </h1>
      <p className="text-gray-500 mb-1">
        {isQuote
          ? "הצעת המחיר זמינה לצפייה ולהמרה להזמנה"
          : "ההזמנה התקבלה במשרד לאישור וטיפול"}
      </p>
      <p className="text-sm text-gray-400 mb-6">מספר חשבונית: {order.invoice || "—"}</p>

      <div className="card p-4 text-start mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">סכום:</span>
          <span className="font-bold">₪{order.total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">פריטים:</span>
          <span>{order.cart?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">סטטוס:</span>
          <span>{order.status?.heName || order.status?.name || "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/orders" className="btn-secondary">
          <FiList /> כל ההזמנות
        </Link>
        <Link to="/dashboard" className="btn-primary">
          <FiHome /> חזרה לדשבורד
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;

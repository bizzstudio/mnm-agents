import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCheckCircle, FiHome, FiList } from "react-icons/fi";
import { getOrder } from "@/api/orders";
import Loader from "@/components/common/Loader";
import ApprovalBadge from "@/components/quote/ApprovalBadge";
import QuoteActions from "@/components/quote/QuoteActions";
import { approvalOf, quoteNumberOf } from "@/utils/quoteStatus";

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
        <p>הצעת המחיר לא נמצאה</p>
        <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">חזרה לדשבורד</Link>
      </div>
    );

  const quoteNo = quoteNumberOf(order);

  return (
    <div className="px-4 sm:px-6 py-8 max-w-lg mx-auto text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
        <FiCheckCircle size={48} />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">הצעת המחיר נשמרה!</h1>
      <p className="text-gray-500 mb-1">אפשר להדפיס אותה, לשמור כקובץ או לשלוח ללקוח לאישור</p>
      <p className="text-sm text-gray-400 mb-6">מספר הצעה: {quoteNo}</p>

      <div className="card p-4 text-start mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">סכום:</span>
          <span className="font-bold">₪{order.total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">פריטים:</span>
          <span>{order.cart?.length || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">מצב מול הלקוח:</span>
          <ApprovalBadge approval={approvalOf(order)} full />
        </div>
      </div>

      <div className="mb-4">
        <QuoteActions
          order={order}
          onQuoteChange={(quote) => setOrder((prev) => (prev ? { ...prev, quote } : prev))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to={`/orders/${id}`} className="btn-secondary">
          <FiList /> פרטי ההצעה
        </Link>
        <Link to="/dashboard" className="btn-primary">
          <FiHome /> לדשבורד
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;

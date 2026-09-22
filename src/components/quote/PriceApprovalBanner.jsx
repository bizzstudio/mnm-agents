// מצב אישור המחיר הפנימי של ההצעה: ממתינה / אושרה / לא אושרה.
// לא מוצג כלל להצעה שכל מחיריה בטווח (priceApproval חסר או "none").

import dayjs from "dayjs";
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { PRICE_APPROVAL, priceApprovalOf } from "@/utils/priceTiers";

const ICONS = {
  pending: FiAlertTriangle,
  approved: FiCheckCircle,
  rejected: FiXCircle,
};

const PriceApprovalBanner = ({ order, className = "" }) => {
  const status = priceApprovalOf(order);
  const meta = PRICE_APPROVAL[status];
  if (!meta) return null;

  const pa = order.priceApproval || {};
  const Icon = ICONS[status];

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm text-start ${meta.box} ${className}`}>
      <p className="flex items-center gap-2 font-bold">
        <Icon className="shrink-0" /> {meta.label}
      </p>
      {meta.text && <p className="mt-1">{meta.text}</p>}
      {status !== "pending" && (pa.decidedByName || pa.decidedAt) && (
        <p className="mt-1 text-xs opacity-80">
          {pa.decidedByName}
          {pa.decidedAt ? ` · ${dayjs(pa.decidedAt).format("DD/MM/YYYY HH:mm")}` : ""}
        </p>
      )}
      {pa.decisionNote && <p className="mt-1">הערת המאשר: {pa.decisionNote}</p>}
    </div>
  );
};

export default PriceApprovalBanner;

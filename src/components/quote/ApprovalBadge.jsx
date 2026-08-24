// תג מצב הצעת המחיר מול הלקוח: טרם נשלחה / בבדיקה / נצפתה / אושר / לא אושר.
import { approvalMeta } from "@/utils/quoteStatus";

const ApprovalBadge = ({ approval, full = false, className = "" }) => {
  const meta = approvalMeta(approval);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${meta.bg} ${meta.text} ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: meta.color }}
        aria-hidden
      />
      {full ? meta.label : meta.short}
    </span>
  );
};

export default ApprovalBadge;

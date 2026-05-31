import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { getCustomer, updateCustomer } from "@/api/customers";
import Loader from "@/components/common/Loader";

const EditCustomerModal = ({ customerId, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyNumber: "",
    customerType: "regular",
    contactFirstName: "",
    contactLastName: "",
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const c = await getCustomer(customerId);
        if (!alive) return;
        const root = (c.subCustomers && c.subCustomers[0]) || {};
        setForm({
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          companyNumber: c.companyNumber || "",
          customerType: c.customerType || "regular",
          contactFirstName: root.name || "",
          contactLastName: root.lastName || "",
        });
      } catch (err) {
        if (!alive) return;
        const msg = err?.response?.data?.message;
        setError(typeof msg === "object" ? msg.he || msg.en : msg || "שגיאה בטעינת הלקוח");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [customerId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("שם ואימייל חובה");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await updateCustomer(customerId, form);
      onSaved?.(updated);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === "object" ? msg.he || msg.en : msg || "שגיאה בעדכון הלקוח");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">עריכת לקוח</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            aria-label="סגור"
          >
            <FiX />
          </button>
        </div>

        {loading ? (
          <div className="p-8">
            <Loader />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">שם החברה / לקוח *</span>
                <input className="field mt-1" value={form.name} onChange={set("name")} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">אימייל *</span>
                <input
                  type="email"
                  className="field mt-1"
                  value={form.email}
                  onChange={set("email")}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">טלפון</span>
                <input
                  type="tel"
                  className="field mt-1"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">ח.פ. / ע.מ.</span>
                <input
                  className="field mt-1"
                  value={form.companyNumber}
                  onChange={set("companyNumber")}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">סוג לקוח</span>
                <select
                  className="field mt-1"
                  value={form.customerType}
                  onChange={set("customerType")}
                >
                  <option value="casual">חד-פעמי</option>
                  <option value="regular">קבוע</option>
                  <option value="business">עסק</option>
                  <option value="institutional">מוסד</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">שם איש קשר</span>
                <input
                  className="field mt-1"
                  value={form.contactFirstName}
                  onChange={set("contactFirstName")}
                  placeholder="פרטי"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">שם משפחה</span>
                <input
                  className="field mt-1"
                  value={form.contactLastName}
                  onChange={set("contactLastName")}
                />
              </label>
            </div>

            {error && (
              <div className="rounded-xl bg-danger/10 text-danger-dark px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? "שומר..." : "שמירה"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-5"
                disabled={submitting}
              >
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditCustomerModal;

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiSend } from "react-icons/fi";
import { createCustomer } from "@/api/customers";
import { sendContract } from "@/api/contracts";
import { useCart } from "@/context/CartContext";

const NewCustomer = () => {
  const { switchCustomer } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyNumber: "",
    customerType: "regular",
    contactFirstName: "",
    contactLastName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // הלקוח שנוצר — מוצג מסך סיום עם כפתור לשליחת ההסכם.
  // ההסכם *אינו* נשלח אוטומטית: השליחה היא החלטה מפורשת של הסוכן.
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const [sendingContract, setSendingContract] = useState(false);
  const [contractNotice, setContractNotice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email) {
      setError("שם ואימייל חובה");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createCustomer(form);
      switchCustomer(created._id);
      setCreatedCustomer(created);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === "object" ? msg.he || msg.en : msg || "שגיאה ביצירת לקוח");
    } finally {
      setSubmitting(false);
    }
  };

  // שליחת ההסכם ביוזמת הסוכן. כישלון כאן אינו פוגע בלקוח שכבר נוצר.
  const handleSendContract = async () => {
    if (!createdCustomer?._id) return;
    setSendingContract(true);
    setContractNotice("");
    try {
      const r = await sendContract(createdCustomer._id, false);
      setContractNotice(
        r.created
          ? `ההסכם נשלח ללקוח${r.sentToEmail ? ` (${r.sentToEmail})` : ""}`
          : `כבר קיים הסכם פעיל ללקוח${r.status ? ` (${r.status})` : ""}`
      );
    } catch (err) {
      const msg = err?.response?.data?.message;
      setContractNotice(
        `שליחת ההסכם נכשלה: ${typeof msg === "object" ? msg.he || msg.en : msg || "שגיאה"}`
      );
    } finally {
      setSendingContract(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // אחרי היצירה: מסך סיום עם שליחת ההסכם כפעולה נפרדת ומפורשת.
  if (createdCustomer) {
    return (
      <div className="px-4 sm:px-6 py-5 max-w-2xl mx-auto">
        <div className="card p-5 text-center">
          <FiCheckCircle className="mx-auto text-4xl text-success mb-3" />
          <h1 className="text-xl font-bold text-gray-800 mb-1">הלקוח נוצר</h1>
          <p className="text-gray-500 text-sm mb-5">{createdCustomer.name}</p>

          <button
            onClick={handleSendContract}
            disabled={sendingContract}
            className="btn-primary w-full mb-2"
          >
            <FiSend /> {sendingContract ? "שולח..." : "שלח הסכם לחתימה"}
          </button>
          <p className="text-xs text-gray-400 mb-4">
            יישלח ללקוח מייל עם קישור לחתימה דיגיטלית
          </p>

          {contractNotice && (
            <div className="rounded-xl bg-blue-50 text-blue-800 px-4 py-3 text-sm mb-4 text-start">
              {contractNotice}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate("/catalog")} className="btn-primary">
              המשך לקטלוג
            </button>
            <Link to="/customers" className="btn-secondary justify-center">
              לרשימת הלקוחות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/customers"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
          aria-label="חזרה"
        >
          <FiArrowRight />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">לקוח חדש</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
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
            <input className="field mt-1" value={form.companyNumber} onChange={set("companyNumber")} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">סוג לקוח</span>
            <select className="field mt-1" value={form.customerType} onChange={set("customerType")}>
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

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "שומר..." : "יצירת לקוח"}
        </button>
      </form>
    </div>
  );
};

export default NewCustomer;

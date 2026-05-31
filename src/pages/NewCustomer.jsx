import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
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
  const [sendContractOnCreate, setSendContractOnCreate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contractNotice, setContractNotice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setContractNotice("");
    if (!form.name || !form.email) {
      setError("שם ואימייל חובה");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createCustomer(form);
      switchCustomer(created._id);

      // שליחת הסכם — הכשלה כאן לא הופכת את היצירה ללא תקפה.
      if (sendContractOnCreate) {
        try {
          const r = await sendContract(created._id, false);
          setContractNotice(`הסכם נשלח ללקוח (${r.sentToEmail})`);
        } catch (contractErr) {
          const msg = contractErr?.response?.data?.message || "";
          setContractNotice(`לקוח נוצר, אך שליחת ההסכם נכשלה: ${msg}`);
        }
      }

      navigate("/catalog");
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === "object" ? msg.he || msg.en : msg || "שגיאה ביצירת לקוח");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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

        <label className="flex items-start gap-2 text-sm cursor-pointer pt-2 border-t border-gray-100">
          <input
            type="checkbox"
            checked={sendContractOnCreate}
            onChange={(e) => setSendContractOnCreate(e.target.checked)}
            className="mt-1"
          />
          <span className="text-gray-700">
            שלח ללקוח הסכם דיגיטלי לחתימה (יישלח אליו מייל עם לינק לחתימה).
          </span>
        </label>

        {error && (
          <div className="rounded-xl bg-danger/10 text-danger-dark px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {contractNotice && (
          <div className="rounded-xl bg-blue-50 text-blue-800 px-4 py-3 text-sm">
            {contractNotice}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "שומר..." : "יצירה והמשך לקטלוג"}
        </button>
      </form>
    </div>
  );
};

export default NewCustomer;

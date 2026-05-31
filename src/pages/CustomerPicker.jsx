import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiUser, FiPlus, FiCheck, FiFileText, FiEdit2, FiTrash2 } from "react-icons/fi";
import { listCustomers, deleteCustomer } from "@/api/customers";
import { sendContract, openContractInPerson } from "@/api/contracts";
import { useCart } from "@/context/CartContext";
import Loader from "@/components/common/Loader";
import Empty from "@/components/common/Empty";
import EditCustomerModal from "@/components/customer/EditCustomerModal";

const CustomerPicker = () => {
  const navigate = useNavigate();
  const { switchCustomer, activeMainCustomerId } = useCart();

  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingFor, setSendingFor] = useState(null); // customer id
  const [deletingFor, setDeletingFor] = useState(null); // customer id
  const [editingId, setEditingId] = useState(null); // customer id being edited
  const [contractMenuFor, setContractMenuFor] = useState(null); // customer id whose contract menu is open
  const [feedback, setFeedback] = useState(null); // {id, type, message}

  const fetchCustomers = useCallback(async (q) => {
    setLoading(true);
    try {
      const data = await listCustomers(q || "");
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(submitted);
  }, [fetchCustomers, submitted]);

  const handleSelect = (mainCustomerId) => {
    switchCustomer(mainCustomerId);
    navigate("/catalog");
  };

  const handleSendByEmail = async (e, mainCustomerId) => {
    e.stopPropagation();
    setContractMenuFor(null);
    setSendingFor(mainCustomerId);
    setFeedback(null);
    try {
      const r = await sendContract(mainCustomerId, false);
      const msg = r.created
        ? `נשלח ללקוח (${r.sentToEmail})`
        : `כבר נשלח הסכם פעיל (${r.status})`;
      setFeedback({ id: mainCustomerId, type: "success", message: msg });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "שגיאה בשליחת ההסכם";
      setFeedback({ id: mainCustomerId, type: "error", message: msg });
    } finally {
      setSendingFor(null);
    }
  };

  // "מלא עכשיו במקום" — יוצר הסכם בלי לשלוח מייל ופותח את דף החתימה במכשיר
  // הסוכן. הלקוח חותם בטלפון של הסוכן. אם יש כבר הסכם פתוח — משתמש בו.
  const handleFillNow = async (e, mainCustomerId) => {
    e.stopPropagation();
    setContractMenuFor(null);
    setSendingFor(mainCustomerId);
    setFeedback(null);
    try {
      const r = await openContractInPerson(mainCustomerId, false);
      if (!r.customerToken) {
        // אם אין token — סימן שההסכם כבר ב-AwaitingAgent / Signed, לא ניתן למלא שוב כלקוח.
        setFeedback({
          id: mainCustomerId,
          type: "error",
          message: `לא ניתן לפתוח עכשיו — סטטוס: ${r.status}`,
        });
        return;
      }
      window.open(
        `${window.location.origin}/sign-contract/${encodeURIComponent(r.customerToken)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      const msg = err?.response?.data?.message || "שגיאה בפתיחת ההסכם";
      setFeedback({ id: mainCustomerId, type: "error", message: msg });
    } finally {
      setSendingFor(null);
    }
  };

  const toggleContractMenu = (e, mainCustomerId) => {
    e.stopPropagation();
    setContractMenuFor((cur) => (cur === mainCustomerId ? null : mainCustomerId));
  };

  const handleEdit = (e, mainCustomerId) => {
    e.stopPropagation();
    setFeedback(null);
    setEditingId(mainCustomerId);
  };

  const handleEditSaved = (updated) => {
    setEditingId(null);
    setFeedback({
      id: updated?._id,
      type: "success",
      message: "הלקוח עודכן",
    });
    fetchCustomers(submitted);
  };

  const handleDelete = async (e, customer) => {
    e.stopPropagation();
    const ok = window.confirm(`למחוק את הלקוח "${customer.name}"? פעולה זו אינה הפיכה.`);
    if (!ok) return;

    setDeletingFor(customer._id);
    setFeedback(null);
    try {
      await deleteCustomer(customer._id);

      if (String(activeMainCustomerId || "") === String(customer._id)) {
        switchCustomer(null);
      }

      setFeedback({ id: customer._id, type: "success", message: "הלקוח נמחק" });
      fetchCustomers(submitted);
    } catch (err) {
      const msg = err?.response?.data?.message;
      const text =
        typeof msg === "object" ? msg.he || msg.en : msg || "שגיאה במחיקת הלקוח";
      setFeedback({ id: customer._id, type: "error", message: text });
    } finally {
      setDeletingFor(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h1 className="text-xl font-bold text-gray-800">בחירת לקוח</h1>
        <Link to="/customers/new" className="btn-secondary px-4 py-2 text-sm sm:text-base">
          <FiPlus /> לקוח חדש
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(search.trim());
        }}
        className="mb-4"
      >
        <div className="relative">
          <FiSearch className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם / טלפון / מייל / ח.פ"
            className="field pe-10"
          />
        </div>
      </form>

      {loading ? (
        <Loader />
      ) : customers.length === 0 ? (
        <Empty title="לא נמצאו לקוחות" description="נסה חיפוש אחר או הוסף לקוח חדש" />
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const isActive = String(activeMainCustomerId || "") === String(c._id);
            const fb = feedback && feedback.id === c._id ? feedback : null;
            return (
              <div
                key={c._id}
                className={`card p-4 flex flex-col gap-2 hover:border-brand transition ${
                  isActive ? "ring-2 ring-brand border-brand" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelect(c._id)}
                    className="flex-1 flex items-center gap-3 text-start min-w-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-superLight text-brand flex items-center justify-center">
                      <FiUser size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{c.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap mt-1">
                        {c.phone && <span>{c.phone}</span>}
                        {c.email && <span>· {c.email}</span>}
                      </div>
                    </div>
                    {isActive && <FiCheck className="text-brand" size={22} />}
                  </button>
                  <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => toggleContractMenu(e, c._id)}
                        disabled={sendingFor === c._id}
                        className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                        title="פתיחת הסכם דיגיטלי"
                      >
                        <FiFileText />
                        {sendingFor === c._id ? "טוען..." : "הסכם"}
                      </button>
                      {contractMenuFor === c._id && (
                        <>
                          {/* רקע ללחיצה-מחוץ-לתפריט */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setContractMenuFor(null)}
                          />
                          <div className="absolute z-20 end-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-sm">
                            <button
                              type="button"
                              onClick={(e) => handleSendByEmail(e, c._id)}
                              className="block w-full text-start px-4 py-2.5 hover:bg-gray-50 text-gray-800"
                            >
                              📧 שלח למייל הלקוח
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleFillNow(e, c._id)}
                              className="block w-full text-start px-4 py-2.5 hover:bg-gray-50 text-gray-800 border-t border-gray-100"
                            >
                              ✍️ מלא עכשיו במקום
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleEdit(e, c._id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
                      title="עריכת לקוח"
                      aria-label="עריכת לקוח"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, c)}
                      disabled={deletingFor === c._id}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-50"
                      title="מחיקת לקוח"
                      aria-label="מחיקת לקוח"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                {fb && (
                  <div
                    className={`text-xs rounded px-2 py-1 ${
                      fb.type === "success"
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {fb.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingId && (
        <EditCustomerModal
          customerId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};

export default CustomerPicker;

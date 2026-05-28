import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiUser, FiPlus, FiCheck } from "react-icons/fi";
import { listCustomers } from "@/api/customers";
import { useCart } from "@/context/CartContext";
import Loader from "@/components/common/Loader";
import Empty from "@/components/common/Empty";

const CustomerPicker = () => {
  const navigate = useNavigate();
  const { switchCustomer, activeMainCustomerId } = useCart();

  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

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
            return (
              <button
                key={c._id}
                onClick={() => handleSelect(c._id)}
                className={`w-full card p-4 text-start flex items-center gap-3 hover:border-brand transition ${
                  isActive ? "ring-2 ring-brand border-brand" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-brand-superLight text-brand flex items-center justify-center">
                  <FiUser size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap mt-1">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span>· {c.email}</span>}
                    {c.priceList?.name && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        מחירון: {c.priceList.name}
                      </span>
                    )}
                  </div>
                </div>
                {isActive && <FiCheck className="text-brand" size={22} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerPicker;

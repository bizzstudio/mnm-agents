import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiShoppingCart, FiUser, FiPlus } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const Header = () => {
  const { agent, logout } = useAuth();
  const { totals, activeMainCustomerId } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 max-w-7xl mx-auto">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-brand min-w-0 shrink-0 sm:flex-1"
        >
          <FiUser size={22} className="shrink-0" />
          <span className="font-bold text-base sm:text-lg truncate">
            {agent?.name || "סוכן"}
          </span>
        </Link>

        {/* כפתור הצעת מחיר חדשה — קיצור דרך מהיר במובייל בלבד, ממורכז.
            mx-auto בתוך flex container מושך אותו למרכז.
            בדסקטופ/טאבלט יש את הכפתור הגדול בדשבורד. */}
        <Link
          to="/customers"
          aria-label="התחל הצעת מחיר חדשה"
          className="sm:hidden mx-auto flex items-center gap-1 px-3 py-2 rounded-xl bg-brand text-white text-xs font-semibold shrink-0"
        >
          <FiPlus size={16} />
          <span className="whitespace-nowrap">הצעה חדשה</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {activeMainCustomerId && (
            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-brand-superLight text-brand-dark font-semibold"
            >
              <FiShoppingCart size={18} />
              <span className="text-xs sm:text-sm whitespace-nowrap">
                ₪{(totals.total || 0).toLocaleString()}
              </span>
              {totals.count > 0 && (
                <span className="absolute -top-1 -end-1 bg-brand text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                  {totals.count}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-danger rounded-xl hover:bg-gray-100"
            aria-label="התנתקות"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

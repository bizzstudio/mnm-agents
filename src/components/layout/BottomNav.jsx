import { NavLink } from "react-router-dom";
import { FiHome, FiUsers, FiGrid, FiList } from "react-icons/fi";

const items = [
  { to: "/dashboard", label: "דשבורד", icon: FiHome },
  { to: "/customers", label: "לקוחות", icon: FiUsers },
  { to: "/catalog", label: "קטלוג", icon: FiGrid },
  { to: "/orders", label: "ההזמנות שלי", icon: FiList },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg safe-bottom z-30">
    <div className="grid grid-cols-4 gap-1 max-w-3xl mx-auto">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2.5 px-1 text-xs sm:text-sm font-medium gap-0.5 ${
              isActive ? "text-brand" : "text-gray-500"
            }`
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiFileText, FiBarChart2, FiEdit3 } from "react-icons/fi";
import { getDashboard } from "@/api/dashboard";
import { listPendingForAgent } from "@/api/contracts";
import Loader from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";

const KpiCard = ({ icon: Icon, label, value, hint, accent }) => (
  <div className="card p-4 flex items-start gap-3">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
        accent || "bg-brand"
      }`}
    >
      <Icon size={22} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold truncate">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  </div>
);

const TargetBar = ({ title, target, actual }) => {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const gap = target - actual;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <span className="text-xs text-gray-500">
          ₪{actual.toLocaleString()} מתוך ₪{target.toLocaleString()}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            pct >= 100 ? "bg-success" : pct >= 50 ? "bg-brand" : "bg-orange-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{pct.toFixed(0)}%</span>
        {target > 0 && gap > 0 && (
          <span>נותרו ₪{gap.toLocaleString()}</span>
        )}
        {target > 0 && gap <= 0 && (
          <span className="text-success font-semibold">היעד הושג!</span>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { agent } = useAuth();
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingContracts, setPendingContracts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboard(range)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  // ספירת הסכמים ממתינים — נטענת פעם אחת, לא תלויה ב-range.
  useEffect(() => {
    let cancelled = false;
    listPendingForAgent()
      .then((arr) => {
        if (!cancelled) setPendingContracts(Array.isArray(arr) ? arr.length : 0);
      })
      .catch(() => {
        if (!cancelled) setPendingContracts(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loader label="טוען דשבורד..." />;
  if (!data) return <div className="p-6 text-center text-gray-500">לא נטענו נתונים</div>;

  const k = data.kpis || {};
  const t = data.targets || {};

  return (
    <div className="px-4 sm:px-6 py-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
            שלום, {agent?.name}
          </h1>
          <p className="text-sm text-gray-500">סיכום ביצועים אישי</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="field max-w-[180px] shrink-0"
        >
          <option value="today">היום</option>
          <option value="week">השבוע</option>
          <option value="month">החודש</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KpiCard
          icon={FiFileText}
          label="הצעות מחיר"
          value={k.ordersCount || 0}
          accent="bg-orange-400"
        />
        <KpiCard
          icon={FiTrendingUp}
          label="סך הצעות מחיר"
          value={`₪${(k.ordersTotal || 0).toLocaleString()}`}
          accent="bg-success"
        />
        <KpiCard
          icon={FiBarChart2}
          label="ממוצע להצעה"
          value={`₪${Math.round(k.ordersAvg || 0).toLocaleString()}`}
          accent="bg-brand"
        />
      </div>

      {pendingContracts > 0 && (
        <Link
          to="/contracts/pending"
          className="block mb-6 card p-4 bg-amber-50 border-amber-300 hover:border-amber-500 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <FiEdit3 size={22} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-amber-900">
                {pendingContracts} {pendingContracts === 1 ? "הסכם ממתין" : "הסכמים ממתינים"} לחתימתך
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                הלקוח חתם — נדרשת החתימה שלך כדי להשלים את התהליך
              </div>
            </div>
          </div>
        </Link>
      )}

      <h2 className="text-lg font-bold text-gray-700 mb-2">יעדי מכירות</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <TargetBar title="יעד יומי" target={t.daily?.target || 0} actual={t.daily?.actual || 0} />
        <TargetBar title="יעד שבועי" target={t.weekly?.target || 0} actual={t.weekly?.actual || 0} />
        <TargetBar title="יעד חודשי" target={t.monthly?.target || 0} actual={t.monthly?.actual || 0} />
      </div>

      <h2 className="text-lg font-bold text-gray-700 mb-2">לקוחות מובילים</h2>
      <div className="card divide-y divide-gray-100">
        {(data.topCustomers || []).length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            אין נתונים עדיין — צרו הצעת מחיר ראשונה
          </div>
        ) : (
          (data.topCustomers || []).map((c) => (
            <div
              key={c._id}
              className="px-4 py-3 flex items-center justify-between"
            >
              <span className="font-semibold text-gray-800">{c.name || "—"}</span>
              <div className="flex flex-col items-end">
                <span className="text-brand-dark font-bold">
                  ₪{(c.totalSum || 0).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">{c.count} הצעות</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        <Link to="/customers" className="btn-primary flex-1 min-w-[150px]">
          הצעת מחיר חדשה
        </Link>
        <Link to="/orders" className="btn-secondary flex-1 min-w-[150px]">
          הצג היסטוריה
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

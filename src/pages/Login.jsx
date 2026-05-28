import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiPhone, FiLock } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const { agent, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (agent) {
      const to = location.state?.from?.pathname || "/dashboard";
      navigate(to, { replace: true });
    }
  }, [agent, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!phone || !password) {
      setError("נא להזין טלפון וסיסמה");
      return;
    }
    try {
      await login(phone, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === "object" ? msg.he || msg.en : msg || "התחברות נכשלה");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-brand-superLight to-white">
      <div className="card w-full max-w-md p-7">
        <h1 className="text-2xl font-bold text-center text-brand-dark mb-1">
          סוכני מכירות
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          התחברו כדי להתחיל לעבוד מול לקוחות
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">טלפון</span>
            <div className="relative mt-1">
              <FiPhone className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="field ps-10"
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                placeholder="050-..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">סיסמה</span>
            <div className="relative mt-1">
              <FiLock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="field ps-10"
                type="password"
                autoComplete="current-password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          {error && (
            <div className="rounded-xl bg-danger/10 text-danger-dark px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

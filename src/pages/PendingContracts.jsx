// pages/PendingContracts.jsx
//
// רשימת הסכמים שהלקוח כבר חתם עליהם ומחכים לחתימת הסוכן.
// בלחיצה — מבקש token חתימת סוכן ופותח טאב חדש לדף החתימה ב-mnm-store.
// כך אנחנו נשארים עם UI חתימה אחד (ב-store), בלי כפילות.

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiExternalLink, FiClock } from "react-icons/fi";
import { listPendingForAgent, getAgentSignToken } from "@/api/contracts";
import Loader from "@/components/common/Loader";
import Empty from "@/components/common/Empty";

// דף החתימה חי באותה אפליקציה (mnm-agents). פתיחה בטאב חדש מאפשרת לסוכן
// לחזור בקלות לרשימה. ב-build/dev הכתובת זהה ל-origin הנוכחי.
const sameOriginSignUrl = (token) =>
    `${window.location.origin}/sign-contract/${encodeURIComponent(token)}`;

const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.toLocaleDateString("he-IL")} ${dt.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
};

const PendingContracts = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [opening, setOpening] = useState(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listPendingForAgent();
            setList(Array.isArray(data) ? data : []);
        } catch {
            setList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const openSignPage = async (contractId) => {
        setOpening(contractId);
        setError("");
        try {
            const token = await getAgentSignToken(contractId);
            window.open(sameOriginSignUrl(token), "_blank", "noopener,noreferrer");
        } catch (err) {
            setError(err?.response?.data?.message || "שגיאה בפתיחת ההסכם");
        } finally {
            setOpening(null);
        }
    };

    return (
        <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link
                    to="/dashboard"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                    aria-label="חזרה"
                >
                    <FiArrowRight />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">
                    הסכמים ממתינים לחתימתי
                </h1>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <Loader />
            ) : list.length === 0 ? (
                <Empty
                    title="אין הסכמים ממתינים"
                    description="ברגע שלקוח יחתום על הסכם — הוא יופיע כאן ויחכה לחתימתך."
                />
            ) : (
                <div className="space-y-3">
                    {list.map((c) => (
                        <div key={c._id} className="card p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-800 truncate">
                                        {c.mainCustomer?.name ||
                                            c.signedData?.customerName ||
                                            "—"}
                                    </h3>
                                    {c.mainCustomer?.email && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {c.mainCustomer.email}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                                        <FiClock />
                                        הלקוח חתם: {formatDate(c.customerSignedAt)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openSignPage(c._id)}
                                    disabled={opening === c._id}
                                    className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
                                >
                                    <FiExternalLink />
                                    {opening === c._id ? "פותח..." : "פתח לחתימה"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingContracts;

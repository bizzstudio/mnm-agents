// pages/SignContract.jsx
//
// דף חתימה דיגיטלית — public route (לא דורש login).
// אימות נעשה דרך הטוקן ב-URL (verifyContractToken בbackend).
//
// flow לפי role של הטוקן:
//   role=customer + status=Pending       → טופס נספח א' + signature pad
//   role=customer + status=AwaitingAgent → "החתימה התקבלה, ממתין לסוכן"
//   role=agent    + status=AwaitingAgent → קוטה את שמולא + signature pad לסוכן
//   status=Signed → "ההסכם נחתם" + לינק הורדה (אם זמין)
//   status=Expired/Cancelled → מסך שגיאה

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    getContractByToken,
    submitContractByToken,
} from "@/api/contracts";
import SignaturePad from "@/components/contract/SignaturePad";
import ContractBody, {
    GuaranteeAppendixBody,
    PromissoryNoteAppendixBody,
} from "@/components/contract/ContractBody";

const Field = ({ label, value, onChange, className = "" }) => (
    <label className={`block ${className}`}>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <input
            type="text"
            value={value || ""}
            onChange={onChange}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
        />
    </label>
);

const SignContract = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [contract, setContract] = useState(null);
    const [role, setRole] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [successInfo, setSuccessInfo] = useState(null);

    const [formData, setFormData] = useState({
        // נספח א'
        customerName: "",
        customerType: "",
        companyNumber: "",
        contactPerson: "",
        contactPhone: "",
        contactRole: "",
        deliveryAddress: "",
        weeklyDeliveryDay: "",
        entryCode: "",
        paymentMethod: "",
        paymentMethodDetails: "",
        customerFullName: "",
        agentFullName: "",
        // נספח ב' — הלקוח עצמו הוא הערב; אוכלסים מראש מפרטי הלקוח
        guarantorName: "",
        guarantorId: "",
        guarantorAddress: "",
        // נספח ג' — שטר חוב
        promissoryDate: "",
        promissoryPlace: "",
        promissoryAmount: "",
        promissoryAmountWords: "",
        promissoryReason: "",
        avalist1Name: "",
        avalist1Id: "",
        avalist1Address: "",
        avalist2Name: "",
        avalist2Id: "",
        avalist2Address: "",
    });
    const [signatureDataUrl, setSignatureDataUrl] = useState("");
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        getContractByToken(token)
            .then((data) => {
                if (cancelled) return;
                setContract(data);
                setRole(data.role);
                if (data.status === "Signed") {
                    setSuccessInfo({ pdfUrl: null, alreadySigned: true });
                }
                const seed = data.signedData?.customerName
                    ? data.signedData
                    : data.prefilledData || {};
                setFormData((f) => ({ ...f, ...seed }));
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.response?.data?.message || "שגיאה בטעינת ההסכם");
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [token]);

    const setField = useCallback(
        (k) => (e) => setFormData((f) => ({ ...f, [k]: e.target?.value ?? e })),
        []
    );

    const canSubmitCustomer = useMemo(
        () =>
            agreed &&
            !!signatureDataUrl &&
            !!formData.customerFullName?.trim() &&
            !!formData.customerName?.trim() &&
            !!formData.contactPerson?.trim() &&
            !!formData.paymentMethod,
        [agreed, signatureDataUrl, formData]
    );

    const canSubmitAgent = useMemo(
        () => agreed && !!signatureDataUrl && !!formData.agentFullName?.trim(),
        [agreed, signatureDataUrl, formData.agentFullName]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const payload =
                role === "customer"
                    ? {
                          signedData: {
                              // נספח א'
                              customerName: formData.customerName.trim(),
                              customerType: formData.customerType,
                              companyNumber: formData.companyNumber,
                              contactPerson: formData.contactPerson.trim(),
                              contactPhone: formData.contactPhone,
                              contactRole: formData.contactRole,
                              deliveryAddress: formData.deliveryAddress,
                              weeklyDeliveryDay: formData.weeklyDeliveryDay,
                              entryCode: formData.entryCode,
                              paymentMethod: formData.paymentMethod,
                              paymentMethodDetails: formData.paymentMethodDetails,
                              customerFullName: formData.customerFullName.trim(),
                              // נספח ב'
                              guarantorName: formData.guarantorName.trim(),
                              guarantorId: formData.guarantorId.trim(),
                              guarantorAddress: formData.guarantorAddress.trim(),
                              // נספח ג'
                              promissoryDate: formData.promissoryDate,
                              promissoryPlace: formData.promissoryPlace,
                              promissoryAmount: formData.promissoryAmount,
                              promissoryAmountWords: formData.promissoryAmountWords,
                              promissoryReason: formData.promissoryReason,
                              avalist1Name: formData.avalist1Name.trim(),
                              avalist1Id: formData.avalist1Id.trim(),
                              avalist1Address: formData.avalist1Address.trim(),
                              avalist2Name: formData.avalist2Name.trim(),
                              avalist2Id: formData.avalist2Id.trim(),
                              avalist2Address: formData.avalist2Address.trim(),
                          },
                          signatureDataUrl,
                      }
                    : {
                          agentFullName: formData.agentFullName.trim(),
                          signatureDataUrl,
                      };
            const res = await submitContractByToken(token, payload);
            setSuccessInfo({
                pdfUrl: res.signedPdfUrl || null,
                message: res.message,
                stage: role,
            });
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "שגיאה בשליחת ההסכם, נסה שוב"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">טוען הסכם...</div>
            </div>
        );
    }

    if (error && !contract) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-red-600 text-3xl mb-3">⚠️</div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        לא ניתן לטעון את ההסכם
                    </h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (successInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-green-600 text-5xl mb-3">✓</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        {successInfo.alreadySigned
                            ? "ההסכם נחתם בהצלחה"
                            : successInfo.stage === "customer"
                              ? "תודה! החתימה התקבלה"
                              : "ההסכם הושלם וחתום"}
                    </h2>
                    <p className="text-gray-600">
                        {successInfo.message ||
                            "עותק חתום של ההסכם נשלח אליך במייל."}
                    </p>
                    {successInfo.pdfUrl && (
                        <a
                            href={successInfo.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-block bg-green-700 text-white px-6 py-2 rounded font-semibold hover:bg-green-800"
                        >
                            הורד את ההסכם החתום
                        </a>
                    )}
                </div>
            </div>
        );
    }

    if (contract?.status === "Expired" || contract?.status === "Cancelled") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-amber-600 text-3xl mb-3">⏰</div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        {contract.status === "Expired"
                            ? "פג תוקף של הלינק"
                            : "ההסכם בוטל"}
                    </h2>
                    <p className="text-gray-600">
                        צור קשר עם הסוכן שלך לקבלת לינק חדש.
                    </p>
                </div>
            </div>
        );
    }

    if (role === "customer" && contract?.status === "AwaitingAgent") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-blue-600 text-3xl mb-3">⏳</div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        החתימה שלך התקבלה
                    </h2>
                    <p className="text-gray-600">
                        ההסכם ממתין כעת לחתימת הסוכן. עותק חתום יישלח אליך במייל
                        ברגע שיושלם.
                    </p>
                </div>
            </div>
        );
    }

    const isCustomerForm =
        role === "customer" && contract?.status === "Pending";
    const isAgentForm =
        role === "agent" && contract?.status === "AwaitingAgent";

    return (
        <div dir="rtl" className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        הסכם אספקת שירותים ומוצרים
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        שי משה מרקטינג בע"מ — ח.פ. 516876117
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="bg-white rounded-lg shadow p-6">
                        <ContractBody customerName={formData.customerName} />
                    </section>

                    {isAgentForm && (
                        <section className="bg-white rounded-lg shadow p-6">
                            <h2 className="font-bold text-lg mb-3 text-gray-800">
                                נספח א' — מה שהלקוח מילא וחתם
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {[
                                    ["שם המזמין", formData.customerName],
                                    ["סוג", formData.customerType],
                                    ["ח.פ.", formData.companyNumber],
                                    ["איש קשר", formData.contactPerson],
                                    ["טלפון", formData.contactPhone],
                                    ["תפקיד", formData.contactRole],
                                    ["כתובת אספקה", formData.deliveryAddress],
                                    ["יום אספקה", formData.weeklyDeliveryDay],
                                    ["קוד כניסה", formData.entryCode],
                                    [
                                        "אופן תשלום",
                                        formData.paymentMethod === "cash"
                                            ? "מזומן"
                                            : formData.paymentMethod === "credit"
                                              ? "אשראי"
                                              : "",
                                    ],
                                    ["אמצעי תשלום", formData.paymentMethodDetails],
                                    ["חתם על שם", formData.customerFullName],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex gap-2">
                                        <span className="text-gray-500">{label}:</span>
                                        <span className="font-semibold">
                                            {value || "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {contract?.customerSignatureDataUrl && (
                                <div className="mt-4">
                                    <div className="text-xs text-gray-500 mb-1">
                                        חתימת הלקוח:
                                    </div>
                                    <img
                                        src={contract.customerSignatureDataUrl}
                                        alt="חתימת לקוח"
                                        className="border border-gray-200 rounded max-h-24 bg-white"
                                    />
                                </div>
                            )}
                        </section>
                    )}

                    {isCustomerForm && (
                        <section className="bg-white rounded-lg shadow p-6">
                            <h2 className="font-bold text-lg mb-3 text-gray-800">
                                נספח א' — פרטי הלקוח
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                חלק מהפרטים מולאו אוטומטית. ודא שהם נכונים והשלם את החסרים.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field
                                    label="שם המזמין / מוסד *"
                                    value={formData.customerName}
                                    onChange={setField("customerName")}
                                />
                                <Field
                                    label="סוג מזמין / מוסד"
                                    value={formData.customerType}
                                    onChange={setField("customerType")}
                                />
                                <Field
                                    label="ח.פ. / ע.מ."
                                    value={formData.companyNumber}
                                    onChange={setField("companyNumber")}
                                />
                                <Field
                                    label="איש קשר לקבלת סחורה *"
                                    value={formData.contactPerson}
                                    onChange={setField("contactPerson")}
                                />
                                <Field
                                    label="טלפון איש קשר"
                                    value={formData.contactPhone}
                                    onChange={setField("contactPhone")}
                                />
                                <Field
                                    label="תפקיד"
                                    value={formData.contactRole}
                                    onChange={setField("contactRole")}
                                />
                                <Field
                                    label="כתובת אספקה מלאה"
                                    value={formData.deliveryAddress}
                                    onChange={setField("deliveryAddress")}
                                    className="sm:col-span-2"
                                />
                                <Field
                                    label="יום אספקה קבוע"
                                    value={formData.weeklyDeliveryDay}
                                    onChange={setField("weeklyDeliveryDay")}
                                />
                                <Field
                                    label="קוד כניסה / מפתחות"
                                    value={formData.entryCode}
                                    onChange={setField("entryCode")}
                                />
                            </div>

                            <fieldset className="mt-5 border border-gray-200 rounded p-3">
                                <legend className="text-sm font-semibold px-2">
                                    תנאי ואמצעי תשלום שאושרו *
                                </legend>
                                <label className="flex items-center gap-2 mt-1">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cash"
                                        checked={formData.paymentMethod === "cash"}
                                        onChange={setField("paymentMethod")}
                                    />
                                    <span>מזומן בעת אספקה</span>
                                </label>
                                <label className="flex items-center gap-2 mt-1">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="credit"
                                        checked={formData.paymentMethod === "credit"}
                                        onChange={setField("paymentMethod")}
                                    />
                                    <span>אשראי (חשבונית מרכזת)</span>
                                </label>
                                <Field
                                    label="פרטי אמצעי תשלום (כרטיס / חשבון בנק וכו')"
                                    value={formData.paymentMethodDetails}
                                    onChange={setField("paymentMethodDetails")}
                                    className="mt-3"
                                />
                            </fieldset>
                        </section>
                    )}

                    {/* נספח ב' — כתב ערבות אישית */}
                    {isCustomerForm && (
                        <section className="bg-white rounded-lg shadow p-6">
                            <h2 className="font-bold text-lg mb-3 text-gray-800">
                                נספח ב' — כתב ערבות אישית
                            </h2>
                            <GuaranteeAppendixBody
                                guarantorName={formData.guarantorName}
                                customerName={formData.customerName}
                                companyNumber={formData.companyNumber}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 border-t pt-4">
                                <Field
                                    label="שם הערב *"
                                    value={formData.guarantorName}
                                    onChange={setField("guarantorName")}
                                />
                                <Field
                                    label="ת.ז. הערב *"
                                    value={formData.guarantorId}
                                    onChange={setField("guarantorId")}
                                />
                                <Field
                                    label="כתובת הערב *"
                                    value={formData.guarantorAddress}
                                    onChange={setField("guarantorAddress")}
                                />
                            </div>
                        </section>
                    )}

                    {/* נספח ג' — שטר חוב */}
                    {isCustomerForm && (
                        <section className="bg-white rounded-lg shadow p-6">
                            <h2 className="font-bold text-lg mb-3 text-gray-800">
                                נספח ג' — שטר חוב
                            </h2>
                            <PromissoryNoteAppendixBody
                                customerName={formData.customerName}
                                companyNumber={formData.companyNumber}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t pt-4">
                                <Field
                                    label="תאריך השטר"
                                    value={formData.promissoryDate}
                                    onChange={setField("promissoryDate")}
                                />
                                <Field
                                    label="מקום חתימת השטר"
                                    value={formData.promissoryPlace}
                                    onChange={setField("promissoryPlace")}
                                />
                                <Field
                                    label="סכום השטר (₪) — אופציונלי"
                                    value={formData.promissoryAmount}
                                    onChange={setField("promissoryAmount")}
                                />
                                <Field
                                    label="סכום במילים — אופציונלי"
                                    value={formData.promissoryAmountWords}
                                    onChange={setField("promissoryAmountWords")}
                                />
                                <Field
                                    label="בגין (תיאור) — אופציונלי"
                                    value={formData.promissoryReason}
                                    onChange={setField("promissoryReason")}
                                    className="sm:col-span-2"
                                />
                            </div>

                            <h3 className="font-semibold mt-6 mb-2 text-gray-800">
                                ערבי אוואל (חתימה תיעשה ידנית בנפרד)
                            </h3>
                            <div className="space-y-4">
                                {[1, 2].map((n) => (
                                    <div
                                        key={n}
                                        className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-gray-200 rounded p-3"
                                    >
                                        <Field
                                            label={`שם ערב ${n}`}
                                            value={formData[`avalist${n}Name`]}
                                            onChange={setField(`avalist${n}Name`)}
                                        />
                                        <Field
                                            label={`ת.ז. ערב ${n}`}
                                            value={formData[`avalist${n}Id`]}
                                            onChange={setField(`avalist${n}Id`)}
                                        />
                                        <Field
                                            label={`כתובת ערב ${n}`}
                                            value={formData[`avalist${n}Address`]}
                                            onChange={setField(`avalist${n}Address`)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="bg-white rounded-lg shadow p-6">
                        <h2 className="font-bold text-lg mb-3 text-gray-800">
                            {isAgentForm ? "חתימת סוכן שטח" : "חתימה דיגיטלית"}
                        </h2>
                        {isCustomerForm && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                                <strong>שים לב:</strong> חתימה זו תקפה לכל ההסכם — המסמך הראשי,
                                נספח א' (פרטי הלקוח), נספח ב' (ערבות אישית), ונספח ג' (שטר חוב).
                            </p>
                        )}

                        <Field
                            label={
                                isAgentForm
                                    ? "שם מלא של הסוכן *"
                                    : "שם מלא של החותם *"
                            }
                            value={
                                isAgentForm
                                    ? formData.agentFullName
                                    : formData.customerFullName
                            }
                            onChange={setField(
                                isAgentForm ? "agentFullName" : "customerFullName"
                            )}
                            className="mb-3"
                        />

                        <div className="text-sm text-gray-600 mb-2">
                            חתום במסגרת הבאה באמצעות העכבר או באצבע במסך מגע:
                        </div>
                        <SignaturePad
                            value={signatureDataUrl}
                            onChange={setSignatureDataUrl}
                        />

                        <label className="flex items-start gap-2 mt-4 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-1"
                            />
                            <span>
                                קראתי את ההסכם, מבין את תוכנו ואני מאשר/ת את כל
                                ההתחייבויות המפורטות בו.
                            </span>
                        </label>
                    </section>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={
                            submitting ||
                            (isCustomerForm && !canSubmitCustomer) ||
                            (isAgentForm && !canSubmitAgent)
                        }
                        className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-lg transition"
                    >
                        {submitting
                            ? "שולח..."
                            : isAgentForm
                              ? "אישור וחתימה סופית"
                              : "אישור וחתימה"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignContract;

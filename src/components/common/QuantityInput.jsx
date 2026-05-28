import { FiMinus, FiPlus } from "react-icons/fi";

// קלט כמות נוח: כפתורי - / + + שדה טקסטואלי גדול לטאבלט.
const QuantityInput = ({ value, onChange, min = 0 }) => {
  const set = (v) => {
    const n = Math.max(min, Number(v) || 0);
    onChange(n);
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => set(value - 1)}
        className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100"
        aria-label="הפחת"
      >
        <FiMinus />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-16 h-11 text-center font-bold text-lg outline-none"
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100"
        aria-label="הוסף"
      >
        <FiPlus />
      </button>
    </div>
  );
};

export default QuantityInput;

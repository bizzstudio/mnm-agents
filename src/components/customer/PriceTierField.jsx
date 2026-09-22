// בחירת קבוצת המחירון של הלקוח (קטנים / מוסדיים).
//
// מוצג רק לסוכן שחשוף ליותר ממחירון אחד. סוכן עם מחירון יחיד לא בוחר — השרת
// משייך את הלקוח למחירון שלו (defaultTierForAgent).

import { useAuth } from "@/context/AuthContext";
import { PRICE_TIER_LABELS, agentTiersOf } from "@/utils/priceTiers";

const PriceTierField = ({ value, onChange }) => {
  const { agent } = useAuth();
  const tiers = agentTiersOf(agent);
  if (tiers.length < 2) return null;

  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">קבוצת מחירון *</span>
      <select className="field mt-1" value={value} onChange={onChange}>
        {tiers.map((t) => (
          <option key={t} value={t}>
            {PRICE_TIER_LABELS[t]}
          </option>
        ))}
      </select>
      <span className="block text-xs text-gray-400 mt-1">
        קובעת לפי איזה מחירון יתומחרו הצעות המחיר ללקוח
      </span>
    </label>
  );
};

export default PriceTierField;

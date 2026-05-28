// Cart לפי סוכן וגם לפי לקוח. לכל זוג (agentId, mainCustomerId) שמורה טיוטה
// ב-sessionStorage כך שמעבר בין לקוחות לא מאבד עבודה, אבל סוכנים שנכנסים
// לאותו דפדפן לא חולקים סל.
//
// המבנה: cart = {
//   mainCustomerId, items: [{ productId, title, image, quantity, unitPrice, allowedMin, allowedMax }],
//   orderDiscountPercent, note
// }

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const cartKey = (agentId, mainCustomerId) =>
  `agentCart:${agentId || "anon"}:${mainCustomerId || "none"}`;

const activeCustomerKey = (agentId) =>
  `agentActiveCustomer:${agentId || "anon"}`;

const emptyCart = (mainCustomerId) => ({
  mainCustomerId: mainCustomerId || null,
  items: [],
  orderDiscountPercent: 0,
  note: "",
});

export const CartProvider = ({ children }) => {
  const { agent } = useAuth();
  const agentId = agent?._id || null;

  const [activeMainCustomerId, setActiveMainCustomerId] = useState(null);
  const [cart, setCart] = useState(() => emptyCart(null));

  // כאשר הסוכן משתנה (login / logout / החלפת סוכן) — טוענים מחדש את ה-state
  // מה-storage המתאים לאותו agentId, כך שלעולם לא נציג סל של סוכן אחר.
  useEffect(() => {
    const storedCustomer =
      sessionStorage.getItem(activeCustomerKey(agentId)) || null;
    setActiveMainCustomerId(storedCustomer);

    const cartRaw = sessionStorage.getItem(cartKey(agentId, storedCustomer));
    setCart(cartRaw ? JSON.parse(cartRaw) : emptyCart(storedCustomer));
  }, [agentId]);

  // שמירת הלקוח הפעיל לפי סוכן
  useEffect(() => {
    if (agentId == null) return; // לא לדרוס "anon" כשעוד אין סוכן
    if (activeMainCustomerId) {
      sessionStorage.setItem(activeCustomerKey(agentId), activeMainCustomerId);
    } else {
      sessionStorage.removeItem(activeCustomerKey(agentId));
    }
  }, [agentId, activeMainCustomerId]);

  // שמירת הסל לפי זוג (agentId, customerId)
  useEffect(() => {
    if (agentId == null) return;
    sessionStorage.setItem(
      cartKey(agentId, activeMainCustomerId),
      JSON.stringify(cart)
    );
  }, [cart, activeMainCustomerId, agentId]);

  const switchCustomer = (mainCustomerId) => {
    setActiveMainCustomerId(mainCustomerId);
    const raw = sessionStorage.getItem(cartKey(agentId, mainCustomerId));
    setCart(raw ? JSON.parse(raw) : emptyCart(mainCustomerId));
  };

  // addItem(product, { price, quantity })
  // price: המחיר שהסוכן בחר (חובה כאשר hasRange=true במודל החדש)
  // quantity: ברירת מחדל 1; אם המוצר כבר בסל - מוסיף לכמות הקיימת
  const addItem = (product, options = {}) => {
    const { price, quantity = 1 } = options;
    setCart((c) => {
      const id = product._id || product.productId;
      const existing = c.items.find((i) => i.productId === String(id));
      if (existing) {
        return {
          ...c,
          items: c.items.map((i) =>
            i.productId === String(id)
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      const pricing = product.pricing || {};
      // עדיפויות: price מפורש > pricing.default > 0
      const unitPrice = Number(
        price ?? pricing.default ?? pricing.price ?? 0
      );
      const allowedMin = Number(pricing.min ?? unitPrice);
      const allowedMax = Number(pricing.max ?? unitPrice);
      return {
        ...c,
        items: [
          ...c.items,
          {
            productId: String(id),
            title: product.title || { he: "", en: "" },
            image: product.image,
            quantity,
            unitPrice,
            allowedMin,
            allowedMax,
            pricingMode: pricing.mode || "list",
          },
        ],
      };
    });
  };

  const removeItem = (productId) => {
    setCart((c) => ({
      ...c,
      items: c.items.filter((i) => i.productId !== productId),
    }));
  };

  const updateQuantity = (productId, quantity) => {
    const q = Math.max(0, Number(quantity) || 0);
    setCart((c) => {
      if (q === 0) {
        return { ...c, items: c.items.filter((i) => i.productId !== productId) };
      }
      return {
        ...c,
        items: c.items.map((i) =>
          i.productId === productId ? { ...i, quantity: q } : i
        ),
      };
    });
  };

  // עדכון המחיר ליחידה של שורה — חתוך לטווח [allowedMin, allowedMax]
  const updateLinePrice = (productId, price) => {
    setCart((c) => ({
      ...c,
      items: c.items.map((i) => {
        if (i.productId !== productId) return i;
        const v = Number(price);
        if (!Number.isFinite(v)) return i;
        const clamped = Math.max(i.allowedMin, Math.min(i.allowedMax, v));
        return { ...i, unitPrice: Number(clamped.toFixed(2)) };
      }),
    }));
  };

  // נשמר לצורך תאימות עם הקוד הקיים — לא בשימוש במודל החדש
  const setOrderDiscount = (percent) => {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    setCart((c) => ({ ...c, orderDiscountPercent: p }));
  };

  const setNote = (note) => setCart((c) => ({ ...c, note }));

  const clear = () => {
    setCart(emptyCart(activeMainCustomerId));
  };

  const totals = useMemo(() => {
    const subtotal = cart.items.reduce(
      (s, i) => s + i.unitPrice * i.quantity,
      0
    );
    const count = cart.items.reduce((s, i) => s + i.quantity, 0);
    return {
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(subtotal.toFixed(2)),
      count,
    };
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        activeMainCustomerId,
        switchCustomer,
        addItem,
        removeItem,
        updateQuantity,
        updateLinePrice,
        setOrderDiscount,
        setNote,
        clear,
        totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

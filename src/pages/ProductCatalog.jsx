import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiPlus, FiMinus, FiShoppingCart, FiUser } from "react-icons/fi";
import { listProducts, listCategories } from "@/api/products";
import { useCart } from "@/context/CartContext";
import Loader from "@/components/common/Loader";
import Empty from "@/components/common/Empty";
import { DEFAULT_PRODUCT_IMAGE, getPrimaryProductImageUrl } from "@/utils/productImage";

const PRICE_STEP = 0.1;
const round2 = (n) => Math.round(Number(n) * 100) / 100;

const ProductCard = ({ product }) => {
  const { cart, addItem, updateQuantity, updateLinePrice } = useCart();
  const title = product.title?.he || product.title?.en || "—";
  const imageUrl = getPrimaryProductImageUrl(product) || DEFAULT_PRODUCT_IMAGE;

  const productId = String(product._id);
  const inCart = cart.items.find((i) => i.productId === productId);
  const quantity = inCart?.quantity || 0;

  const pricing = product.pricing || {};
  const hasRange = !!pricing.hasRange;
  const minP = Number(pricing.min || 0);
  const maxP = Number(pricing.max || 0);

  // selectedPrice משמש רק לפני הוספה לסל. אחרי שהמוצר בסל, מקור האמת הוא
  // cart.items[i].unitPrice, ושינויים בבקר מעדכנים אותו דרך updateLinePrice.
  const [selectedPrice, setSelectedPrice] = useState(
    hasRange ? null : pricing.default ?? minP
  );

  // המחיר שמוצג בבקר: אם בסל - של הסל, אחרת ה-local state.
  const effectivePrice = inCart ? inCart.unitPrice : selectedPrice;

  const clamp = (v) => Math.max(minP, Math.min(maxP, round2(v)));

  // עדכון מחיר: בסל → updateLinePrice של הקונטקסט; לפני הוספה → state מקומי
  const setPrice = (value) => {
    if (inCart) {
      updateLinePrice(productId, value);
    } else {
      setSelectedPrice(value);
    }
  };

  const handleMinus = () => {
    if (effectivePrice == null) {
      // לחיצה ראשונה על מינוס (רק במצב לפני הוספה) → התחלה מהמקס
      setPrice(maxP);
    } else {
      setPrice(clamp(effectivePrice - PRICE_STEP));
    }
  };

  const handlePlus = () => {
    if (effectivePrice == null) {
      setPrice(minP);
    } else {
      setPrice(clamp(effectivePrice + PRICE_STEP));
    }
  };

  const handleInput = (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v)) setPrice(clamp(v));
    else if (!inCart) setSelectedPrice(null);
  };

  const handleAdd = () => {
    if (selectedPrice == null) return; // safety
    addItem(product, { price: selectedPrice });
  };

  return (
    <div className="card p-3 flex flex-col">
      <div className="aspect-square bg-gray-100 rounded-xl mb-2 overflow-hidden flex items-center justify-center">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
          }}
        />
      </div>

      <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5em]">{title}</h3>

      {/* תווית מחיר: טווח כאשר hasRange, אחרת מחיר יחיד */}
      {hasRange ? (
        <div className="mt-2 flex flex-col gap-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">מינ׳</span>
            <span className="font-semibold text-gray-700">₪{minP.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">מקס׳</span>
            <span className="font-semibold text-gray-700">₪{maxP.toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-brand-dark">
            ₪{(pricing.default ?? minP).toLocaleString()}
          </span>
        </div>
      )}

      {/* בקר מחיר נשאר תמיד כאשר hasRange — גם לפני וגם אחרי שהמוצר בסל.
          לפני הוספה: עורך את selectedPrice המקומי.
          אחרי הוספה: עורך את unitPrice של השורה בסל ישירות. */}
      {hasRange && (
        <div className="mt-2 flex items-center justify-between bg-white border-2 border-brand/30 rounded-xl overflow-hidden h-10">
          <button
            type="button"
            onClick={handleMinus}
            aria-label="הפחת מחיר"
            className="w-10 h-full flex items-center justify-center text-brand-dark hover:bg-brand/10 active:scale-95 transition"
          >
            <FiMinus size={16} />
          </button>
          <input
            type="number"
            inputMode="decimal"
            step={PRICE_STEP}
            value={effectivePrice ?? ""}
            placeholder="בחר מחיר"
            min={minP}
            max={maxP}
            onChange={handleInput}
            onClick={(e) => e.currentTarget.select()}
            className="w-full h-full text-center font-bold text-sm bg-transparent outline-none text-brand-dark placeholder:text-gray-400 placeholder:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={handlePlus}
            aria-label="הוסף מחיר"
            className="w-10 h-full flex items-center justify-center text-brand-dark hover:bg-brand/10 active:scale-95 transition"
          >
            <FiPlus size={16} />
          </button>
        </div>
      )}

      {/* פעולה: כפתור הוספה כאשר המוצר לא בסל, בקר כמות כאשר כבר בפנים. */}
      {quantity === 0 ? (
        <button
          onClick={handleAdd}
          disabled={hasRange && selectedPrice == null}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-white text-sm font-semibold h-10 hover:bg-brand-dark active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand"
        >
          <FiPlus size={16} />
          {hasRange && selectedPrice == null ? "בחר מחיר" : "הוסף לעגלה"}
        </button>
      ) : (
        <div className="mt-2 flex items-center justify-between bg-brand text-white rounded-xl shadow-sm overflow-hidden h-10">
          <button
            onClick={() => updateQuantity(productId, quantity - 1)}
            aria-label="הפחת"
            className="w-10 h-full flex items-center justify-center hover:bg-brand-dark active:scale-95 transition"
          >
            <FiMinus size={18} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={quantity}
            min={0}
            onChange={(e) => updateQuantity(productId, e.target.value)}
            onClick={(e) => e.currentTarget.select()}
            className="w-full h-full text-center font-bold text-base bg-transparent outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => updateQuantity(productId, quantity + 1)}
            aria-label="הוסף"
            className="w-10 h-full flex items-center justify-center hover:bg-brand-dark active:scale-95 transition"
          >
            <FiPlus size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

const ProductCatalog = () => {
  const { activeMainCustomerId, totals } = useCart();
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(
    async (q, cat) => {
      setLoading(true);
      try {
        const res = await listProducts({
          q,
          category: cat || undefined,
          mainCustomerId: activeMainCustomerId || undefined,
          page: 1,
          limit: 60,
        });
        setProducts(res?.data || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [activeMainCustomerId]
  );

  useEffect(() => {
    fetch(submitted, category);
  }, [fetch, submitted, category]);

  useEffect(() => {
    listCategories()
      .then((c) => setCategories(Array.isArray(c) ? c : []))
      .catch(() => setCategories([]));
  }, []);

  if (!activeMainCustomerId) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card p-6 text-center">
          <FiUser size={36} className="mx-auto text-brand-light mb-3" />
          <h2 className="font-bold text-lg mb-2">בחר לקוח</h2>
          <p className="text-sm text-gray-500 mb-4">
            בחר לקוח לפני שתעבור לקטלוג.
          </p>
          <Link to="/customers" className="btn-primary inline-flex">
            לבחירת לקוח
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 max-w-7xl mx-auto">
      <div className="sticky top-[64px] sm:top-[68px] z-20 bg-gray-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 border-b border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(search.trim());
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <FiSearch className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש מוצר / ברקוד"
              className="field pe-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="field max-w-[180px]"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name?.he || c.name?.en || c.slug}
              </option>
            ))}
          </select>
        </form>
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <Empty title="לא נמצאו מוצרים" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4 pb-24">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {totals.count > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-24 inset-x-4 sm:inset-x-auto sm:end-6 z-20 btn-primary shadow-2xl sm:max-w-md"
        >
          <FiShoppingCart />
          <span className="truncate">
            צפייה בסל ({totals.count}) — ₪{totals.total.toLocaleString()}
          </span>
        </Link>
      )}
    </div>
  );
};

export default ProductCatalog;

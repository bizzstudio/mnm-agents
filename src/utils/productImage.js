// utils/productImage.js
// אותה תמונת ברירת מחדל ולוגיקת image[0] / image-string כמו mnm-admin/utils/productImage.js
// כדי לשמור על אחידות חזותית בין המערכות.

export const DEFAULT_PRODUCT_IMAGE =
  "https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png";

/**
 * מחזיר את כתובת התמונה הראשונה של המוצר, או null אם אין תמונה תקפה.
 * תומך ב-image כמערך או כמחרוזת.
 */
export function getPrimaryProductImageUrl(product) {
  const img = product?.image;
  if (!img) return null;
  if (Array.isArray(img)) {
    const first = img.find((u) => typeof u === "string" && u.trim().length > 0);
    return first ? first.trim() : null;
  }
  if (typeof img === "string" && img.trim()) return img.trim();
  return null;
}

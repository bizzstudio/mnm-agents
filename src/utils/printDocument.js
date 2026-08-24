// utils/printDocument.js
//
// הדפסת מסמך HTML בלי חלון קופץ.
//
// למה לא window.open: הכפתור מביא את המסמך מהשרת עם ה-Authorization header,
// כלומר יש await לפני הפתיחה — ובשלב הזה הדפדפן כבר לא רואה "מחווה של
// משתמש" וחוסם את window.open (בעיקר בטאבלטים ובספארי). לכן מזריקים את
// ה-HTML ל-iframe מוסתר באותו origin ומדפיסים אותו.

const IFRAME_STYLE =
  "position:absolute;left:-9999px;top:0;width:0;height:0;border:0;";

// ניקוי מאוחר: הסרת ה-iframe מיד אחרי print() מבטלת את דיאלוג ההדפסה
// בחלק מהדפדפנים, ולכן מסירים אחרי afterprint או בתום פסק זמן.
const CLEANUP_MS = 60000;

export const printHtmlDocument = (html) =>
  new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("no document"));
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("title", "print");
    iframe.style.cssText = IFRAME_STYLE;

    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      iframe.remove();
    };

    iframe.onload = async () => {
      try {
        const win = iframe.contentWindow;
        if (!win) throw new Error("iframe unavailable");

        // ממתינים לפונט העברי לפני ההדפסה — אחרת המסמך מודפס בפונט חלופי.
        try {
          await win.document?.fonts?.ready;
        } catch {
          /* דפדפן ללא Font Loading API — ממשיכים */
        }

        win.addEventListener?.("afterprint", () => setTimeout(remove, 500));
        win.focus();
        win.print();
        setTimeout(remove, CLEANUP_MS);
        resolve();
      } catch (e) {
        remove();
        reject(e);
      }
    };
    iframe.onerror = () => {
      remove();
      reject(new Error("iframe failed to load"));
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = html;
  });

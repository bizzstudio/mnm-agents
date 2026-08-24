# mnm-agents — אפליקציית סוכני מכירות

אפליקציית ווב מותאמת טאבלט / נייד עבור סוכני מכירות. נבנתה כאחות ל-`mnm-likut` — אותה תבנית עקרונות, סורסים שונים.

## מה היא עושה

סוכן יכול להתחבר, לבחור לקוח קיים (או ליצור חדש אם יש לו הרשאה), לדפדף בקטלוג עם המחירים המותאמים לסוכן או ללקוח, לבנות סל, לתת הנחה ברמת שורה (בתוך הטווח שמוגדר עליו), **לשמור כהצעת מחיר**, ולעקוב אחר ביצועיו מול יעדים.

> **הערה:** האפליקציה מייצרת **הצעות מחיר בלבד** (`orderType="quote"`). אין בה אפשרות לפתוח הזמנה או להמיר הצעה להזמנה — השרת אוכף זאת ב-`createAgentOrder`, וראוט ה-convert מחזיר 403. הצעות מחיר אינן מופיעות ברשימת ההזמנות של האדמין ולא ב"ההזמנות שלי" בחנות; הן נצפות באדמין במסך "הצעות מחיר סוכנים" (`/agent-orders`).

## דרישות מקדימות

הסוכן חי כיחידה נפרדת ב־Backend, אז קודם צריך לוודא ש־`mnm-backend` עודכן עם המודולים החדשים שמסופקים בחבילה זו:

- `models/Agent.js` חדש
- שדה `assignedAgent` ב־`MainCustomer`
- שדות `createdByAgent`, `orderType`, `agentDiscountPercent`, `agentDiscountAmount` ב־`Order`
- `isAgent` middleware ב־`config/auth.js`
- ראוטים: `/api/agent/*` ו־`/api/admin/agents/*`

## התקנה והרצה

```bash
cd mnm-agents
cp .env.example .env
# ערוך את .env והגדר את VITE_API_BASE_URL לכתובת ה-backend
npm install
npm run dev          # האזנה ב-localhost:4106
npm run host         # האזנה ב-0.0.0.0:4106 (לטסט מטאבלט ברשת)
npm run build        # production
```

ה־port המוגדר הוא **4106** (mnm-admin פועל על 4105).

## משתני סביבה

| משתנה | תיאור |
|---|---|
| `VITE_API_BASE_URL` | כתובת בסיס של ה־backend, כולל `/api` (למשל `http://localhost:5055/api`) |
| `VITE_APP_NAME` | שם המוצג ב־UI (לא חובה) |

בצד ה-backend, זרימת הצעת המחיר מוסיפה:

| משתנה | תיאור |
|---|---|
| `AGENTS_URL` | כתובת הבסיס של האפליקציה הזו. ממנה נבנה הקישור שהלקוח מקבל (`/quote/:token`). **חובה** — בלעדיו נעשה fallback ל-`STORE_URL` שאין בו את הראוט. |
| `QUOTE_VALIDITY_DAYS` | תוקף עסקי של ההצעה שמודפס במסמך (ברירת מחדל 14) |
| `QUOTE_LINK_TTL_DAYS` | תוקף קישור הצפייה של הלקוח (ברירת מחדל 60) |
| `COMPANY_NAME`, `COMPANY_NUMBER`, `COMPANY_PHONE`, `COMPANY_EMAIL` | כותרת המסמך |

## איך זה מאובטח

- Token מוחזק ב־`localStorage` תחת המפתח `agentToken`. כל בקשת axios מצרפת אותו אוטומטית.
- 401 → ניקוי טוקן + redirect ל־`/login`.
- כל הראוטים `/api/agent/*` מוגנים ע"י middleware `isAgent` בצד שרת, אשר מאמת JWT עם claim `role === "Agent"`, טוען את המסמך מה־DB ומוודא ש־`isActive=true`.
- **הסוכן לעולם לא רואה** את `costPrice` או את שאר המחירונים — הקונטרולר `agentController.projectProductForAgent` מסיר את מערך `prices` ומחזיר רק את המחיר המחושב לפי המחירון הרלוונטי.
- **אכיפת הנחה בצד שרת** — `utils/agentPriceGuard.js` בודק שכל שורה לא יורדת מתחת ל־`expectedPrice * (1 - maxDiscountPercent/100)` ושההנחה הכללית בתוך הטווח. אם הסוכן שלח מחיר נמוך מדי — השרת מחזיר 409 עם פירוט השורות הבעייתיות.

## Flow מלא של סוכן

1. **Login** (`/login`) — טלפון + סיסמה → קבלת JWT → שמירה ב־localStorage → redirect לדשבורד.
2. **Dashboard** (`/dashboard`) — סיכום KPI ויעדים יומי/שבועי/חודשי.
3. **בחירת לקוח** (`/customers`) — חיפוש ובחירה. אופציה ליצירת לקוח חדש אם להרשאה.
4. **קטלוג** (`/catalog`) — חיפוש, סינון לפי קטגוריה, הוספה לסל. מחירים מותאמים אוטומטית ללקוח שנבחר.
5. **סיכום הצעת מחיר** (`/cart`) — עריכת כמויות, מחיר פר-שורה בתוך הטווח, הערה. כפתור יחיד: "שמור כהצעת מחיר".
6. **אישור** (`/confirmation/:id`) — מסך הצלחה עם מספר ההצעה + שלוש פעולות מיידיות:
   הדפסה, שמירה כ-PDF, ושליחה ללקוח.
7. **היסטוריה** (`/orders`) — רשימת הצעות המחיר של הסוכן, עם סינון לפי מצב מול הלקוח
   (בבדיקה / אושרו / לא אושרו / טרם נשלחו).
8. **הצעה בודדת** (`/orders/:id`) — הדפסה, PDF, שליחה במייל/וואטסאפ, סימון ידני של
   תשובת הלקוח, יומן "מה קרה עם ההצעה", ו"סקלת מחיר" פר-שורה (פנימי — ראה למטה).

## הצעת מחיר: הדפסה, שליחה ללקוח ואישור

זרימת האישור שלפני חתימת ההסכם — הלקוח רואה מחירים ומאשר אותם *לפני* שנשלח
אליו הסכם לחתימה. שני התהליכים (הצעה / הסכם) נפרדים לחלוטין.

```
סוכן שומר הצעה            → quote.approval = "draft"    (טרם נשלחה)
סוכן שולח (מייל / קישור)   → "sent"                      (בבדיקה)
הלקוח פותח את הקישור      → "viewed"                    (נצפתה)
הלקוח מאשר / לא מאשר      → "approved" / "rejected"     (+ מייל לסוכן)
```

הסוכן יכול גם לסמן ידנית תשובה שקיבל בטלפון (`POST /agent/orders/:id/approval`),
ולהחזיר ל"ממתין לאישור" אם סימן בטעות (`decision:"reset"`).

**קצוות סוכן** (מאחורי `isAgent`):

| קצה | תפקיד |
|---|---|
| `GET /api/agent/orders/:id/pdf` | מסמך ההצעה כ-PDF (`?inline=1` לצפייה/הדפסה, אחרת הורדה) |
| `GET /api/agent/orders/:id/html` | אותו מסמך כ-HTML להדפסה מיידית מהדפדפן |
| `POST /api/agent/orders/:id/send` | `{email?, message?}` — מייל ללקוח עם PDF מצורף + קישור אישור |
| `POST /api/agent/orders/:id/share-link` | קישור צפייה/אישור לשיתוף בוואטסאפ / העתקה |
| `POST /api/agent/orders/:id/approval` | `{decision:"approve"\|"reject"\|"reset", note?}` — סימון ידני |
| `GET /api/agent/orders?approval=sent,viewed` | סינון הרשימה לפי מצב מול הלקוח |

**קצוות הלקוח** (פומביים, אימות ע"י טוקן ב-URL בלבד — `/api/quotes`):

| קצה | תפקיד |
|---|---|
| `GET /by-token/:token` | נתוני ההצעה לתצוגה; פתיחה ראשונה מסמנת `viewed` |
| `GET /by-token/:token/pdf` | PDF (`?download=1` להורדה) |
| `GET /by-token/:token/print` | HTML להדפסה מהנייד |
| `POST /by-token/:token/respond` | `{decision, name, note?}` — אישור / אי-אישור |

הדף שהלקוח רואה הוא `/quote/:token` באפליקציה הזו (public route, כמו
`/sign-contract/:token`). **הקישור נבנה מ-`AGENTS_URL` בבקאנד** — אם המשתנה לא
מוגדר, הקישור ייבנה מ-`STORE_URL` ויוביל לדומיין הלא נכון.

הקצוות הפומביים מוגבלים בקצב (`express-rate-limit`): 120 צפיות / 30 רינדורי
מסמך / 20 תשובות ל-15 דקות לכל IP — רינדור PDF מפעיל כרום headless, וזו בקשה
יקרה שחשופה לאינטרנט.

הטוקן חי 30 יום יותר מ-`linkExpiresAt` **בכוונה**: לקוח שנכנס באיחור רואה מסך
"פג תוקף" עם המחירים ואפשרות להדפיס, במקום 401 סתמי. אישור/דחייה חסומים
(410) אחרי שהתוקף עבר.

`VITE_APP_API_BASE_URL` חייב להיות כתובת **שהלקוח יכול להגיע אליה** — כפתורי
ההדפסה וה-PDF בדף הלקוח מצביעים ישירות על ה-API. כתובת `localhost` תעבוד אצל
הסוכן ותישבר אצל הלקוח.

### הדפסה בצד הסוכן

המסמך נשלף עם ה-Authorization header ולכן אי אפשר פשוט לפתוח כתובת בטאב חדש
(תחזור 401), וגם אי אפשר לקרוא ל-`window.open` אחרי `await` — הדפדפן חוסם.
לכן `utils/printDocument.js` מזריק את ה-HTML ל-iframe מוסתר באותו origin,
ממתין ל-`document.fonts.ready` (אחרת המסמך יוצא בפונט לא-עברי) ומדפיס משם.
אם ההדפסה נחסמה (webview מוגבל) — נופלים אוטומטית להורדת PDF עם הסבר למשתמש.

### מה הלקוח לא רואה

טווח המחירים שהסוכן היה רשאי לבחור מתוכו נשמר בשורות ההצעה
(`allowedMinPrice` / `allowedMaxPrice` / `pricingMode`) לצורכי ביקורת פנימית:
"איזה מחיר בחר הסוכן מתוך הסקלה". הוא מוצג **רק** באפליקציית הסוכן, בכפתור
"הצג סקלות מחיר (פנימי)" במסך ההצעה. `services/quoteDocumentService.js`
(המסמך והמייל) ו-`quoteService.publicQuoteView` (הקצה הפומבי) אינם מכילים אותו —
אין להוסיף אותו שם.

## בדיקה ידנית (smoke test)

לאחר הרצת ה-backend:

1. **צור סוכן באדמין:** היכנס ל־`mnm-admin`, לחץ "סוכני מכירות" בתפריט הצד, לחץ "הוספת סוכן" ומלא את הפרטים: שם, טלפון, סיסמה, בחר מחירון, הגדר `maxDiscountPercent=10`, הגדר יעד חודשי. שמור.
2. **שייך לקוח לסוכן:** בערכת הסוכן בחר MainCustomers מתוך הטופס (או דרך עמוד הלקוחות באדמין). (TODO — הוספת picker בטופס; כרגע משויך בעת יצירת לקוח חדש מהאפליקציה.)
3. **התחברות מהאפליקציה:** רוץ `npm run dev` ב־`mnm-agents`, נווט אל `http://localhost:4106`, התחבר עם הטלפון והסיסמה.
4. **דשבורד יציג** את היעדים שהגדרת באדמין (גם אם 0 הזמנות עדיין).
5. **בחר לקוח** (אם אין משויכים — צור לקוח חדש מהאפליקציה אם canCreateCustomer=true).
6. **הוסף מוצר לסל, עבור ל־`/cart`**, נסה להוריד הנחה גבוהה מהמותר — אמור לחזור עם שגיאה 409.
7. **בחר "שמור כהצעת מחיר"** → מסך אישור → עבור ל־`/orders` וודא שההצעה מופיעה.
8. **חזור לדשבורד** — KPI יתעדכן.

## מבנה התיקייה

```
src/
├── api/                       קליינט axios + endpoints
├── context/                   AuthContext, CartContext
├── routes/                    PrivateRoute
├── components/
│   ├── layout/                AppShell, Header, BottomNav
│   ├── common/                Loader, Empty, QuantityInput
│   └── quote/                 ApprovalBadge, PriceScale, SendQuoteModal
├── pages/                     Login, Dashboard, CustomerPicker, NewCustomer,
│                              ProductCatalog, CartReview, Confirmation,
│                              MyOrders, OrderDetail, QuoteView (public),
│                              PendingContracts, SignContract (public)
├── App.jsx                    הגדרות routing + providers
├── main.jsx                   entry point
└── index.css                  Tailwind + סגנונות גלובליים + utility classes
```

## TODO / חוסרים ידועים

האכיפה הבסיסית עובדת. נקודות שהושארו לעתיד (לפי החלטת המוצר):

- **`minPriceStrategy` לא מוטמע במלואו** — האכיפה כעת היא רק לפי `maxDiscountPercent` שמחושב על `expectedPrice` (מחיר המחירון). הערכים `percentOfCost` ו־`absolute` דורשים שדה `costPrice`/`minSellPrice` ב־`Product` שעדיין לא קיים. השדות בטופס נשמרים אבל ב־`agentPriceGuard.js` יש TODO ברור איפה להוסיף את הלוגיקה.
- **שיוך לקוחות לסוכן בעמוד הסוכן באדמין** — הסכמה תומכת (`Agent.assignedMainCustomers[]` + `MainCustomer.assignedAgent`), והקונטרולר מסנכרן את שני הכיוונים, אבל הטופס באדמין עדיין לא כולל picker. הנתיב היחיד היום: יצירת לקוח מהאפליקציה (canCreateCustomer) או עדכון ידני דרך ה־API.
- **דשבורד אדמין השוואתי** — endpoint `GET /api/admin/agents/overview/all` קיים, אבל דף `AgentsDashboard.jsx` ב־admin עדיין לא נבנה. עמוד `Agents.jsx` מציג רשימה בלבד.
- **socket.io / עדכונים בזמן אמת** — לא חוברו. דשבורד הסוכן מתרענן רק בכניסה לעמוד.
- **MFA / אימות דו-שלבי לסוכן** — לא הוטמע. הסוכן נכנס עם טלפון+סיסמה בלבד (כמו `loginApp` של likut).
- **כפתור "להפוך הזמנה להצעה"** — נתמך רק כיוון אחד (quote → order). אם יידרש הפיכה הפוכה, צריך endpoint נוסף.

## הערות לפיתוח

- ההרצה היומיומית באה דרך `npm run dev` עם `vite`. אין proxy — האפליקציה ניגשת ישירות ל־`VITE_API_BASE_URL`. ודא ש־CORS ב־backend מאפשר את הדומיין שלך (`mnm-backend/api/index.js` משתמש ב־`cors()` ללא הגבלה כברירת מחדל).
- ה־cart נשמר ב־`sessionStorage` לפי `agentCart:<mainCustomerId>`, כך שמעבר בין לקוחות לא מאבד עבודה. הריענון של הדפדפן ישמר את העבודה; סגירת הטאב — לא.
- אם הסוכן נכשל ב־getMe (סטטוס לא פעיל / מחיקה), ה־interceptor מבצע redirect ל־`/login`.

---

*הקבצים הקריטיים ב־backend החדש שלא להגיד שאסור להחליק עליהם*:
[`mnm-backend/controller/agentController.js`](../mnm-backend/controller/agentController.js),
[`mnm-backend/controller/agentOrderController.js`](../mnm-backend/controller/agentOrderController.js),
[`mnm-backend/controller/agentManagementController.js`](../mnm-backend/controller/agentManagementController.js),
[`mnm-backend/utils/agentPriceGuard.js`](../mnm-backend/utils/agentPriceGuard.js).

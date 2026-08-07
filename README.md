# ג'וני טקסי - Johnny TaxiDriver

אתר תדמית לחברת מוניות, שנבנה כפרויקט אישי במסגרת לימודי ניהול מערכות מידע.
האתר כולל עמוד נחיתה מלא בעברית (RTL) עם טופס הזמנת נסיעה, אזורי שירות, המלצות לקוחות ופרטי יצירת קשר, ותומך במעבר בין שפות.

## טכנולוגיות

- React 18 + TypeScript
- Vite
- Tailwind CSS
- i18next (תמיכה רב-לשונית)
- lucide-react (אייקונים)

## מבנה הפרויקט

הקומפוננטות המרכזיות נמצאות בתיקייה `src/components` וכוללות בין השאר:

- `Header` - סרגל ניווט עליון
- `Hero` - כותרת ראשית ופנייה ללקוח
- `Features` - יתרונות השירות
- `ServiceAreas` - אזורי שירות
- `Testimonials` - המלצות לקוחות
- `BookingForm` - טופס הזמנת נסיעה
- `EmergencyCallout` - קריאה לפעולה מהירה
- `Contact` - פרטי יצירת קשר
- `Footer` - פוטר האתר
- `LanguageSwitcher` - החלפת שפת התצוגה

## הרצה מקומית

```bash
npm install
npm run dev
```

לאחר ההרצה האתר יהיה זמין בכתובת שתוצג בטרמינל (בדרך כלל http://localhost:5173).

## בנייה לפרודקשן

```bash
npm run build
npm run preview
```

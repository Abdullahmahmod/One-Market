# 🔐 دليل الأسعار الجديد - متعدد المصادر

## 📋 ملخص

بعد إيقاف Railway، النظام الآن يعتمد على:
- **Firebase** (الخيار الأول والموصى به)
- **localStorage** (النسخة الاحتياطية)
- **API خارجي** (خيار مرن)
- **لوحة Admin** (للتحكم اليدوي)

---

## 🚀 البدء السريع

### 1️⃣ تفعيل Firebase

```javascript
// في js/firebase-config.js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD...",              // من Firebase Console
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### 2️⃣ الدخول للوحة Admin

```
🔗 http://localhost:5000/admin/price-control.html
```

### 3️⃣ تحديث الأسعار

- ✏️ عدّل الأسعار مباشرة
- 💾 اضغط "حفظ جميع التغييرات"
- ✅ سيتم الحفظ في Firebase و localStorage

---

## 📊 مصادر الأسعار (بالترتيب)

### الخيار 1: Firebase (الأول)
```javascript
// تحميل من Firebase
await window.priceManager.loadFromFirebase();

// الحفظ في Firebase
await window.priceManager.saveToFirebase();
```

### الخيار 2: API خارجي توتومي
```javascript
// تحميل من API
await window.priceManager.loadFromExternalSource('https://api.example.com/prices');

// الـ API يجب أن يرجع:
{
  "tomato": 8,
  "cucumber": 5,
  "carrot": 4
}
```

### الخيار 3: localStorage (النسخة الاحتياطية)
```javascript
// تحميل من localStorage
window.priceManager.loadFromStorage();

// حفظ في localStorage
window.priceManager.saveToStorage();
```

### الخيار 4: CSV/JSON (الاستيراد)
```javascript
// من CSV
const csvData = `Product ID,Price
tomato,8
cucumber,5`;
window.priceManager.loadFromCSV(csvData);

// من JSON
const jsonData = { "tomato": 8, "cucumber": 5 };
window.priceManager.loadFromStorage(); // ثم تحديث يدوي
```

---

## 🎮 استخدام PriceManager في الكود

```javascript
// تحديث سعر واحد
window.priceManager.updatePrice('tomato', 8.50);

// الحصول على سعر
const price = window.priceManager.getPrice('tomato');

// الحصول على جميع الأسعار
const allPrices = window.priceManager.getPrices();

// الحصول على المصدر الحالي
const source = window.priceManager.getSource();

// الاستماع لتغييرات الأسعار
window.priceManager.onChange((data) => {
  console.log('Prices changed:', data);
});

// التصدير
const json = window.priceManager.exportAsJSON();
const csv = window.priceManager.exportAsCSV();
```

---

## 📲 في الـ Frontend (index.html)

الموقع الآن يسحب الأسعار بهذه الطريقة:

```javascript
// 1. أولاً: جرب Firebase
// 2. أخيراً: استخدم localStorage أو قيم ثابتة
```

---

## 🔧 إعداد API خارجي (اختياري)

### مثال: Node.js Backend

```javascript
// backend/routes/prices.js
app.get('/api/products', (req, res) => {
  const prices = {
    tomato: 8,
    cucumber: 5,
    carrot: 4,
    banana: 6,
    apple: 7
  };
  res.json(prices);
});
```

### مثال: Google Sheets API

```javascript
// روابط الجداول
const SHEETS_API_URL = 'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=json';

// تحميل من الجدول
await window.priceManager.loadFromExternalSource(SHEETS_API_URL);
```

---

## 🛡️ قواعد الأمان في Firebase

في Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "products": {
      "prices": {
        ".read": true,
        ".write": false  // منع التعديل المباشر، فقط من Admin
      }
    },
    "admin": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    }
  }
}
```

---

## 📝 خطوات الاختبار قبل الإطلاق

### ✅ اختبر كل مصدر:

```bash
# 1. Firebase
localStorage.setItem('ENABLE_FIREBASE', 'true');
await loadProductPrices(true);

# 2. API
localStorage.setItem('priceApiUrl', 'https://your-api.com/prices');
await loadProductPrices(true);

# 3. localStorage
localStorage.setItem('productPrices', JSON.stringify({...}));
await loadProductPrices(true);
```

### ✅ اختبر الـ Admin Panel:

1. افتح: `/admin/price-control.html`
2. حدّث سعر
3. اضغط "حفظ"
4. تحقق من الـ localStorage/Firebase
5. أعد تحميل الموقع - هل الأسعار ظهرت؟

### ✅ اختبر بدون إنترنت:

1. فعّل Offline Mode
2. جرّب تحديث الأسعار
3. يجب أن يستخدم localStorage

---

## 🔄 الترتيب الافتراضي للبحث عن الأسعار

```javascript
// في loadProductPrices():

1. Firebase (إذا كان مفعلاً)
   ↓
2. API المخصصة في localStorage.priceApiUrl
   ↓
3. Same-origin API (إذا كان الموقع في domain واحد مع API)
   ↓
4. localhost (للتطوير الحالي)
   ↓
5. localStorage (النسخة الاحتياطية)
```

---

## 🚨 حل المشاكل

### المشكلة: الأسعار لا تظهر
```javascript
// افحص المصدر الحالي
console.log('Current source:', window.priceManager.getSource());
console.log('Prices:', window.priceManager.getPrices());
```

### المشكلة: Firebase لا يعمل
```javascript
// تحقق من Config
console.log('Firebase enabled:', window.FirebaseBridge?.isEnabled?.());
console.log('Firebase config:', FIREBASE_CONFIG);
```

### المشكلة: API يرجع خطأ
```javascript
// جرّب الـ API مباشرة
fetch('https://your-api.com/prices')
  .then(r => r.json())
  .then(console.log);
```

---

## 📚 ملفات المرجعية

| الملف | الوصف |
|-----|--------|
| `admin/price-control.html` | لوحة إدارة الأسعار |
| `admin/price-manager.js` | فئة PriceManager |
| `js/config.js` | إعدادات الأسعار العامة |
| `js/firebase-config.js` | إعدادات Firebase |

---

## ✨ ميزات إضافية

- ✅ تصدير/استيراد JSON و CSV
- ✅ البحث السريع عن المنتجات
- ✅ تاريخ آخر تحديث
- ✅ دعم متعدد المصادر
- ✅ نسخة احتياطية محلية

---

## 💡 نصائح

1. **قبل الإطلاق**: تأكد من اختبار Firebase في بيئة الاختبار
2. **للأمان**: استخدم قواعل أمان صارمة في Firebase
3. **للأداء**: استخدم localStorage كـ cache للأسعار
4. **للموثوقية**: احتفظ بـ API بديل في `PRICE_API.URLS`

---

**آخر تحديث:** March 23, 2026
**الحالة:** ✅ جاهز للاختبار والإطلاق

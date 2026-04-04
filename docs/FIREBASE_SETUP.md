# 🔥 Firebase Backend - Setup Guide

## 📋 الخطوات الأولية (First Time Setup)

### الخطوة 1: إنشاء Firebase Project

1. اذهب إلى: **https://console.firebase.google.com**
2. اضغط **"Create Project"**
3. أدخل الاسم: **"One-Market"**
4. اضغط **Continue** → اختر حسابك → اضغط **Create Project**

---

### الخطوة 2: الحصول على بيانات الاتصال (Config)

1. في Firebase Console اضغط على **⚙️ Project Settings**
2. اختر التبويب **"Your apps"**
3. اضغط **Web** (أيقونة العنكبوت `</>`)
4. أدخل الاسم: **"One Market Store"**
5. اضغط **Register app**
6. **انسخ الكود الظاهر** (Firebase SDK)

---

### الخطوة 3: تحديث firebase-config.js

فتح `js/firebase-config.js` واستبدل القيم:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD...",              // ← انسخ من Firebase
  authDomain: "one-market-xxxxx.firebaseapp.com",
  databaseURL: "https://one-market-xxxxx-default-rtdb.firebaseio.com",
  projectId: "one-market-xxxxx",
  storageBucket: "one-market-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

---

### الخطوة 4: إنشاء قاعدة البيانات (Realtime Database)

1. في Firebase Console اختر **"Realtime Database"**
2. اضغط **Create Database**
3. اختر موقع قريب منك
4. اختر **Start in test mode** (للتطوير)
5. اضغط **Enable**

---

### الخطوة 5: إضافة Firebase SDK للـ HTML

أضف هذه السطور قبل `</body>` في ملفات HTML:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>

<!-- Your Firebase Config -->
<script src="js/firebase-config.js"></script>
<script src="js/firebase-service.js"></script>
<script src="js/firebase-auth.js"></script>
```

---

## 🔒 تعيين قواعل الأمان (Security Rules)

1. في Firebase Console اختر **Realtime Database**
2. اختر تبويب **Rules**
3. استبدل القواعل القديمة بهذا:

```json
{
  "rules": {
    "orders": {
      ".read": true,
      ".write": true,
      "$uid": {
        ".validate": "newData.hasChildren(['name', 'phone'])"
      }
    },
    "users": {
      ".read": "auth != null",
      ".write": "auth.uid === $uid"
    },
    "products": {
      ".read": true,
      ".write": false
    }
  }
}
```

4. اضغط **Publish**

---

## 💾 استخدام الخدمات

### الحفظ والاسترجاع

```javascript
// حفظ طلب جديد
const orderData = {
  name: "أحمد محمد",
  phone: "201067465207",
  price: 186,
  frequency: "أسبوعي",
  address: "القاهرة"
};

const result = await FirebaseService.Orders.add(orderData);
console.log(result.orderId);
```

### استرجاع الطلبات

```javascript
// الحصول على جميع الطلبات
const result = await FirebaseService.Orders.getAll();
console.log(result.orders);

// الحصول على آخر 5 طلبات
const recent = await FirebaseService.Orders.getRecent(5);
```

### الاستماع الفوري (Real-time)

```javascript
// الاستماع لأي تغييرات
FirebaseService.Orders.subscribe((result) => {
  if (result.success) {
    console.log('آخر الطلبات:', result.orders);
    // حدّث الواجهة
    updateDashboard(result.orders);
  }
});
```

### الإحصائيات

```javascript
// الحصول على الإحصائيات
const stats = await FirebaseService.Analytics.getStats();
console.log('إجمالي الطلبات:', stats.stats.totalOrders);
console.log('الإيراد:', stats.stats.totalRevenue);
```

---

## 🔐 المصادقة (Authentication)

### التسجيل الجديد

```javascript
const result = await FirebaseAuth.User.register(
  'user@example.com',
  'password123',
  'Ahmed'
);
```

### تسجيل الدخول

```javascript
const result = await FirebaseAuth.User.login(
  'user@example.com',
  'password123'
);
```

### تسجيل الخروج

```javascript
await FirebaseAuth.User.logout();
```

### الاستماع لتغييرات المصادقة

```javascript
FirebaseAuth.Observer.onAuthStateChanged((state) => {
  if (state.loggedIn) {
    console.log('المستخدم:', state.user);
  } else {
    console.log('لم يتم تسجيل الدخولhap');
  }
});
```

---

## 📊 دمج مع Dashboard

في `admin/dashboard.js` أضف:

```javascript
// استرجاع البيانات من Firebase بدلاً من LocalStorage
async function loadOrders() {
  const result = await FirebaseService.Orders.getAll();
  if (result.success) {
    return result.orders;
  }
  return [];
}

// تحديث البيانات فوراً
let ordersRef = null;
ordersRef = FirebaseService.Orders.subscribe((result) => {
  if (result.success) {
    Controller.refresh();
  }
});
```

---

## 🔄 المزامنة مع LocalStorage

للحفاظ على البيانات محلياً وفي السحابة:

```javascript
// عند حفظ طلب
async function saveOrderToCloud(orderData) {
  // احفظ محلياً أولاً
  localStorage.setItem('lastOrder', JSON.stringify(orderData));
  
  // ثم احفظ في Firebase
  const result = await FirebaseService.Orders.add(orderData);
  return result;
}
```

---

## ❌ معالجة الأخطاء (Error Handling)

```javascript
async function handleOrderSave(orderData) {
  try {
    const result = await FirebaseService.Orders.add(orderData);
    
    if (!result.success) {
      console.error('خطأ:', result.error);
      Swal.fire('خطأ', 'فشل حفظ الطلب', 'error');
      return;
    }
    
    Swal.fire('نجح', 'تم حفظ الطلب', 'success');
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
  }
}
```

---

## 🚀 النشر (Deployment)

عند نشر الموقع:

1. ✅ تأكد من تحديث `firebase-config.js` بالبيانات الصحيحة
2. ✅ غيّر قواعل الأمان من `test mode` إلى `production`
3. ✅ فعّل HTTPS (ضروري للـ Firebase)
4. ✅ اختبر البيانات في الإنتاج

---

## 📱 الملفات المطلوبة

```
js/
├── firebase-config.js      ← التكوين (⚠️ أضف بياناتك هنا)
├── firebase-service.js     ← قاعدة البيانات
└── firebase-auth.js        ← المصادقة

<!-- في HTML -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: "Firebase not initialized"
- ✅ تأكد من إضافة Firebase SDK في HTML
- ✅ تأكد من تحديث `firebase-config.js`

### المشكلة: "Permission denied"
- ✅ تحقق من قواعل الأمان
- ✅ استخدم `test mode` للتطوير

### المشكلة: "No database"
- ✅ تأكد من إنشاء Realtime Database
- ✅ اختر الموقع الصحيح

---

## 📞 الدعم والمراجع

- [Firebase Documentation](https://firebase.google.com/docs)
- [Realtime Database Guide](https://firebase.google.com/docs/database)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)

---

**تم الإنشاء**: 2026-03-22  
**الإصدار**: 1.0.0

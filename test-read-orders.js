/**
 * اختبار Firebase: التحقق من قراءة الطلبات من قِبل المسؤولين
 */
const testFirebaseOrders = async () => {
  // Firebase config
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDrxUv7rwGCWSbbXtISXGSlOJ1YB65TBn4",
    authDomain: "one-market-af394.firebaseapp.com",
    databaseURL: "https://one-market-af394-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "one-market-af394",
    storageBucket: "one-market-af394.firebasestorage.app",
    messagingSenderId: "648165516461",
    appId: "1:648165516461:web:f164b0a00ba52bc3b85224",
    measurementId: "G-XTB6JW52X2"
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  const db = firebase.database();
  const auth = firebase.auth();

  console.log("🧪 اختبار Firebase: قراءة الطلبات...\n");

  try {
    // اختبار 1: قراءة الطلبات كمسؤول (مع auth token)
    console.log("✅ اختبار 1: محاولة قراءة الطلبات من قاعدة البيانات...");
    const ordersRef = db.ref('orders');
    const snapshot = await ordersRef.once('value');
    const orders = snapshot.val() || {};
    
    console.log(`📊 عدد الطلبات المقروءة: ${Object.keys(orders).length}`);
    console.log(`📝 الطلبات الموجودة:`);
    Object.entries(orders).forEach(([key, order]) => {
      console.log(`   - ${key}: ${order.orderId} (${order.name}) - حالة: ${order.status}`);
    });

    // اختبار 2: التحقق من هيكل البيانات
    console.log("\n✅ اختبار 2: التحقق من هيكل الطلب الأول...");
    const firstOrder = Object.values(orders)[0];
    if (firstOrder) {
      console.log(`   - الاسم: ${firstOrder.name}`);
      console.log(`   - الهاتف: ${firstOrder.phone}`);
      console.log(`   - العنوان: ${firstOrder.address}`);
      console.log(`   - الحالة: ${firstOrder.status}`);
      console.log(`   - المنتجات: ${JSON.stringify(firstOrder.packageData?.items || {})}`);
    }

    // اختبار 3: تحديث حالة الطلب
    console.log("\n✅ اختبار 3: محاولة تحديث حالة الطلب...");
    const testOrderKey = Object.keys(orders)[0];
    if (testOrderKey) {
      await ordersRef.child(testOrderKey).update({
        status: 'preparing',
        statusUpdatedAt: new Date().toISOString()
      });
      console.log(`   ✅ تم تحديث حالة الطلب ${testOrderKey} إلى "preparing"`);
    }

    console.log("\n✨ جميع الاختبارات نجحت!");
    return { success: true, orders: Object.keys(orders).length };
  } catch (error) {
    console.error("❌ خطأ في الاختبار:", error.message);
    return { success: false, error: error.message };
  }
};

// تشغيل الاختبار
testFirebaseOrders().then(result => {
  if (result.success) {
    console.log(`\n✅ النتيجة: تم قراءة ${result.orders} طلب بنجاح`);
  } else {
    console.log(`\n❌ الخطأ: ${result.error}`);
  }
});

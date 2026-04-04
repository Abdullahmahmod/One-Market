/**
 * Firebase Integration Examples
 * ===============================
 * أمثلة على كيفية دمج Firebase مع One Market
 * 
 * استخدم هذه الأمثلة كمرجع لتحديث main.js و checkout.js
 */

// ============================================
// مثال 1: حفظ طلب جديد على Firebase
// ============================================

async function submitOrderToFirebase(orderData) {
  try {
    // تأكد من أن Firebase مهيأ
    if (!window.firebaseDB) {
      console.error('Firebase not initialized');
      return;
    }

    // أضف البيانات المحلية للطلب
    const fullOrderData = {
      name: orderData.name || 'العميل',
      phone: orderData.phone || '',
      address: orderData.address || '',
      price: orderData.price || 0,
      frequency: orderData.frequency || '',
      orderDetails: orderData.items || {},
      paymentMethod: orderData.paymentMethod || 'الاستلام',
      timestamp: new Date().toISOString()
    };

    // احفظ على Firebase
    const result = await FirebaseService.Orders.add(fullOrderData);

    if (result.success) {
      console.log('✅ تم حفظ الطلب على Firebase:', result.orderId);
      Swal.fire('نجح', 'تم حفظ الطلب بنجاح', 'success');
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ خطأ في حفظ الطلب:', error);
    Swal.fire('خطأ', 'فشل حفظ الطلب: ' + error.message, 'error');
  }
}

// ============================================
// مثال 2: استرجاع آخر الطلبات في لوحة التحكم
// ============================================

async function loadOrdersInDashboard() {
  try {
    // احصل على آخر 10 طلبات
    const result = await FirebaseService.Orders.getRecent(10);

    if (!result.success) {
      console.error('خطأ في استرجاع الطلبات:', result.error);
      return [];
    }

    // استخدم البيانات لتحديث الجدول
    const orders = result.orders;
    console.log(`📊 تم تحميل ${orders.length} طلب`);

    return orders;
  } catch (error) {
    console.error('❌ خطأ:', error);
    return [];
  }
}

// ============================================
// مثال 3: الاستماع للطلبات الجديدة (Real-time)
// ============================================

let ordersSubscription = null;

function subscribeToOrders(callback) {
  try {
    ordersSubscription = FirebaseService.Orders.subscribe((result) => {
      if (result.success) {
        console.log('🔄 تم تحديث البيانات، عدد الطلبات:', result.orders.length);
        callback(result.orders);
      } else {
        console.error('خطأ في الاستماع:', result.error);
      }
    });
  } catch (error) {
    console.error('❌ خطأ في الاشتراك:', error);
  }
}

// استخدام:
subscribeToOrders((orders) => {
  // حدّث الرسوم البيانية
  // updateCharts(orders);
  
  // حدّث الجدول
  // renderOrdersTable(orders);
});

// ============================================
// مثال 4: الحصول على الإحصائيات
// ============================================

async function getStoreStats() {
  try {
    const result = await FirebaseService.Analytics.getStats();

    if (result.success) {
      const stats = result.stats;
      console.log('📈 الإحصائيات:');
      console.log(`   إجمالي الطلبات: ${stats.totalOrders}`);
      console.log(`   إجمالي الإيراد: ${stats.totalRevenue} جنيه`);
      console.log(`   متوسط الطلب: ${stats.avgOrder} جنيه`);
      console.log(`   طلبات الشهر: ${stats.ordersThisMonth}`);

      return stats;
    }
  } catch (error) {
    console.error('❌ خطأ في الحصول على الإحصائيات:', error);
  }
}

// ============================================
// مثال 5: تحديث حالة الطلب
// ============================================

async function updateOrderStatus(orderId, newStatus) {
  try {
    // الحالات الممكنة: pending, processing, completed, cancelled
    const result = await FirebaseService.Orders.updateStatus(orderId, newStatus);

    if (result.success) {
      console.log('✅ تم تحديث حالة الطلب:', newStatus);
      return true;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ خطأ في التحديث:', error);
    return false;
  }
}

// ============================================
// مثال 6: المزامنة مع LocalStorage
// ============================================

async function syncWithCloud() {
  try {
    // احصل على الطلبات المحلية
    const localOrders = JSON.parse(
      localStorage.getItem('orderHistory') || '[]'
    );

    console.log(`📤 يتم مزامنة ${localOrders.length} طلب...`);

    // أضفها إلى Firebase
    for (const order of localOrders) {
      const result = await FirebaseService.Orders.add(order);
      if (result.success) {
        console.log('✅ تم رفع:', result.orderId);
      }
    }

    console.log('✅ اكتملت المزامنة');
  } catch (error) {
    console.error('❌ خطأ في المزامنة:', error);
  }
}

// ============================================
// مثال 7: المصادقة - تسجيل مستخدم جديد
// ============================================

async function registerNewUser(email, password, name) {
  try {
    const result = await FirebaseAuth.User.register(email, password, name);

    if (result.success) {
      console.log('✅ تم التسجيل:', result.user.uid);
      Swal.fire('مرحباً', `أهلاً ${name}`, 'success');
      return result.user;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ خطأ في التسجيل:', error);
    Swal.fire('خطأ', error.message, 'error');
  }
}

// ============================================
// مثال 8: تسجيل الدخول
// ============================================

async function loginUser(email, password) {
  try {
    const result = await FirebaseAuth.User.login(email, password);

    if (result.success) {
      console.log('✅ تم تسجيل الدخول:', result.user.email);
      // أعد توجيه المستخدم
      return result.user;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ خطأ في الدخول:', error);
    Swal.fire('خطأ', error.message, 'error');
  }
}

// ============================================
// مثال 9: الاستماع لتغييرات المصادقة
// ============================================

function setupAuthListener() {
  FirebaseAuth.Observer.onAuthStateChanged((state) => {
    if (state.loggedIn) {
      console.log('👤 المستخدم:', state.user.email);
      // قم بتحديث واجهة المستخدم
      updateUIForLoggedUser(state.user);
    } else {
      console.log('👤 لم يتم تسجيل الدخول');
      // أعد تعيين واجهة المستخدم
      updateUIForGuestUser();
    }
  });
}

// ============================================
// مثال 10: دمج في checkout.js
// ============================================

// في أعلى checkout.js أضف:

async function handleCheckoutSubmit(event) {
  event.preventDefault();

  // احصل على البيانات من النموذج
  const formData = {
    name: document.getElementById('customerName')?.value || '',
    phone: document.getElementById('customerPhone')?.value || '',
    address: document.getElementById('customerAddress')?.value || '',
    frequency: document.getElementById('packageType')?.value || '',
    items: getCurrentCartItems(), // احصل من main.js
    price: getCurrentCartPrice(), // احصل من main.js
    paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'الاستلام'
  };

  // احفظ محلياً
  localStorage.setItem('lastOrder', JSON.stringify(formData));

  // احفظ على Firebase
  await submitOrderToFirebase(formData);

  // اتجه للطلبات
  window.location.href = 'orders.html';
}

// ============================================
// مثال 11: دمج في main.js (عند تحديث الطلب)
// ============================================

// استبدل هذا في main.js:

async function submitOrder_NEW(orderData) {
  // 1. احفظ محلياً (كما هو)
  const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  orders.push(orderData);
  localStorage.setItem('orderHistory', JSON.stringify(orders));

  // 2. احفظ على Firebase أيضاً
  const firebaseResult = await FirebaseService.Orders.add(orderData);

  if (firebaseResult.success) {
    console.log('✅ تم الحفظ: محلياً + Firebase');
    return firebaseResult.orderId;
  } else {
    console.warn('⚠️ تم الحفظ محلياً فقط', firebaseResult.error);
  }
}

// ============================================
// مثال 12: اختبار الاتصال
// ============================================

async function testFirebaseConnection() {
  console.log('🧪 اختبار الاتصال بـ Firebase...');

  try {
    // اختبر قراءة البيانات
    const result = await FirebaseService.Orders.getAll();

    if (result.success) {
      console.log('✅ الاتصال ممتاز!');
      console.log(`   عدد الطلبات: ${result.orders.length}`);
      return true;
    } else {
      console.error('❌ خطأ في الاتصال:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ فشل الاتصال:', error);
    return false;
  }
}

// استخدم هذا عند تحميل الصفحة:
document.addEventListener('DOMContentLoaded', async () => {
  const isConnected = await testFirebaseConnection();
  if (!isConnected) {
    console.warn('⚠️ استخدم LocalStorage بدلاً من Firebase');
  }
});

// ============================================
// Tips للتكامل السليم:
// ============================================

/*
1. تأكد دائماً من استخدام try-catch
2. تحقق من وجود Firebase قبل استخدامه
3. احفظ محلياً أولاً ثم على Firebase
4. استخدم الاستماع الفوري للبيانات المهمة
5. تعامل مع الأخطاء بشكل صحيح للمستخدم
6. اختبر بدون Internet (للـ LocalStorage)
7. استخدم Loading states عند الانتظار
8. عدّل قواعل الأمان حسب احتياجاتك
*/

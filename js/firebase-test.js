/**
 * Firebase Connection Test
 * ===============================
 * اختبر ما إذا كان Firebase موصول بشكل صحيح
 * 
 * استخدم هذا في Developer Console (F12):
 * testFirebaseSetup()
 */

async function testFirebaseSetup() {
  console.clear();
  console.log('🧪 اختبار Firebase Setup...\n');

  // ========== Test 1: SDK Loaded ==========
  console.log('1️⃣ التحقق من Firebase SDK...');
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK غير محمّل');
    console.log('   أضف: <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>');
    return false;
  }
  console.log('✅ Firebase SDK محمّل\n');

  // ========== Test 2: Config ==========
  console.log('2️⃣ التحقق من التكوين...');
  if (typeof FIREBASE_CONFIG === 'undefined') {
    console.error('❌ FIREBASE_CONFIG غير معرّفة');
    console.log('   تأكد من: js/firebase-config.js مُحمّلة');
    return false;
  }

  const hasPlaceholder = Object.values(FIREBASE_CONFIG).some(val =>
    String(val).includes('YOUR_') || String(val).includes('your-')
  );

  if (hasPlaceholder) {
    console.warn('⚠️ التكوين لم يتم تحديثه');
    console.log('   الرجاء تحديث firebase-config.js بـ بيانات Firebase الخاص بك');
    return false;
  }
  console.log('✅ التكوين صحيح');
  console.log(`   Project: ${FIREBASE_CONFIG.projectId}\n`);

  // ========== Test 3: Initialize ==========
  console.log('3️⃣ تهيئة Firebase...');
  if (!window.firebaseDB) {
    console.log('   يتم التهيئة الآن...');
    if (validateFirebaseConfig() && initializeFirebase()) {
      console.log('✅ تم تهيئة Firebase\n');
    } else {
      console.error('❌ فشل في تهيئة Firebase');
      return false;
    }
  } else {
    console.log('✅ Firebase مهيأة بالفعل\n');
  }

  // ========== Test 4: Services ==========
  console.log('4️⃣ التحقق من الخدمات...');
  if (typeof FirebaseService === 'undefined') {
    console.error('❌ FirebaseService غير محمّلة');
    return false;
  }
  console.log('✅ FirebaseService جاهزة');
  console.log(`   - Orders: ${typeof FirebaseService.Orders}`);
  console.log(`   - Analytics: ${typeof FirebaseService.Analytics}`);
  console.log(`   - Backup: ${typeof FirebaseService.Backup}\n`);

  // ========== Test 5: Connection ==========
  console.log('5️⃣ اختبار الاتصال بقاعدة البيانات...');
  try {
    const result = await FirebaseService.Orders.getAll();

    if (result.success) {
      console.log('✅ الاتصال ممتاز!');
      console.log(`   عدد الطلبات: ${result.orders.length}`);

      if (result.orders.length > 0) {
        console.log('\n   📋 آخر الطلبات:');
        result.orders.slice(0, 3).forEach((order, i) => {
          console.log(`      ${i + 1}. ${order.name} - ${order.price} جنيه`);
        });
      }
    } else {
      console.error('❌ خطأ:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ فشل الاتصال:', error.message);
    return false;
  }

  console.log('\n');

  // ========== Test 6: Summary ==========
  console.log('✅✅✅ جميع الاختبارات نجحت! ✅✅✅');
  console.log('\n📌 الخطوات التالية:');
  console.log('1. اختبر الكتابة: await testWrite()');
  console.log('2. اختبر الاستماع: await testSubscribe()');
  console.log('3. اختبر البحث: await testRead()');

  return true;
}

/**
 * Test Writing Data
 */
async function testWrite() {
  console.log('\n🧪 اختبار الكتابة...\n');

  try {
    const testOrder = {
      name: '🧪 طلب اختبار',
      phone: '201000000000',
      price: 99,
      frequency: 'اختبار',
      address: 'مدينة الاختبار'
    };

    console.log('📥 يتم الكتابة:', testOrder);

    const result = await FirebaseService.Orders.add(testOrder);

    if (result.success) {
      console.log('✅ تم الكتابة بنجاح!');
      console.log(`   معرّف الطلب: ${result.orderId}`);
      return result.orderId;
    } else {
      console.error('❌ فشل:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    return null;
  }
}

/**
 * Test Reading Data
 */
async function testRead() {
  console.log('\n🧪 اختبار القراءة...\n');

  try {
    const result = await FirebaseService.Orders.getRecent(5);

    if (result.success) {
      console.log(`✅ تم القراءة! عدد الطلبات: ${result.orders.length}`);
      console.table(result.orders);
      return result.orders;
    } else {
      console.error('❌ فشل:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    return [];
  }
}

/**
 * Test Real-time Subscription
 */
async function testSubscribe() {
  console.log('\n🧪 اختبار الاستماع الفوري...\n');

  try {
    console.log('📡 بانتظار البيانات (3 ثوان)...');

    let count = 0;
    const ref = FirebaseService.Orders.subscribe((result) => {
      count++;

      if (result.success) {
        console.log(`\n✅ استقبال رقم ${count}:`);
        console.log(`   عدد الطلبات: ${result.orders.length}`);

        if (count >= 2) {
          console.log('\n✅ الاستماع يعمل بشكل صحيح!');
          FirebaseService.Orders.unsubscribe(ref);
        }
      } else {
        console.error('❌ خطأ:', result.error);
      }
    });

    // توقف بعد 5 ثوان
    setTimeout(() => {
      if (count < 2) {
        console.log('⏱️ انتهت المهلة الزمنية');
        FirebaseService.Orders.unsubscribe(ref);
      }
    }, 5000);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * Test Statistics
 */
async function testStats() {
  console.log('\n🧪 اختبار الإحصائيات...\n');

  try {
    const result = await FirebaseService.Analytics.getStats();

    if (result.success) {
      const stats = result.stats;
      console.log('✅ الإحصائيات:');
      console.table(stats);
      return stats;
    } else {
      console.error('❌ فشل:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    return null;
  }
}

/**
 * Full Diagnostic
 */
async function fullDiagnostic() {
  console.clear();
  console.log(`
╔════════════════════════════════════════╗
║     🔥 Firebase Full Diagnostic 🔥     ║
║         One Market - الاختبار الكامل     ║
╚════════════════════════════════════════╝
  `);

  const setupOk = await testFirebaseSetup();
  if (!setupOk) {
    console.error('\n❌ تحقق من الإعدادات أعلاه');
    return;
  }

  // اختبر الكتابة
  const orderId = await testWrite();

  // اختبر القراءة
  await testRead();

  // اختبر الإحصائيات
  await testStats();

  // اختبر الاستماع
  await testSubscribe();

  console.log(`
╔════════════════════════════════════════╗
║        ✅ All Tests Completed ✅        ║
║           جاهز للإنتاج!                ║
╚════════════════════════════════════════╝
  `);
}

// ============================================
// استخدم في Console:
// ============================================

console.log(`
🧪 أوامر الاختبار:
  testFirebaseSetup()      - اختبر الإعدادات
  testWrite()              - اختبر الكتابة
  testRead()               - اختبر القراءة
  testSubscribe()          - اختبر الاستماع الفوري
  testStats()              - اختبر الإحصائيات
  fullDiagnostic()         - اختبار كامل شامل

اكتب اسم الدالة + Enter
`);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFirebaseSetup, testWrite, testRead, testSubscribe, testStats, fullDiagnostic };
}

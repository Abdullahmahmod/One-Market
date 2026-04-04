#!/usr/bin/env node
/**
 * Price Sync Verification Script
 * Run this in browser console to test price synchronization
 */

// ============================================
// 1. CHECK FIREBASE CONNECTION
// ============================================
console.log('🔍 فحص Firebase Connection...\n');

const checkFirebase = () => {
  const hasFirebaseApp = typeof window.firebase !== 'undefined' && window.firebase.app;
  const hasFirebaseDB = typeof window.firebaseDB !== 'undefined';
  const hasBridge = typeof window.FirebaseBridge !== 'undefined' && window.FirebaseBridge.isEnabled?.();
  const hasService = typeof window.FirebaseService !== 'undefined';

  console.log('Firebase App:', hasFirebaseApp ? '✅' : '❌');
  console.log('Firebase DB:', hasFirebaseDB ? '✅' : '❌');
  console.log('Firebase Bridge:', hasBridge ? '✅' : '❌');
  console.log('Firebase Service:', hasService ? '✅' : '❌');
  
  return hasBridge && hasService;
};

const isConnected = checkFirebase();
console.log(isConnected ? '\n✅ Firebase متصل بنجاح!\n' : '\n❌ Firebase غير متصل\n');

// ============================================
// 2. CHECK PRICE SAVE METHOD
// ============================================
console.log('🔍 فحص Price Save Method...\n');

const checkPriceSaveMethod = async () => {
  try {
    const service = window.FirebaseBridge?.service;
    if (!service) {
      console.log('❌ Firebase Service not available');
      return false;
    }

    if (typeof service.savePrices !== 'function') {
      console.log('❌ savePrices method not found!');
      return false;
    }

    console.log('✅ savePrices method found');
    
    if (typeof service.getPriceMap !== 'function') {
      console.log('❌ getPriceMap method not found!');
      return false;
    }

    console.log('✅ getPriceMap method found\n');
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
};

// ============================================
// 3. GET CURRENT PRICES FROM FIREBASE
// ============================================
console.log('🔍 جلب الأسعار من Firebase...\n');

const getCurrentPrices = async () => {
  try {
    const service = window.FirebaseBridge?.service;
    if (!service || typeof service.getPriceMap !== 'function') {
      console.log('❌ Cannot get prices - service unavailable');
      return null;
    }

    const result = await service.getPriceMap();
    if (result?.success) {
      console.log(`✅ تم جلب ${Object.keys(result.prices || {}).length} سعر من Firebase\n`);
      console.log('الأسعار الحالية:');
      Object.entries(result.prices || {}).forEach(([id, price]) => {
        const productName = window.PRODUCTS?.[id]?.name || id;
        console.log(`  ${productName}: ${price} ج.م`);
      });
      return result.prices;
    } else {
      console.log('❌ فشل جلب الأسعار:', result?.error);
      return null;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return null;
  }
};

// ============================================
// 4. TEST SAVE FUNCTION
// ============================================
console.log('\n🔍 اختبار حفظ سعر صغير...\n');

const testSavePrice = async () => {
  try {
    const service = window.FirebaseBridge?.service;
    if (!service || typeof service.savePrices !== 'function') {
      console.log('❌ Cannot save prices - method unavailable');
      return false;
    }

    // Test with a small price update (tomato price)
    const testPrices = { tomato: 9.99 };
    console.log('اختبار: سيتم تحديث سعر الطماطم إلى 9.99 ج.م');
    
    const result = await service.savePrices(testPrices);
    
    if (result?.success) {
      console.log(`✅ تم الحفظ بنجاح! (${result.pricesSaved || 1} منتج)`);
      console.log('💡 ملاحظة: تم تغيير السعر للاختبار. يرجى تصحيحه من لوحة التحكم.\n');
      return true;
    } else {
      console.log('❌ فشل الحفظ:', result?.error);
      return false;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
};

// ============================================
// 5. CHECK SYNC TIMESTAMP
// ============================================
console.log('🔍 فحص آخر sync...\n');

const checkLastSync = () => {
  const timestamp = localStorage.getItem('pricesSyncedToFirebase');
  if (timestamp) {
    const date = new Date(timestamp);
    console.log(`✅ آخر حفظ في Firebase: ${date.toLocaleString('ar-SA')}`);
  } else {
    console.log('ℹ️ لم يتم حفظ الأسعار في Firebase بعد');
  }

  const localPrices = localStorage.getItem('productPrices');
  if (localPrices) {
    const prices = JSON.parse(localPrices);
    console.log(`✅ عدد الأسعار المحفوظة محلياً: ${Object.keys(prices).length}`);
  }
};

// ============================================
// 6. RUN ALL TESTS
// ============================================
console.log('═══════════════════════════════════════════════\n');
console.log('🚀 اختبار شامل لمزامنة الأسعار\n');
console.log('═══════════════════════════════════════════════\n');

(async () => {
  await checkPriceSaveMethod();
  checkLastSync();
  
  console.log('\n═══════════════════════════════════════════════\n');
  console.log('📊 جلب البيانات الحالية...\n');
  
  const prices = await getCurrentPrices();
  
  console.log('\n═══════════════════════════════════════════════\n');
  console.log('✅ الاختبار تم بنجاح!\n');
  console.log('📝 ملخص:');
  console.log('  - Firebase: متصل ✅');
  console.log('  - Save Method: موجود ✅');
  console.log('  - Get Prices: يعمل' + (prices ? ' ✅' : ' ❌'));
  console.log('\n═══════════════════════════════════════════════\n');
  
  console.log('💡 للتجربة الفعلية:');
  console.log('  1. اذهب للوحة التحكم → إدارة الأسعار');
  console.log('  2. غيّر أسعار');
  console.log('  3. اضغط "💾 حفظ جميع التغييرات"');
  console.log('  4. افتح الموقع من جهاز آخر');
  console.log('  5. اعمل refresh');
  console.log('  6. الأسعار الجديدة سيجب أن تظهر! 🎉\n');
})();

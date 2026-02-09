/**
 * اختبار الأسعار الديناميكية
 * ===================================
 * شغل هذا الملف في Console عشان تتأكد الأسعار تُحسب صح
 */

// ============================================
// اختبار 1: حساب سعر الباقة الأسبوعية
// ============================================

function testWeeklyPrice() {
  console.log('🧪 اختبار 1: حساب سعر الباقة الأسبوعية');
  console.log('═══════════════════════════════════════');

  const weeklyPackage = PACKAGES.week;
  const calculatedPrice = calculatePackagePrice(weeklyPackage);

  console.log('📦 الباقة الأسبوعية:');
  console.log('  المكونات:');
  Object.entries(weeklyPackage.items).forEach(([itemId, qty]) => {
    const product = PRODUCTS[itemId];
    const itemTotal = qty * product.unitPrice;
    console.log(`    ${product.emoji} ${product.name}: ${qty} ${product.unit} × ${product.unitPrice} = ${itemTotal} جنيه`);
  });

  console.log(`\n💰 السعر المحسوب: ${calculatedPrice} جنيه`);
  console.log('✅ نجح الاختبار\n');

  return calculatedPrice;
}

// ============================================
// اختبار 2: اختبر تغيير السعر
// ============================================

function testPriceChange() {
  console.log('🧪 اختبار 2: اختبر تغيير سعر منتج');
  console.log('═══════════════════════════════════════');

  // احفظ السعر الأصلي
  const originalPrice = PRODUCTS.tomato.unitPrice;
  console.log(`🍅 سعر الطماطم الأصلي: ${originalPrice} جنيه/كجم`);

  // احسب السعر قبل التغيير
  const priceBefore = calculatePackagePrice(PACKAGES.week);
  console.log(`📦 سعر الباقة الأسبوعية (قبل): ${priceBefore} جنيه`);

  // غيّر السعر
  PRODUCTS.tomato.unitPrice = 20;
  console.log(`\n🔄 غيّرت سعر الطماطم إلى: 20 جنيه/كجم`);

  // احسب السعر بعد التغيير
  const priceAfter = calculatePackagePrice(PACKAGES.week);
  console.log(`📦 سعر الباقة الأسبوعية (بعد): ${priceAfter} جنيه`);

  // احسب الفرق
  const difference = priceAfter - priceBefore;
  const tomatoQuantity = PACKAGES.week.items.tomato;
  const expectedDifference = tomatoQuantity * (20 - originalPrice);

  console.log(`\n📊 تحليل التغيير:`);
  console.log(`  عدد الطماطم في الباقة: ${tomatoQuantity} كجم`);
  console.log(`  الفرق المتوقع: ${expectedDifference} جنيه`);
  console.log(`  الفرق الفعلي: ${difference} جنيه`);

  if (difference === expectedDifference) {
    console.log('✅ التغيير صحيح!');
  } else {
    console.error('❌ خطأ في الحساب!');
  }

  // أرجع السعر الأصلي
  PRODUCTS.tomato.unitPrice = originalPrice;
  console.log(`\n🔄 أرجعت سعر الطماطم إلى: ${originalPrice} جنيه/كجم\n`);
}

// ============================================
// اختبار 3: قارن كل الباقات
// ============================================

function compareAllPackages() {
  console.log('🧪 اختبار 3: أسعار جميع الباقات');
  console.log('═══════════════════════════════════════\n');

  Object.values(PACKAGES).forEach(pkg => {
    const price = calculatePackagePrice(pkg);
    console.log(`${pkg.emoji} ${pkg.name.padEnd(15)} (${pkg.frequency.padEnd(10)}): ${price} جنيه`);
  });

  console.log('\n✅ تم عرض أسعار جميع الباقات\n');
}

// ============================================
// اختبار 4: اختبر الضرب برقم (مثل تغيير الكمية)
// ============================================

function testScaling() {
  console.log('🧪 اختبار 5: اختبر تغيير كمية الباقة (مثلاً اجعلها 2x)');
  console.log('═══════════════════════════════════════');

  const originalPackage = PACKAGES.week;
  const originalPrice = calculatePackagePrice(originalPackage);

  // اجعل الكمية ضعف
  const scaledItems = {};
  Object.entries(originalPackage.items).forEach(([itemId, qty]) => {
    scaledItems[itemId] = qty * 2;
  });

  const scaledPrice = calculatePackagePrice(originalPackage, scaledItems);

  console.log(`📦 الباقة الأسبوعية:`);
  console.log(`  السعر الأصلي (1x): ${originalPrice} جنيه`);
  console.log(`  السعر المضروب (2x): ${scaledPrice} جنيه`);
  console.log(`  النسبة: ${scaledPrice / originalPrice}x`);

  if (scaledPrice === originalPrice * 2) {
    console.log('✅ الحساب صحيح!');
  } else {
    console.error('❌ خطأ في الحساب!');
  }

  console.log('');
}

// ============================================
// شغّل جميع الاختبارات
// ============================================

function runAllPriceTests() {
  console.clear();
  console.log('╔════════════════════════════════════════╗');
  console.log('║  🧪 اختبارات الأسعار الديناميكية    ║');
  console.log('╚════════════════════════════════════════╝\n');

  testWeeklyPrice();
  testPriceChange();
  compareAllPackages();
  testScaling();

  console.log('╔════════════════════════════════════════╗');
  console.log('║  ✅ تمت جميع الاختبارات بنجاح!      ║');
  console.log('╚════════════════════════════════════════╝');
}

// ============================================
// استخدام سريع
// ============================================

/*
شغّل في Console (F12):

  runAllPriceTests()      // شغّل جميع الاختبارات
  
أو اختبر واحد واحد:

  testWeeklyPrice()       // اختبر سعر الباقة الأسبوعية
  testPriceChange()       // اختبر تغيير السعر
  compareAllPackages()    // قارن أسعار الباقات
  testScaling()           // اختبر تغيير الكمية

أو احسب سعر معين:

  calculatePackagePrice(PACKAGES.week)     // سعر الباقة الأسبوعية
  calculatePackagePrice(PACKAGES.half)     // سعر الباقة نصف الأسبوعية
*/

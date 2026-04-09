const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://one-market-af394-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

async function checkProducts() {
  try {
    const snapshot = await db.ref('products').once('value');
    const products = snapshot.val();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 تقرير المنتجات على الموقع');
    console.log('='.repeat(80));
    
    if (!products) {
      console.log('❌ لا توجد منتجات');
      process.exit(0);
    }
    
    let activeCount = 0;
    let inactiveCount = 0;
    const productsList = [];
    
    Object.entries(products).forEach(([id, product]) => {
      const unitPrice = product.unitPrice || 0;
      const isActive = product.isActive !== false;
      const effective = (unitPrice > 0) && isActive;
      
      if (effective) activeCount++;
      else inactiveCount++;
      
      productsList.push({
        id,
        name: product.name,
        price: unitPrice,
        isActive,
        effective,
        emoji: product.emoji || '🧺'
      });
    });
    
    productsList.sort((a, b) => (a.effective === b.effective ? a.name.localeCompare(b.name) : b.effective - a.effective));
    
    console.log(`\n✅ المنتجات المفعلة: ${activeCount}`);
    console.log(`⏸️  المنتجات المعطلة: ${inactiveCount}`);
    console.log(`📊 الإجمالي: ${productsList.length}\n`);
    
    console.log('📌 المنتجات المفعلة (ظاهرة على الموقع):');
    console.log('-'.repeat(80));
    const active = productsList.filter(p => p.effective);
    if (active.length > 0) {
      active.forEach((p, i) => {
        console.log(`${i + 1}. ${p.emoji} ${p.name.padEnd(20)} - ${String(p.price).padStart(8)} ج.م [${p.id}]`);
      });
    } else {
      console.log('❌ لا توجد منتجات مفعلة!');
    }
    
    console.log('\n📌 المنتجات المعطلة (غير ظاهرة على الموقع):');
    console.log('-'.repeat(80));
    const inactive = productsList.filter(p => !p.effective);
    if (inactive.length > 0) {
      inactive.forEach((p, i) => {
        const reason = p.price === 0 ? 'السعر = 0' : 'معطل يدويًا';
        console.log(`${i + 1}. ${p.emoji} ${p.name.padEnd(20)} - ${reason.padStart(25)} [${p.id}]`);
      });
    } else {
      console.log('✅ لا توجد منتجات معطلة');
    }
    
    // Check custom products
    console.log('\n' + '='.repeat(80));
    console.log('📌 المنتجات المخصصة (Custom Products):');
    console.log('='.repeat(80));
    
    const customSnapshot = await db.ref('customProducts').once('value');
    const customProducts = customSnapshot.val();
    
    if (customProducts && Object.keys(customProducts).length > 0) {
      console.log(`✅ وجدت ${Object.keys(customProducts).length} منتجات مخصصة:\n`);
      Object.entries(customProducts).forEach(([id, product]) => {
        const price = product.unitPrice || 0;
        const isActive = product.isActive !== false;
        const status = (price > 0 && isActive) ? '✅ مفعل' : '⏸️  معطل';
        console.log(`- ${product.emoji} ${product.name} (${price} ج.م) - ${status} [${id}]`);
      });
    } else {
      console.log('ℹ️ لا توجد منتجات مخصصة');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

checkProducts();

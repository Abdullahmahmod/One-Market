const admin = require('firebase-admin');

// Check if already initialized
if (admin.apps.length === 0) {
  const envPath = process.env.FIREBASE_CREDENTIALS || './serviceAccountKey.json';
  try {
    const serviceAccount = require(envPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://one-market-af394-default-rtdb.europe-west1.firebasedatabase.app'
    });
  } catch (err) {
    console.error('❌ Failed to load credentials:', err.message);
    process.exit(1);
  }
}

const db = admin.database();

async function listProducts() {
  try {
    const snapshot = await db.ref('products').once('value');
    const products = snapshot.val();
    
    if (!products) {
      console.log('❌ No products found');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 قائمة المنتجات الموجودة على الموقع');
    console.log('='.repeat(80) + '\n');

    const productsList = [];
    
    Object.entries(products).forEach(([id, product]) => {
      const price = product.unitPrice || 0;
      const isActive = product.isActive !== false;
      const effective = (price > 0) && isActive;
      
      productsList.push({
        id,
        name: product.name || 'بدون اسم',
        emoji: product.emoji || '🧺',
        price,
        isActive,
        effective,
        unit: product.unit || 'وحدة'
      });
    });

    // Sort by name
    productsList.sort((a, b) => a.name.localeCompare(b.name));

    // Display with numbering
    productsList.forEach((p, index) => {
      const status = p.effective ? '✅' : '⏸️';
      console.log(`${String(index + 1).padStart(3)}. ${status} ${p.emoji} ${p.name.padEnd(25)} | ${p.unit.padEnd(8)} | ${String(p.price).padStart(6)} ج.م | [${p.id}]`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`📊 الإجمالي: ${productsList.length} منتج`);
    console.log(`✅ مفعل: ${productsList.filter(p => p.effective).length}`);
    console.log(`⏸️  معطل: ${productsList.filter(p => !p.effective).length}`);
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listProducts();

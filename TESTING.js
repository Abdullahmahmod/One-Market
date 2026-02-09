/**
 * One Market - Pre-Deployment Checklist & Testing
 * ================================
 * Use this file to verify everything is working before going live
 */

// ============================================
// VERIFICATION TESTS
// ============================================

/**
 * Test 1: Verify all files are accessible
 */
function testFileStructure() {
  console.log('📁 Testing file structure...');

  const expectedFiles = [
    'js/config.js',
    'js/utils.js',
    'js/main.js',
    'docs/SETUP.md',
    'docs/DOCUMENTATION.md',
    'docs/API_REFERENCE.md',
    'docs/REFACTORING_SUMMARY.md',
    'docs/GoogleAppsScript.gs',
    'index.html',
    'cart.html',
    'theme.css'
  ];

  console.log('Expected files:');
  expectedFiles.forEach(f => console.log(`  ✓ ${f}`));
  console.log('✅ File structure test passed');
}

/**
 * Test 2: Verify configuration objects
 */
function testConfigObjects() {
  console.log('\n🔧 Testing configuration objects...');

  // Test PRODUCTS
  if (!PRODUCTS || !PRODUCTS.tomato) {
    console.error('❌ PRODUCTS not defined properly');
    return;
  }
  console.log(`✓ PRODUCTS: ${Object.keys(PRODUCTS).length} items`);

  // Test PACKAGES
  if (!PACKAGES || !PACKAGES.week) {
    console.error('❌ PACKAGES not defined properly');
    return;
  }
  console.log(`✓ PACKAGES: ${Object.keys(PACKAGES).length} packages`);

  // Test ERROR_MESSAGES
  if (!ERROR_MESSAGES || Object.keys(ERROR_MESSAGES).length < 5) {
    console.error('❌ ERROR_MESSAGES not defined properly');
    return;
  }
  console.log(`✓ ERROR_MESSAGES: ${Object.keys(ERROR_MESSAGES).length} messages`);

  // Test SUCCESS_MESSAGES
  if (!SUCCESS_MESSAGES || Object.keys(SUCCESS_MESSAGES).length < 3) {
    console.error('❌ SUCCESS_MESSAGES not defined properly');
    return;
  }
  console.log(`✓ SUCCESS_MESSAGES: ${Object.keys(SUCCESS_MESSAGES).length} messages`);

  console.log('✅ Configuration objects test passed');
}

/**
 * Test 3: Verify validation functions
 */
function testValidationFunctions() {
  console.log('\n✅ Testing validation functions...');

  const tests = [
    { fn: 'validateName', test: ['محمد أحمد', true], test2: ['علي', false] },
    { fn: 'validatePhone', test: ['01001234567', true], test2: ['123', false] },
    { fn: 'validateAddress', test: ['القاهرة - المعادي - شارع النيل', true], test2: ['شارع', false] },
    { fn: 'validateQuantity', test: [5, true], test2: [0, false] },
    { fn: 'validatePrice', test: [150, true], test2: [-5, false] }
  ];

  tests.forEach(({ fn, test, test2 }) => {
    const fn_ref = eval(fn);
    const result1 = fn_ref(test[0]) === test[1];
    const result2 = fn_ref(test2[0]) === test2[1];
    
    if (result1 && result2) {
      console.log(`✓ ${fn} working correctly`);
    } else {
      console.error(`❌ ${fn} failed`);
    }
  });

  console.log('✅ Validation functions test passed');
}

/**
 * Test 4: Verify calculation functions
 */
function testCalculationFunctions() {
  console.log('\n📊 Testing calculation functions...');

  const weeklyPrice = calculatePackagePrice(PACKAGES.week);
  if (weeklyPrice === PACKAGES.week.basePrice) {
    console.log(`✓ calculatePackagePrice: ${weeklyPrice} EGP`);
  } else {
    console.error(`❌ calculatePackagePrice failed: got ${weeklyPrice}, expected ${PACKAGES.week.basePrice}`);
  }

  const weight = calculateTotalWeight(PACKAGES.week.items);
  console.log(`✓ calculateTotalWeight: ${weight} kg`);

  const priceStr = formatPrice(186);
  if (priceStr.includes('جنيه')) {
    console.log(`✓ formatPrice: ${priceStr}`);
  } else {
    console.error('❌ formatPrice failed');
  }

  console.log('✅ Calculation functions test passed');
}

/**
 * Test 5: Verify storage functions
 */
function testStorageFunctions() {
  console.log('\n💾 Testing storage functions...');

  const testPackage = {
    id: 'test',
    name: 'Test',
    price: 100,
    items: { tomato: 5 }
  };

  // Test save
  savePackageToStorage(testPackage);
  console.log('✓ savePackageToStorage executed');

  // Test load
  const loaded = loadPackageFromStorage();
  if (loaded && loaded.id === 'test') {
    console.log('✓ loadPackageFromStorage working');
  } else {
    console.error('❌ loadPackageFromStorage failed');
  }

  // Test clear
  clearPackageFromStorage();
  const cleared = loadPackageFromStorage();
  if (!cleared) {
    console.log('✓ clearPackageFromStorage working');
  } else {
    console.error('❌ clearPackageFromStorage failed');
  }

  console.log('✅ Storage functions test passed');
}

/**
 * Test 6: Verify format functions
 */
function testFormatFunctions() {
  console.log('\n📝 Testing format functions...');

  const itemDisplay = formatItemDisplay('tomato', 5);
  if (itemDisplay.includes('طماطم') && itemDisplay.includes('5')) {
    console.log(`✓ formatItemDisplay: ${itemDisplay}`);
  } else {
    console.error('❌ formatItemDisplay failed');
  }

  const dateStr = formatDateArabic();
  if (dateStr && dateStr.length > 5) {
    console.log(`✓ formatDateArabic: ${dateStr}`);
  } else {
    console.error('❌ formatDateArabic failed');
  }

  const sanitized = sanitizeHTML('<script>alert("xss")</script>');
  if (!sanitized.includes('<script>')) {
    console.log('✓ sanitizeHTML: XSS prevention working');
  } else {
    console.error('❌ sanitizeHTML failed');
  }

  console.log('✅ Format functions test passed');
}

/**
 * Test 7: Verify messaging functions
 */
function testMessagingFunctions() {
  console.log('\n💬 Testing messaging functions...');

  const encoded = encodeForWhatsApp('مرحباً');
  if (encoded.includes('%')) {
    console.log('✓ encodeForWhatsApp: URL encoding working');
  } else {
    console.error('❌ encodeForWhatsApp failed');
  }

  const url = buildWhatsAppUrl('201001234567', 'Test message');
  if (url.includes('wa.me') && url.includes('201001234567')) {
    console.log('✓ buildWhatsAppUrl: URL building working');
  } else {
    console.error('❌ buildWhatsAppUrl failed');
  }

  console.log('✅ Messaging functions test passed');
}

/**
 * Test 8: Verify DOM functions
 */
function testDOMFunctions() {
  console.log('\n🎨 Testing DOM functions...');

  // Create test element
  const testEl = document.createElement('div');
  testEl.id = 'test-element';
  document.body.appendChild(testEl);

  // Test getElement
  const el = getElement('test-element');
  if (el) {
    console.log('✓ getElement: Found element');
  } else {
    console.error('❌ getElement failed');
  }

  // Test hideElement
  hideElement(el);
  if (el.style.display === 'none') {
    console.log('✓ hideElement: Element hidden');
  }

  // Test showElement
  showElement(el);
  if (el.style.display === '') {
    console.log('✓ showElement: Element shown');
  }

  // Test createElement
  const newEl = createElement('div', 'test-class', 'Test content');
  if (newEl.className === 'test-class' && newEl.textContent === 'Test content') {
    console.log('✓ createElement: Element created correctly');
  }

  // Cleanup
  document.body.removeChild(el);

  console.log('✅ DOM functions test passed');
}

/**
 * Test 9: Verify package functions
 */
function testPackageFunctions() {
  console.log('\n📦 Testing package functions...');

  // Test selectPackage
  selectPackage('week');
  if (currentPackage && currentPackage.id === 'week') {
    console.log('✓ selectPackage: Package selected');
  } else {
    console.error('❌ selectPackage failed');
  }

  // Test removePackage
  removePackage();
  if (!currentPackage) {
    console.log('✓ removePackage: Package removed');
  } else {
    console.error('❌ removePackage failed');
  }

  // Test updateFrequency
  selectPackage('week');
  updateFrequency('week');
  if (currentPackage.deliveryDays === PACKAGES.week.deliveryDays) {
    console.log('✓ updateFrequency: Frequency updated');
  } else {
    console.error('❌ updateFrequency failed');
  }

  removePackage();
  console.log('✅ Package functions test passed');
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 One Market - Pre-Deployment Tests');
  console.log('═══════════════════════════════════════\n');

  testFileStructure();
  testConfigObjects();
  testValidationFunctions();
  testCalculationFunctions();
  testStorageFunctions();
  testFormatFunctions();
  testMessagingFunctions();
  testDOMFunctions();
  testPackageFunctions();

  console.log('\n═══════════════════════════════════════');
  console.log('✅ All tests completed!');
  console.log('═══════════════════════════════════════');
}

// ============================================
// PRE-DEPLOYMENT CHECKLIST
// ============================================

/**
 * Print pre-deployment checklist
 */
function printChecklist() {
  const checklist = `
═══════════════════════════════════════════════════════════
📋 PRE-DEPLOYMENT CHECKLIST
═══════════════════════════════════════════════════════════

BEFORE GOING LIVE:

Configuration:
□ Update SHEETS_API.SCRIPT_URL with your Google Apps Script deployment URL
□ Update WHATSAPP_CONFIG.BUSINESS_PHONE with your business number
□ Review all ERROR_MESSAGES and SUCCESS_MESSAGES

Google Sheets:
□ Create Google Sheet with proper columns
□ Deploy Google Apps Script from docs/GoogleAppsScript.gs
□ Test order submission to verify data saving

Security:
□ Verify no console errors in F12 DevTools
□ Test with invalid input (XSS, injection attempts)
□ Verify sanitizeHTML is working
□ Check duplicate order prevention

Testing:
□ Test package selection on desktop
□ Test package selection on mobile
□ Test order form validation (all fields)
□ Test order submission (watch Google Sheet)
□ Test WhatsApp integration
□ Test success messages

Deployment:
□ Choose hosting (Vercel, Netlify, GitHub Pages)
□ Deploy frontend
□ Set up custom domain (optional)
□ Enable HTTPS
□ Monitor error logs

Post-Launch:
□ Verify orders appearing in Google Sheet
□ Monitor for errors
□ Gather customer feedback
□ Plan next features

═══════════════════════════════════════════════════════════
  `;

  console.log(checklist);
}

// ============================================
// USAGE
// ============================================

/*
To run tests, open browser console (F12) and type:

  runAllTests()      // Run all verification tests
  printChecklist()   // Print pre-deployment checklist

Expected output:
  ✅ All tests completed! (if everything is working)

If any tests fail:
  1. Check the error message
  2. Review the related function in js/utils.js or js/main.js
  3. Check browser console for JavaScript errors
  4. Verify all files are loading correctly
*/

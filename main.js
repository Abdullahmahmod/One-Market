/**
 * One Market - Main Application Script
 * ================================
 * متجر الخضار الطازج — نظام إدارة الطلبات والعربة
 * تاريخ: 2026-01-30
 */

// ============================================
// 1. بيانات الباقات والمنتجات
// ============================================

/** بيانات الباقات المتاحة */
const packageData = {
  half: {
    name: 'نصف أسبوعية',
    emoji: '🔄',
    frequency: 'كل 3 أيام',
    price: 93,
    basePrice: 15.5,
    items: {
      tomato: 2.5,
      onion: 1.5,
      cucumber: 0.75,
      chili: 1,
      potato: 2.5
    }
  },
  week: {
    name: 'أسبوعية',
    emoji: '📦',
    frequency: 'أسبوعي',
    price: 186,
    basePrice: 31,
    items: {
      tomato: 5,
      onion: 3,
      cucumber: 1.5,
      chili: 2,
      potato: 5
    }
  },
  month: {
    name: 'شهرية',
    emoji: '📅',
    frequency: 'شهري',
    price: 744,
    basePrice: 124,
    items: {
      tomato: 20,
      onion: 12,
      cucumber: 6,
      chili: 8,
      potato: 20
    }
  }
};

/** تسميات المنتجات مع الرموز */
const itemLabels = {
  tomato: '🍅 طماطم',
  onion: '🧅 بصل',
  cucumber: '🥒 خيار',
  chili: '🌶️ شطة',
  potato: '🥔 بطاطس'
};

/** رموز المنتجات */
const itemEmojis = {
  tomato: '🍅',
  onion: '🧅',
  cucumber: '🥒',
  chili: '🌶️',
  potato: '🥔'
};

/** وحدات قياس المنتجات */
const itemUnits = {
  tomato: 'كجم',
  onion: 'كجم',
  cucumber: 'كجم',
  chili: 'وحدة',
  potato: 'كجم'
};

/** الأسعار الافتراضية للمنتج الواحد */
const defaultPrices = {
  tomato: 8,
  onion: 6,
  cucumber: 5,
  chili: 3,
  potato: 4
};

/** معاملات التكرار (أيام) */
const frequencyMultiplier = {
  half: 3,
  week: 7,
  month: 30
};

// ============================================
// 2. حالة التطبيق (Global State)
// ============================================

/** الباقة المختارة حالياً */
let currentPackage = null;

// ============================================
// 3. وظائف إدارة الباقات
// ============================================

/**
 * اختيار باقة من الباقات المتاحة
 * @param {string} pkgType - نوع الباقة (week, half, month, custom)
 */
function selectPackage(pkgType) {
  if (pkgType === 'custom') {
    showCustomPackageForm();
    return;
  }

  currentPackage = {
    type: pkgType,
    name: packageData[pkgType].name,
    emoji: packageData[pkgType].emoji,
    frequency: packageData[pkgType].frequency,
    price: packageData[pkgType].price,
    days: frequencyMultiplier[pkgType]
  };

  localStorage.setItem('cartPackage', JSON.stringify(currentPackage));
  window.location.href = 'cart.html';
}

/**
 * فتح نافذة خيارات الباقة (الكمية بالكجم + تكرار الطلب)
 * @param {string} pkgType
 */
function openPackageOptions(pkgType) {
  const pkg = packageData[pkgType];
  const modal = document.getElementById('packageOptionsModal');
  if (!modal || !pkg) {
    selectPackage(pkgType);
    return;
  }

  document.getElementById('pkgOptionsName').textContent = pkg.emoji + ' ' + pkg.name;
  document.getElementById('pkgOptionsBaseInfo').textContent = `${pkg.frequency} — السعر: ${pkg.price} جنيه`;

  const baseKg = computePackageTotalKg(pkgType) || 1;
  const qtyInput = document.getElementById('pkgOptionsQty');
  qtyInput.value = baseKg;
  qtyInput.dataset.pkgType = pkgType;
  document.getElementById('pkgOptionsRepeat').checked = false;

  modal.style.display = 'flex';
}

function closePackageOptions() {
  const modal = document.getElementById('packageOptionsModal');
  if (modal) modal.style.display = 'none';
}

/**
 * حساب مجموع الكيلو الافتراضي للباقة (يعتمد على عناصر بالوحدة 'كجم')
 */
function computePackageTotalKg(pkgType) {
  const pkg = packageData[pkgType];
  if (!pkg) return 0;
  let total = 0;
  Object.keys(pkg.items).forEach(item => {
    if (itemUnits[item] === 'كجم') total += pkg.items[item] || 0;
  });
  return Math.max(0.25, Math.round(total * 100) / 100);
}

/**
 * تأكيد الخيارات: بناء الباقة حسب الكمية والتكرار ثم الإضافة للعربة
 */
function confirmPackageOptions() {
  const qtyInput = document.getElementById('pkgOptionsQty');
  if (!qtyInput) return;
  const pkgType = qtyInput.dataset.pkgType;
  const qty = parseFloat(qtyInput.value) || 0;
  if (qty <= 0) {
    Swal.fire({ icon: 'warning', title: 'الكمية غير صحيحة', text: 'ادخل كمية أكبر من صفر', confirmButtonColor: '#2d8f4e' });
    return;
  }

  const repeat = !!document.getElementById('pkgOptionsRepeat').checked;
  const pkg = packageData[pkgType];
  const baseKg = computePackageTotalKg(pkgType) || 1;
  const scale = qty / baseKg;

  // حساب العناصر والسعر بعد التدرّج
  const itemsScaled = {};
  let totalPrice = 0;
  Object.keys(pkg.items).forEach(item => {
    const baseAmount = pkg.items[item] || 0;
    const scaled = Math.round((baseAmount * scale + Number.EPSILON) * 100) / 100;
    if (scaled > 0) itemsScaled[item] = scaled;
    const pricePerUnit = defaultPrices[item] || 0;
    if (itemUnits[item] === 'كجم') totalPrice += scaled * pricePerUnit;
  });

  // إذا لم توجد عناصر كيلو (نادر) نعتمد سعر الباقة كسعر أساسي مضروب بالمقياس
  if (Object.keys(itemsScaled).length === 0) {
    totalPrice = Math.round((pkg.price * scale + Number.EPSILON));
  } else {
    totalPrice = Math.round(totalPrice);
  }

  currentPackage = {
    type: pkgType,
    name: pkg.name,
    emoji: pkg.emoji,
    frequency: pkg.frequency,
    days: frequencyMultiplier[pkgType],
    items: itemsScaled,
    price: totalPrice,
    repeat: repeat
  };

  localStorage.setItem('cartPackage', JSON.stringify(currentPackage));
  closePackageOptions();
  window.location.href = 'cart.html';
}

/**
 * عرض نموذج الباقة المخصصة
 */
function showCustomPackageForm() {
  const form = document.getElementById('customItemsForm');
  if (!form) return;

  form.innerHTML = '';

  Object.keys(itemLabels).forEach(item => {
    const html = `
      <div class="custom-item-input">
        <label>${itemLabels[item]}</label>
        <div class="input-group">
          <input type="number" min="0" step="0.5" value="1" data-item="${item}" class="qty-custom-input" placeholder="الوزن">
          <span class="unit">${itemUnits[item]}</span>
        </div>
      </div>
    `;
    form.innerHTML += html;
  });

  const customSection = document.getElementById('customPackageSection');
  if (customSection) {
    customSection.style.display = 'flex';
  }
}

/**
 * إغلاق نموذج الباقة المخصصة
 */
function closeCustomPackage() {
  const customSection = document.getElementById('customPackageSection');
  if (customSection) {
    customSection.style.display = 'none';
  }
  currentPackage = null;
}

/**
 * إضافة باقة مخصصة للعربة
 */
function addCustomPackageToCart() {
  const items = {};
  let totalPrice = 0;

  document.querySelectorAll('.qty-custom-input').forEach(input => {
    const item = input.dataset.item;
    const qty = parseFloat(input.value) || 0;
    if (qty > 0) {
      items[item] = qty;
      totalPrice += qty * defaultPrices[item];
    }
  });

  if (Object.keys(items).length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'اختر المكونات',
      text: 'اختر وزن واحد على الأقل',
      confirmButtonColor: '#2d8f4e'
    });
    return;
  }

  currentPackage = {
    type: 'custom',
    name: 'مخصصة',
    emoji: '⚙️',
    items: items,
    price: totalPrice,
    days: 1
  };

  localStorage.setItem('cartPackage', JSON.stringify(currentPackage));
  window.location.href = 'cart.html';
}

/**
 * تحديث عرض العربة
 */
function updateCart() {
  const cartEl = document.getElementById('cartItems');
  const cartModalEl = document.getElementById('cartModalItems');
  const totalEl = document.getElementById('totalPrice');
  const totalModalEl = document.getElementById('totalPriceModal');

  if (!cartEl && !cartModalEl) return;

  if (!currentPackage) {
    const emptyMsg = '<p class="empty-cart">اختر باقة لإضافتها للعربة</p>';
    if (cartEl) cartEl.innerHTML = emptyMsg;
    if (cartModalEl) cartModalEl.innerHTML = emptyMsg;
    if (totalEl) totalEl.textContent = '0 جنيه';
    if (totalModalEl) totalModalEl.textContent = '0 جنيه';
    return;
  }

  let itemsDisplay = '';
  if (currentPackage.type === 'custom') {
    Object.keys(currentPackage.items).forEach(item => {
      const qty = currentPackage.items[item];
      itemsDisplay += `<li>${itemEmojis[item]} ${itemLabels[item].split(' ')[1]} ${qty} ${itemUnits[item]}</li>`;
    });
  } else {
    const pkg = packageData[currentPackage.type];
    Object.keys(pkg.items).forEach(item => {
      const qty = pkg.items[item];
      itemsDisplay += `<li>${itemEmojis[item]} ${itemLabels[item].split(' ')[1]} ${qty} ${itemUnits[item]}</li>`;
    });
  }

  const frequencyOptions = ['half', 'week', 'month']
    .map(freq => `<option value="${freq}" ${currentPackage.days === frequencyMultiplier[freq] ? 'selected' : ''} >${packageData[freq].frequency}</option>`)
    .join('');

  const cartHTML = `
    <div class="package-in-cart">
      <div class="package-title">
        <span>${currentPackage.emoji} ${currentPackage.name}</span>
        <button type="button" class="btn-remove-package" onclick="removePackage()">✕</button>
      </div>
      <ul class="package-items-display">${itemsDisplay}</ul>
      <div class="frequency-selector">
        <label>التكرار:</label>
        <select id="frequencySelect" onchange="updateFrequency(this.value)">
          ${frequencyOptions}
        </select>
      </div>
      <div class="repeat-display" style="margin-top:6px;">تكرار الطلب: <b>${currentPackage.repeat ? 'نعم' : 'لا'}</b></div>
      <div class="package-price-display">السعر: <span>${currentPackage.price} جنيه</span></div>
    </div>
  `;

  if (cartEl) cartEl.innerHTML = cartHTML;
  if (cartModalEl) cartModalEl.innerHTML = cartHTML;
  if (totalEl) totalEl.textContent = currentPackage.price + ' جنيه';
  if (totalModalEl) totalModalEl.textContent = currentPackage.price + ' جنيه';
}

/**
 * تحديث التكرار والسعر
 * @param {string} freq - نوع التكرار
 */
function updateFrequency(freq) {
  const pkg = packageData[freq];

  if (currentPackage.type === 'custom') {
    const basePricePerDay = currentPackage.price;
    currentPackage.price = Math.round(basePricePerDay * frequencyMultiplier[freq]);
  } else {
    currentPackage.price = pkg.price;
  }

  currentPackage.days = frequencyMultiplier[freq];
  currentPackage.frequency = pkg.frequency;

  updateCart();
}

/**
 * إزالة الباقة من العربة
 */
function removePackage() {
  currentPackage = null;
  updateCart();
}



// ============================================
// 4. Cart & Checkout (cart.html, checkout.html)
// ============================================

/**
 * Load package data from localStorage
 */
function loadCartData(target = 'cart') {
  const savedData = localStorage.getItem('cartPackage');
  if (savedData) {
    currentPackage = JSON.parse(savedData);
  } else {
    currentPackage = null;
  }

  if (target === 'cart') {
    renderCart();
  } else if (target === 'checkout') {
    renderCheckout();
  }
}

/**
 * Render cart summary (cart.html)
 */
function renderCart() {
  const contentEl = document.getElementById('cartContent');
  if (!contentEl) return;

  if (!currentPackage) {
    contentEl.innerHTML = `
      <div class="empty-cart-message">
        <div class="empty-cart-icon">🛒</div>
        <div class="empty-cart-text">العربة فارغة</div>
        <a href="index.html" class="continue-shopping-btn">ابدأ التسوق</a>
      </div>
    `;
    updateCheckoutCTA(false);
    return;
  }

  let itemsDisplay = '';
  if (currentPackage.type === 'custom') {
    Object.keys(currentPackage.items).forEach(item => {
      const qty = currentPackage.items[item];
      itemsDisplay += `<li>${itemEmojis[item]} ${itemLabels[item].split(' ')[1]} ${qty} ${itemUnits[item]}</li>`;
    });
  } else {
    const pkg = packageData[currentPackage.type];
    Object.keys(pkg.items).forEach(item => {
      const qty = pkg.items[item];
      itemsDisplay += `<li>${itemEmojis[item]} ${itemLabels[item].split(' ')[1]} ${qty} ${itemUnits[item]}</li>`;
    });
  }

  const frequencyOptions = ['half', 'week', 'month']
    .map(freq => `<option value="${freq}" ${currentPackage.days === frequencyMultiplier[freq] ? 'selected' : ''} >${packageData[freq].frequency}</option>`)
    .join('');

  const html = `
    <div class="package-display">
      <div class="package-header">${currentPackage.emoji} ${currentPackage.name}</div>
      <ul class="package-items">${itemsDisplay}</ul>
    </div>

    <div class="frequency-box">
      <label class="frequency-label">اختر التكرار:</label>
      <select class="frequency-select" id="frequencySelect" onchange="updateFrequencyDisplay(this.value)">
        ${frequencyOptions}
      </select>
    </div>

    <div class="price-display" id="priceDisplay">💰 ${currentPackage.price} جنيه</div>
  `;

  contentEl.innerHTML = html;
  updateCheckoutCTA(true);
}

function updateCheckoutCTA(hasPackage) {
  const checkoutBtn = document.getElementById('goToCheckout');
  const checkoutNote = document.getElementById('checkoutNote');
  if (!checkoutBtn) return;

  checkoutBtn.disabled = !hasPackage;
  checkoutBtn.onclick = () => {
    if (!hasPackage) return;
    window.location.href = 'checkout.html';
  };

  if (checkoutNote) {
    checkoutNote.textContent = hasPackage ? '' : 'اختر باقة أولا.';
  }
}

/**
 * Render checkout page (checkout.html)
 */
function renderCheckout() {
  const summaryEl = document.getElementById('checkoutSummary');
  const formWrapper = document.getElementById('checkoutFormWrapper');
  if (!summaryEl || !formWrapper) return;

  if (!currentPackage) {
    summaryEl.innerHTML = `
      <div class="empty-cart-message">
        <div class="empty-cart-icon">🛒</div>
        <div class="empty-cart-text">العربة فارغة</div>
        <a href="cart.html" class="continue-shopping-btn">ابدأ التسوق</a>
      </div>
    `;
    formWrapper.innerHTML = `<p class="form-placeholder">اختر باقة أولا.</p>`;
    return;
  }

  let itemsDisplay = '';
  if (currentPackage.type === 'custom') {
    Object.keys(currentPackage.items).forEach(item => {
      const qty = currentPackage.items[item];
      itemsDisplay += `<li>${itemEmojis[item]} ${itemLabels[item].split(' ')[1]} ${qty} ${itemUnits[item]}</li>`;
    });
  } else {
    const pkg = packageData[currentPackage.type];
    Object.keys(pkg.items).forEach(item => {
      const qty = pkg.items[item];
      itemsDisplay += `<li>${itemEmojis[item]} ${itemLabels[item].split(' ')[1]} ${qty} ${itemUnits[item]}</li>`;
    });
  }

  const frequencyOptions = ['half', 'week', 'month']
    .map(freq => `<option value="${freq}" ${currentPackage.days === frequencyMultiplier[freq] ? 'selected' : ''} >${packageData[freq].frequency}</option>`)
    .join('');

  summaryEl.innerHTML = `
    <div class="package-display">
      <div class="package-header">${currentPackage.emoji} ${currentPackage.name}</div>
      <ul class="package-items">${itemsDisplay}</ul>
    </div>

    <div class="frequency-box">
      <label class="frequency-label">اختر التكرار:</label>
      <select class="frequency-select" id="frequencySelect" onchange="updateFrequencyDisplay(this.value)">
        ${frequencyOptions}
      </select>
    </div>

    <div class="price-display" id="priceDisplay">💰 ${currentPackage.price} جنيه</div>
  `;

  formWrapper.innerHTML = `
    <div class="form-section">
      <div class="form-title">بيانات التوصيل</div>
      <form id="orderForm">
        <div class="form-group">
          <label for="name">الاسم</label>
          <input type="text" id="name" name="name" placeholder="اكتب اسمك كاملا" required>
        </div>

        <div class="form-group">
          <label for="phone">الهاتف</label>
          <input type="tel" id="phone" name="phone" placeholder="010 xxxx xxxx" required>
        </div>

        <div class="form-group">
          <label for="address">العنوان</label>
          <input type="text" id="address" name="address" placeholder="عنوان التوصيل" required>
        </div>

        <div class="form-group">
          <label><input type="checkbox" id="repeatOrder" ${currentPackage.repeat ? 'checked' : ''}/> تكرار الطلب</label>
        </div>

        <div class="form-title">طريقة الدفع</div>
        <div class="payment-options">
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="cod" checked>
            الدفع عند الاستلام
          </label>
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="vodafone">
            فودافون كاش
          </label>
        </div>

        <div id="vodafoneDetails" class="vodafone-details" style="display:none;">
          <div class="form-group">
            <label for="vodafoneNumber">رقم فودافون كاش المحول منه</label>
            <input type="tel" id="vodafoneNumber" placeholder="010 xxxx xxxx">
          </div>
          <p class="payment-hint">سيتم التواصل لتأكيد التحويل.</p>
        </div>

        <button type="submit" class="submit-button">تأكيد الطلب</button>
      </form>
    </div>
  `;

  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', handleSubmit);
  }

  setupPaymentOptions();
}

function setupPaymentOptions() {
  const optionLabels = document.querySelectorAll('.payment-option');
  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  const vodafoneDetails = document.getElementById('vodafoneDetails');
  const vodafoneNumber = document.getElementById('vodafoneNumber');

  if (!radios.length) return;

  const update = () => {
    optionLabels.forEach(label => {
      const input = label.querySelector('input');
      if (!input) return;
      label.classList.toggle('active', input.checked);
    });

    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    const isVodafone = selected && selected.value === 'vodafone';

    if (vodafoneDetails) {
      vodafoneDetails.style.display = isVodafone ? 'block' : 'none';
    }
    if (vodafoneNumber) {
      vodafoneNumber.required = !!isVodafone;
    }
  };

  radios.forEach(radio => radio.addEventListener('change', update));
  update();
}

/**
 * Update price when frequency changes
 */
function updateFrequencyDisplay(freq) {
  const pkg = packageData[freq];

  if (currentPackage.type === 'custom') {
    const basePricePerDay = currentPackage.price;
    currentPackage.price = Math.round(basePricePerDay * frequencyMultiplier[freq]);
  } else {
    currentPackage.price = pkg.price;
  }

  currentPackage.days = frequencyMultiplier[freq];
  currentPackage.frequency = pkg.frequency;

  localStorage.setItem('cartPackage', JSON.stringify(currentPackage));

  const priceDisplay = document.getElementById('priceDisplay');
  if (priceDisplay) {
    priceDisplay.textContent = `💰 ${currentPackage.price} جنيه`;
  }
}

/**
 * Handle order submission
 */
async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();

  const repeatCheckbox = document.getElementById('repeatOrder');
  const repeat = repeatCheckbox ? !!repeatCheckbox.checked : !!currentPackage.repeat;

  if (!name || !phone || !address) {
    Swal.fire({
      icon: 'warning',
      title: '\u0627\u0643\u0645\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a',
      text: '\u0627\u0644\u0631\u062c\u0627\u0621 \u0645\u0644\u0621 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644',
      confirmButtonColor: '#2d8f4e'
    });
    return;
  }

  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : '';
  const vodafoneNumberEl = document.getElementById('vodafoneNumber');
  const vodafoneNumber = vodafoneNumberEl ? vodafoneNumberEl.value.trim() : '';

  if (!paymentMethod) {
    Swal.fire({
      icon: 'warning',
      title: '\u0627\u062e\u062a\u0631 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639',
      confirmButtonColor: '#2d8f4e'
    });
    return;
  }

  if (paymentMethod === 'vodafone' && !vodafoneNumber) {
    Swal.fire({
      icon: 'warning',
      title: '\u0627\u062f\u062e\u0644 \u0631\u0642\u0645 \u0641\u0648\u062f\u0627\u0641\u0648\u0646 \u0643\u0627\u0634',
      confirmButtonColor: '#2d8f4e'
    });
    return;
  }

  const paymentLabel = paymentMethod === 'vodafone'
    ? '\u0641\u0648\u062f\u0627\u0641\u0648\u0646 \u0643\u0627\u0634'
    : '\u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645';

  const frequencyText = currentPackage.frequency || '\u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629';
  const packageText = currentPackage.type === 'custom' ? '\u0645\u062e\u0635\u0635\u0629' : currentPackage.name;

  const summaryHtml = `
    <div style="text-align: right; direction: rtl; font-size: 14px;">
      <div><b>\u0627\u0644\u0627\u0633\u0645:</b> ${name}</div>
      <div><b>\u0627\u0644\u0647\u0627\u062a\u0641:</b> ${phone}</div>
      <div><b>\u0627\u0644\u0639\u0646\u0648\u0627\u0646:</b> ${address}</div>
      <hr style="margin: 10px 0;">
      <div><b>\u0627\u0644\u0628\u0627\u0642\u0629:</b> ${packageText}</div>
      <div><b>\u0627\u0644\u062a\u0643\u0631\u0627\u0631:</b> ${frequencyText}</div>
      <div><b>\u062a\u0643\u0631\u0627\u0631 \u0627\u0644\u0637\u0644\u0628:</b> ${repeat ? '\u0646\u0639\u0645' : '\u0644\u0627'}</div>
      <div><b>\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639:</b> ${paymentLabel}</div>
      ${paymentMethod === 'vodafone' ? `<div><b>\u0631\u0642\u0645 \u0641\u0648\u062f\u0627\u0641\u0648\u0646 \u0643\u0627\u0634:</b> ${vodafoneNumber}</div>` : ''}
      <div style="margin-top: 10px;"><b>\u0627\u0644\u0645\u062c\u0645\u0648\u0639:</b> <span style="color: #2d8f4e; font-size: 18px;">${currentPackage.price} \u062c\u0646\u064a\u0647</span></div>
    </div>
  `;

  const result = await Swal.fire({
    title: '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628',
    html: summaryHtml,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628',
    cancelButtonText: '\u062a\u0639\u062f\u064a\u0644',
    confirmButtonColor: '#2d8f4e'
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: '\u062c\u0627\u0631\u064a \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  const orderData = {
    name,
    phone,
    address,
    price: currentPackage.price,
    packageData: currentPackage,
    frequency: frequencyText,
    paymentMethod: paymentLabel,
    vodafoneNumber: vodafoneNumber || ''
  };

  let submitted = true;
  if (typeof submitOrderToSheets === 'function') {
    submitted = await submitOrderToSheets(orderData);
  }

  if (!submitted) {
    Swal.fire({
      icon: 'error',
      title: '\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628',
      text: '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0649 Google Sheets. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.',
      confirmButtonColor: '#2d8f4e'
    });
    return;
  }

  Swal.fire({
    icon: 'success',
    title: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628!',
    html: `<div style="text-align: center; direction: rtl;">
      <p>\u0634\u0643\u0631\u0627 \u0644\u0637\u0644\u0628\u0643</p>
      <p>\u0633\u064a\u062a\u0645 \u062a\u0648\u0635\u064a\u0644 \u0637\u0644\u0628\u0643 \u0642\u0631\u064a\u0628\u0627</p>
      <p style="color: #2d8f4e; font-weight: bold; font-size: 16px;">\u{1F4B0} ${currentPackage.price} \u062c\u0646\u064a\u0647</p>
    </div>`,
    confirmButtonColor: '#2d8f4e'
  }).then(() => {
    localStorage.removeItem('cartPackage');
    window.location.href = 'index.html';
  });
}

// 5. Page init
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('cart.html')) {
    loadCartData('cart');
  }
  if (window.location.pathname.includes('checkout.html')) {
    loadCartData('checkout');
  }

  console.log('One Market - Script loaded successfully');
});

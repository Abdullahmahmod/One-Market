/**
 * One Market - Main Application Script (Refactored)
 * ================================
 * متجر الخضار الطازج — نظام إدارة الطلبات والعربة
 * Modular, optimized version with utilities and centralized config
 */

// ============================================
// GLOBAL STATE
// ============================================

let currentPackage = null;
let pricesLoaded = false;
const API_BASE = (typeof window !== 'undefined' && window.API_BASE_URL)
  ? window.API_BASE_URL.replace(/\/$/, '')
  : 'https://one-market-backend-production.up.railway.app';

function getDeliveryFee() {
  const fee = Number(APP_CONFIG?.deliveryFee);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}

function calculateOrderTotal(subtotal) {
  const base = Number(subtotal) || 0;
  return Number((base + getDeliveryFee()).toFixed(2));
}

function getEstimatedReadyMinutes() {
  const minutes = Number(APP_CONFIG?.estimatedReadyMinutes);
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 45;
}

function calculateEstimatedReadyAt(baseDate = new Date(), minutes = getEstimatedReadyMinutes()) {
  const base = baseDate instanceof Date ? baseDate : new Date(baseDate);
  if (!Number.isFinite(base.getTime())) return null;
  return new Date(base.getTime() + (minutes * 60 * 1000));
}

function formatEstimatedReadyLabel(dateLike, minutes = getEstimatedReadyMinutes()) {
  const readyDate = dateLike ? new Date(dateLike) : null;
  if (!readyDate || !Number.isFinite(readyDate.getTime())) {
    return `بعد ${minutes} دقيقة من تأكيد الطلب`;
  }
  return `${formatDateArabic(readyDate)} (بعد ${minutes} دقيقة)`;
}

function formatDeliveryFeeLabel(value = getDeliveryFee()) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'مجاني';
  return formatPrice(amount);
}

function buildPriceBreakdownCard(subtotal, totalId = 'priceDisplay') {
  const cleanSubtotal = Number(subtotal) || 0;
  const deliveryFee = getDeliveryFee();
  const total = calculateOrderTotal(cleanSubtotal);
  const idAttr = totalId ? ` id="${totalId}"` : '';

  return `
    <div class="price-card price-card-breakdown">
      <div class="price-line">
        <span class="price-label">سعر المنتجات:</span>
        <span class="price-value-sm">${formatPrice(cleanSubtotal)}</span>
      </div>
      <div class="price-line">
        <span class="price-label">خدمة التوصيل:</span>
        <span class="price-value-sm">${formatDeliveryFeeLabel(deliveryFee)}</span>
      </div>
      <div class="price-line total">
        <span class="price-label">الإجمالي:</span>
        <span class="price-value"${idAttr}>${formatPrice(total)}</span>
      </div>
    </div>
  `;
}

// ============================================
// PACKAGE MANAGEMENT
// ============================================

function filterItemsWithPrice(items) {
  const cleaned = {};
  Object.entries(items || {}).forEach(([id, qty]) => {
    const price = PRODUCTS[id]?.unitPrice;
    if (Number.isFinite(price) && price > 0 && Number(qty) > 0) {
      cleaned[id] = qty;
    }
  });
  return cleaned;
}

/**
 * Select and save a predefined package
 * @param {string} packageId - Package ID (half, week)
 */
function extractItemsFromCard(card) {
  if (!card) return null;
  const items = {};
  const inputs = card.querySelectorAll('.qty-input');
  inputs.forEach(input => {
    const product = input.getAttribute('data-product');
    const qty = parseFloat(input.value);
    if (!product || isNaN(qty) || qty <= 0) return;
    items[product] = qty;
  });
  return Object.keys(items).length ? items : null;
}

function selectPackage(packageId, cardEl = null) {
  assertPricesLoaded();
  const pkg = PACKAGES[packageId];
  if (!pkg) {
    console.error('❌ Package not found:', packageId);
    return;
  }

  const cardItems = extractItemsFromCard(cardEl);
  const items = filterItemsWithPrice(cardItems || { ...pkg.items });
  if (!Object.keys(items).length) {
    showErrorMessage('لا توجد عناصر صالحة بهذه الباقة (أسعار مفقودة).');
    return;
  }

  currentPackage = {
    id: pkg.id,
    name: pkg.name,
    emoji: pkg.emoji,
    frequency: pkg.frequency,
    deliveryDays: pkg.deliveryDays,
    items,
    price: recalcPriceFromItems(items),
    isRecurring: false,
    createdAt: new Date().toISOString()
  };

  savePackageToStorage(currentPackage);
  showSuccessMessage(SUCCESS_MESSAGES.PACKAGE_ADDED);
  setTimeout(() => window.location.href = 'cart.html', 500);
}

/**
 * Open package customization dialog
 * @param {string} packageId - Package ID to customize
 */
function openPackageOptions(packageId, triggerEl = null) {
  assertPricesLoaded();
  const pkg = PACKAGES[packageId];
  if (!pkg) {
    selectPackage(packageId, triggerEl?.closest('.package-card'));
    return;
  }

  const modal = getElement('packageOptionsModal');
  if (!modal) {
    selectPackage(packageId, triggerEl?.closest('.package-card'));
    return;
  }

  const card = triggerEl?.closest('.package-card');
  const baseItems = filterItemsWithPrice(extractItemsFromCard(card) || { ...pkg.items });
  if (!Object.keys(baseItems).length) {
    showErrorMessage('لا توجد عناصر صالحة لعرضها (أسعار مفقودة).');
    return;
  }

  // Calculate dynamic price from current product prices
  const dynamicPrice = recalcPriceFromItems(baseItems);

  // Update modal header
  const titleEl = getElement('pkgOptionsName');
  const infoEl = getElement('pkgOptionsBaseInfo');
  if (titleEl) titleEl.textContent = `${pkg.emoji} ${pkg.name}`;
  if (infoEl) infoEl.textContent = `${pkg.frequency} — السعر: ${formatPrice(dynamicPrice)}`;

  // Set quantity input
  const qtyInput = getElement('pkgOptionsQty');
  const totalWeight = calculateTotalWeight(baseItems);
  if (qtyInput) {
    qtyInput.value = totalWeight;
    qtyInput.dataset.packageId = packageId;
  }

  // Reset repeat checkbox
  const repeatCheckbox = getElement('pkgOptionsRepeat');
  if (repeatCheckbox) repeatCheckbox.checked = false;

  modal.style.display = 'flex';
}

/**
 * Close package customization modal
 */
function closePackageOptions() {
  const modal = getElement('packageOptionsModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Confirm package customization and add to cart
 */
function confirmPackageOptions() {
  const qtyInput = getElement('pkgOptionsQty');
  const repeatCheckbox = getElement('pkgOptionsRepeat');

  if (!qtyInput) return;

  const packageId = qtyInput.dataset.packageId;
  const qty = parseFloat(qtyInput.value);
  const isRecurring = repeatCheckbox ? repeatCheckbox.checked : false;

  if (!validateQuantity(qty)) {
    showErrorMessage(ERROR_MESSAGES.INVALID_QTY);
    return;
  }

  const pkg = PACKAGES[packageId];
  if (!pkg) return;

  const card = document.querySelector(`.package-card[data-package="${packageId}"]`);
  const baseItems = filterItemsWithPrice(extractItemsFromCard(card) || { ...pkg.items });
  if (!Object.keys(baseItems).length) {
    showErrorMessage('لا توجد عناصر صالحة بهذه الباقة.');
    return;
  }
  const baseWeight = calculateTotalWeight(baseItems) || 1;
  const scaleFactor = qty / baseWeight;

  // Scale items
  const scaledItems = {};
  Object.entries(baseItems).forEach(([itemId, baseQty]) => {
    const scaled = roundToDecimals(baseQty * scaleFactor, 2);
    if (scaled > 0) scaledItems[itemId] = scaled;
  });

  const scaledPrice = recalcPriceFromItems(scaledItems);

  currentPackage = {
    id: packageId,
    name: pkg.name,
    emoji: pkg.emoji,
    frequency: pkg.frequency,
    deliveryDays: pkg.deliveryDays,
    items: scaledItems,
    price: scaledPrice,
    isRecurring,
    createdAt: new Date().toISOString()
  };

  savePackageToStorage(currentPackage);
  closePackageOptions();
  showSuccessMessage(SUCCESS_MESSAGES.PACKAGE_ADDED);
  setTimeout(() => window.location.href = 'cart.html', 500);
}



/**
 * Remove current package from cart
 */
function removePackage() {
  currentPackage = null;
  clearPackageFromStorage();
  updateCartDisplay();
}

// ============================================
// CART DISPLAY & UPDATE
// ============================================

/**
 * Update cart display on current page
 */
function updateCartDisplay() {
  const cartEl = getElement('cartItems');
  const modalEl = getElement('cartModalItems');
  const totalEl = getElement('totalPrice');
  const totalModalEl = getElement('totalPriceModal');

  if (!cartEl && !modalEl) return;

  if (!currentPackage) {
    const emptyMsg = '<p class="empty-cart">أضف منتجات لإضافتها للعربة</p>';
    if (cartEl) cartEl.innerHTML = emptyMsg;
    if (modalEl) modalEl.innerHTML = emptyMsg;
    if (totalEl) totalEl.textContent = '0 جنيه';
    if (totalModalEl) totalModalEl.textContent = '0 جنيه';
    return;
  }

  // Build items display
  const itemsDisplay = Object.entries(currentPackage.items)
    .map(([itemId, qty]) => `<li>${formatItemDisplay(itemId, qty)}</li>`)
    .join('');

  // Build frequency options
  const frequencyOptions = Object.values(PACKAGES)
    .map(pkg => {
      const selected = currentPackage.deliveryDays === pkg.deliveryDays ? 'selected' : '';
      return `<option value="${pkg.id}" ${selected}>${pkg.frequency}</option>`;
    })
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
      <div class="recurring-display" style="margin-top: 6px;">
        تكرار الطلب: <b>${currentPackage.isRecurring ? 'نعم' : 'لا'}</b>
      </div>
      <div class="package-price-display">
        الإجمالي (${getDeliveryFee() > 0 ? 'شامل التوصيل' : 'التوصيل مجاني'}): <span>${formatPrice(calculateOrderTotal(currentPackage.price))}</span>
      </div>
    </div>
  `;

  if (cartEl) cartEl.innerHTML = cartHTML;
  if (modalEl) modalEl.innerHTML = cartHTML;
  if (totalEl) totalEl.textContent = formatPrice(calculateOrderTotal(currentPackage.price));
  if (totalModalEl) totalModalEl.textContent = formatPrice(calculateOrderTotal(currentPackage.price));
}

/**
 * Update frequency/delivery schedule
 * @param {string} packageId - New package ID to use
 */
function updateFrequency(packageId) {
  const newPkg = PACKAGES[packageId];
  if (!newPkg || !currentPackage) return;

  // Update package price based on new package
  currentPackage.price = calculatePackagePrice(newPkg, currentPackage.items);

  currentPackage.deliveryDays = newPkg.deliveryDays;
  currentPackage.frequency = newPkg.frequency;

  savePackageToStorage(currentPackage);
  updateCartDisplay();
  showSuccessMessage(SUCCESS_MESSAGES.PRICE_UPDATED);
}

// ============================================
// NOTIFICATIONS & ALERTS
// ============================================

/**
 * Show success message using SweetAlert
 * @param {string} message - Success message
 * @param {string} title - Title (optional)
 */
function showSuccessMessage(message, title = '✅ نجح') {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonColor: '#2d8f4e'
    });
  } else {
    console.log('✅', message);
  }
}

/**
 * Show error message using SweetAlert
 * @param {string} message - Error message
 * @param {string} title - Title (optional)
 */
function showErrorMessage(message, title = '❌ خطأ') {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#2d8f4e'
    });
  } else {
    console.error('❌', message);
  }
}

/**
 * Show warning message
 * @param {string} message - Warning message
 * @param {string} title - Title (optional)
 */
function showWarningMessage(message, title = '⚠️ تحذير') {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: '#2d8f4e'
    });
  } else {
    console.warn('⚠️', message);
  }
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Title
 * @returns {Promise<boolean>} User confirmation
 */
async function showConfirmation(message, title = 'تأكيد') {
  if (typeof Swal === 'undefined') {
    return confirm(message);
  }

  const result = await Swal.fire({
    title,
    html: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'تأكيد',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#2d8f4e'
  });

  return result.isConfirmed;
}

// ============================================
// PAGE INITIALIZATION
// ============================================

/**
 * Initialize app on page load
 */
async function initializeApp() {
  // Load saved package from localStorage
  currentPackage = loadPackageFromStorage();
  const pathname = window.location.pathname || '';
  const isOrdersPage = pathname.includes('orders.html');

  // Ensure prices are synced from the backend sheet before any calculations
  try {
    await loadProductPrices();
    pricesLoaded = true;
    // تنقية الحزم بعد تحميل الأسعار
    Object.values(PACKAGES).forEach(pkg => {
      pkg.items = filterItemsWithPrice(pkg.items);
    });
  } catch (err) {
    pricesLoaded = false;
    if (!isOrdersPage) {
      showErrorMessage('تعذر تحميل الأسعار من الشيت. يرجى المحاولة لاحقاً.');
      return;
    }
  }

  // Recalculate stored package with latest prices
  if (currentPackage && pricesLoaded) {
    currentPackage.price = recalcPriceFromItems(currentPackage.items);
    savePackageToStorage(currentPackage);
  }

  // Update cart display if on cart/checkout page
  if (pathname.includes('cart.html')) {
    loadCartData();
  }

  if (pathname.includes('checkout.html')) {
    loadCheckoutData();
  }

  if (pathname.includes('orders.html')) {
    loadOrdersData();
  }

  console.log('✅ One Market - App initialized');
}

/**
 * Load and display cart data
 */
function loadCartData() {
  if (!currentPackage) {
    renderEmptyCart();
    return;
  }

  renderCart();
}

function loadCheckoutData() {
  if (!currentPackage) {
    renderCheckoutEmpty();
    return;
  }

  renderCheckout();
}

function loadOrdersData() {
  const ordersEl = getElement('ordersList');
  const countEl = getElement('ordersCount');
  const clearBtn = getElement('clearOrdersBtn');
  if (!ordersEl) return;

  if (clearBtn && clearBtn.dataset.bound !== 'true') {
    clearBtn.addEventListener('click', clearOrderHistory);
    clearBtn.dataset.bound = 'true';
  }

  const orders = getOrderHistoryFromStorage();
  if (countEl) countEl.textContent = String(orders.length);

  if (!orders.length) {
    renderOrdersEmpty(ordersEl);
    return;
  }

  ordersEl.innerHTML = orders.map(renderOrderCard).join('');
}

function renderOrdersEmpty(ordersEl) {
  if (!ordersEl) return;
  ordersEl.innerHTML = `
    <div class="empty-cart-message">
      <div class="empty-cart-icon">📦</div>
      <div class="empty-cart-text">لا توجد طلبات محفوظة حالياً</div>
      <a href="index.html" class="continue-shopping-btn">ابدأ التسوق</a>
    </div>
  `;
}

function formatOrderTimestamp(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'غير محدد';
  return formatDateArabic(date);
}

function renderOrderItems(order) {
  const items = order?.packageData?.items || {};
  const rows = Object.entries(items)
    .map(([itemId, qty]) => {
      const product = PRODUCTS[itemId];
      const itemName = product ? `${product.emoji} ${product.name}` : itemId;
      const itemUnit = product ? product.unit : '';
      const qtyLabel = `${qty} ${itemUnit}`.trim();
      return `
        <li class="orders-item-row">
          <span>${sanitizeHTML(itemName)}</span>
          <span class="item-qty">${sanitizeHTML(qtyLabel)}</span>
        </li>
      `;
    })
    .join('');

  if (rows) return rows;
  return `<li class="orders-item-row"><span>لا توجد عناصر</span></li>`;
}

function renderOrderCard(order) {
  const submittedAt = order?.submission?.submittedAt || order?.submittedAt || order?.timestamp;
  const packageEmoji = sanitizeHTML(order?.packageData?.emoji || '🛒');
  const packageName = sanitizeHTML(order?.packageData?.name || 'طلب مخصص');
  const estimatedReadyMinutes = Number.isFinite(Number(order?.estimatedReadyMinutes))
    ? Math.round(Number(order.estimatedReadyMinutes))
    : getEstimatedReadyMinutes();
  const expectedReadyAt = order?.expectedReadyAt
    || order?.submission?.expectedReadyAt
    || calculateEstimatedReadyAt(submittedAt, estimatedReadyMinutes)?.toISOString();
  const hasBreakdown = Number.isFinite(Number(order?.subtotalPrice)) || Number.isFinite(Number(order?.deliveryFee));
  const subtotal = hasBreakdown
    ? (Number(order?.subtotalPrice) || 0)
    : (Number(order?.price) || 0);
  const deliveryFee = hasBreakdown
    ? (Number.isFinite(Number(order?.deliveryFee)) ? Number(order.deliveryFee) : getDeliveryFee())
    : getDeliveryFee();
  const total = hasBreakdown
    ? (Number(order?.price) || calculateOrderTotal(subtotal))
    : calculateOrderTotal(subtotal);

  return `
    <article class="orders-card">
      <div class="orders-card-top">
        <div>
          <div class="orders-id">طلب #${sanitizeHTML(order?.id || '-')}</div>
          <div class="orders-date">${formatOrderTimestamp(submittedAt)}</div>
        </div>
      </div>

      <div class="orders-package">${packageEmoji} ${packageName}</div>
      <ul class="orders-items">${renderOrderItems(order)}</ul>

      <div class="orders-meta">
        <div class="orders-meta-row"><span>العميل</span><b>${sanitizeHTML(order?.name || 'غير متوفر')}</b></div>
        <div class="orders-meta-row"><span>الهاتف</span><b>${sanitizeHTML(order?.phone || 'غير متوفر')}</b></div>
        <div class="orders-meta-row"><span>العنوان</span><b>${sanitizeHTML(order?.address || 'غير متوفر')}</b></div>
        <div class="orders-meta-row"><span>طريقة الدفع</span><b>${sanitizeHTML(order?.paymentMethod || 'غير محدد')}</b></div>
        <div class="orders-meta-row"><span>سعر المنتجات</span><b>${formatPrice(subtotal)}</b></div>
        <div class="orders-meta-row"><span>خدمة التوصيل</span><b>${formatDeliveryFeeLabel(deliveryFee)}</b></div>
        <div class="orders-meta-row"><span>موعد الاستلام</span><b>${sanitizeHTML(formatEstimatedReadyLabel(expectedReadyAt, estimatedReadyMinutes))}</b></div>
        <div class="orders-meta-row total"><span>الإجمالي</span><b>${formatPrice(total)}</b></div>
      </div>
    </article>
  `;
}

async function clearOrderHistory() {
  const confirmed = await showConfirmation('هل تريد حذف كل الطلبات المحفوظة على هذا الجهاز؟', 'حذف السجل');
  if (!confirmed) return;

  saveOrderHistoryToStorage([]);
  loadOrdersData();
  showSuccessMessage('تم حذف سجل الطلبات من هذا الجهاز.');
}

/**
 * Render empty cart message
 */
function renderEmptyCart() {
  const contentEl = getElement('cartContent');
  if (!contentEl) return;

  contentEl.innerHTML = `
    <div class="empty-cart-message">
      <div class="empty-cart-icon">🛒</div>
      <div class="empty-cart-text">${ERROR_MESSAGES.EMPTY_CART}</div>
      <a href="index.html" class="continue-shopping-btn">ابدأ التسوق</a>
    </div>
  `;
}

/**
 * Render cart with package and order form
 */
function renderCart() {
  if (!currentPackage) {
    renderEmptyCart();
    return;
  }

  const contentEl = getElement('cartContent');
  if (!contentEl) return;

  // Build items list
  const itemsDisplay = Object.entries(currentPackage.items)
    .map(([itemId, qty]) => {
      const product = PRODUCTS[itemId];
      return `<div class="package-item"><span>${product.emoji} ${product.name}</span><span class="item-qty">${qty} ${product.unit}</span></div>`;
    })
    .join('');

  // Build frequency options
  const frequencyOptions = Object.values(PACKAGES)
    .map(pkg => {
      const selected = currentPackage.deliveryDays === pkg.deliveryDays ? 'selected' : '';
      return `<option value="${pkg.id}" ${selected}>${pkg.frequency}</option>`;
    })
    .join('');

  const packageHtml = `
    <div class="package-card">
      <div class="package-card-header">
        <div class="package-name">${currentPackage.emoji} ${currentPackage.name}</div>
        <div class="package-badge">معيارية</div>
      </div>
      
      <div class="package-items-list">
        ${itemsDisplay}
      </div>

      <div class="frequency-selector-inline">
        <label>التكرار:</label>
        <select id="frequencySelect" onchange="updateFrequency(this.value)">
          ${frequencyOptions}
        </select>
      </div>

      ${buildPriceBreakdownCard(currentPackage.price, 'priceDisplay')}
    </div>
  `;

  contentEl.innerHTML = packageHtml;

  attachSwipeHandlers(contentEl, false);
  updateCheckoutCTA(true);
}




function updateCheckoutCTA(hasPackage) {
  const checkoutBtn = getElement('goToCheckout');
  const checkoutNote = getElement('checkoutNote');
  if (!checkoutBtn) return;

  checkoutBtn.disabled = !hasPackage;
  checkoutBtn.onclick = () => {
    if (!hasPackage) return;
    window.location.href = 'checkout.html';
  };

  if (checkoutNote) {
    checkoutNote.textContent = hasPackage ? '' : 'أضف منتجات أولاً.';
  }
}

function renderCheckoutEmpty() {
  const summaryEl = getElement('checkoutSummary');
  const formWrapper = getElement('checkoutFormWrapper');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="empty-cart-message">
        <div class="empty-cart-icon">🛒</div>
        <div class="empty-cart-text">${ERROR_MESSAGES.EMPTY_CART}</div>
        <a href="cart.html" class="continue-shopping-btn">ابدأ التسوق</a>
      </div>
    `;
  }
  if (formWrapper) {
    formWrapper.innerHTML = `<p class="form-placeholder">أضف منتجات أولاً.</p>`;
  }
}

function renderCheckout() {
  if (!currentPackage) {
    renderCheckoutEmpty();
    return;
  }
  const summaryEl = getElement('checkoutSummary');
  const formWrapper = getElement('checkoutFormWrapper');
  if (!summaryEl || !formWrapper) return;

  const itemsDisplay = Object.entries(currentPackage.items)
    .map(([itemId, qty]) => {
      const product = PRODUCTS[itemId];
      return `
        <div class="package-item" data-item="${itemId}">
          <span class="package-item-name">${product.emoji} ${product.name}</span>
          <span class="item-qty">${qty} ${product.unit}</span>
          <button class="package-item-remove" aria-label="حذف ${product.name}" onclick="handleRemoveItem('${itemId}', true)">×</button>
          <div class="swipe-overlay"></div>
        </div>`;
    })
    .join('');

  const frequencyOptions = Object.values(PACKAGES)
    .map(pkg => {
      const selected = currentPackage.deliveryDays === pkg.deliveryDays ? 'selected' : '';
      return `<option value="${pkg.id}" ${selected}>${pkg.frequency}</option>`;
    })
    .join('');

  summaryEl.innerHTML = `
    <div class="package-card">
      <div class="package-card-header">
        <div class="package-name">${currentPackage.emoji} ${currentPackage.name}</div>
        <div class="package-badge">معيارية</div>
      </div>
      <div class="package-items-list">${itemsDisplay}</div>
      <div class="frequency-selector-inline">
        <label>التكرار:</label>
        <select id="frequencySelect" onchange="updateFrequency(this.value); renderCheckout();">
          ${frequencyOptions}
        </select>
      </div>
      ${buildPriceBreakdownCard(currentPackage.price, 'priceDisplay')}
    </div>
  `;

  formWrapper.innerHTML = `
    <form id="orderForm" class="order-form">
      <div class="form-group">
        <label for="name">👤 الاسم الكامل</label>
        <input type="text" id="name" name="name" placeholder="محمد أحمد علي" required>
      </div>
      <div class="form-group">
        <label for="phone">📞 رقم الهاتف</label>
        <input type="tel" id="phone" name="phone" placeholder="01012345678" required>
      </div>
      <div class="form-group">
        <label for="address">📍 عنوان التوصيل</label>
        <textarea id="address" name="address" placeholder="المحافظة - المدينة - الشارع" rows="3" required></textarea>
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" id="recurring" name="recurring"> 🔁 هل تريد تكرار الطلب بشكل منتظم؟
        </label>
      </div>
      <div class="form-title">طريقة الدفع</div>
      <div class="payment-options">
        <label class="payment-option">
          <input type="radio" name="paymentMethod" value="cod" checked> الدفع عند الاستلام
        </label>
        <label class="payment-option">
          <input type="radio" name="paymentMethod" value="vodafone"> فودافون كاش (على 01067465207)
        </label>
      </div>
      <div id="vodafoneDetails" class="vodafone-details" style="display:none;">
        <div class="form-group">
          <label for="vodafoneNumber">رقم فودافون كاش المحول منه</label>
          <input type="tel" id="vodafoneNumber" placeholder="01012345678">
        </div>
        <div class="form-group">
          <label for="paymentRef">الرقم المرجعي للتحويل</label>
          <input type="text" id="paymentRef" placeholder="مثال: 123456">
        </div>
        <p class="payment-hint">أرسل على 01067465207 ثم أدخل الرقم المرجعي أعلاه.</p>
      </div>
      <button type="submit" class="submit-button">✅ تأكيد الطلب</button>
    </form>
  `;

  const orderForm = getElement('orderForm');
  if (orderForm) orderForm.addEventListener('submit', handleCheckoutSubmit);
  setupPaymentOptions();
  attachSwipeHandlers(summaryEl, true);
}

function recalcPriceFromItems(items) {
  return Object.entries(items).reduce((sum, [id, qty]) => {
    const product = PRODUCTS[id];
    const price = product ? Number(product.unitPrice) : NaN;
    if (!Number.isFinite(price)) {
      throw new Error(`سعر غير متوفر للمنتج: ${id}`);
    }
    return sum + price * (Number(qty) || 0);
  }, 0);
}

// امنع إضافة باقة بدون أسعار محمّلة
function assertPricesLoaded() {
  if (!pricesLoaded) {
    showErrorMessage('الأسعار غير متاحة حالياً. انتظر تحميل الأسعار من الشيت.');
    throw new Error('prices_not_loaded');
  }
}

function handleRemoveItem(itemId, fromCheckout = false) {
  if (!currentPackage || !currentPackage.items[itemId]) return;
  delete currentPackage.items[itemId];

  const hasItems = Object.keys(currentPackage.items).length > 0;
  if (!hasItems) {
    removePackage();
    if (fromCheckout) renderCheckoutEmpty(); else renderEmptyCart();
    return;
  }

  currentPackage.price = recalcPriceFromItems(currentPackage.items);
  savePackageToStorage(currentPackage);

  if (fromCheckout) {
    renderCheckout();
  } else {
    renderCart();
  }
}

function attachSwipeHandlers(rootEl, isCheckout) {
  if (!rootEl) return;
  const items = rootEl.querySelectorAll('.package-item');
  items.forEach(item => {
    let startX = 0;
    let currentX = 0;
    let dragging = false;
    const overlay = item.querySelector('.swipe-overlay');
    const itemId = item.dataset.item;

    const reset = () => {
      item.style.transform = '';
      item.classList.remove('swiping', 'swipe-visible');
      if (overlay) overlay.style.opacity = '';
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      const delta = currentX - startX;
      if (delta < -70) {
        handleRemoveItem(itemId, !!isCheckout);
      } else {
        reset();
      }
    };

    item.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches.length) return;
      startX = e.touches[0].clientX;
      currentX = startX;
      dragging = true;
      item.classList.add('swipe-visible');
    }, { passive: true });

    item.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      currentX = e.touches[0].clientX;
      const delta = currentX - startX;
      if (delta < 0) {
        item.style.transform = `translateX(${delta}px)`;
        if (overlay) overlay.style.opacity = Math.min(1, Math.abs(delta) / 70);
        item.classList.toggle('swiping', Math.abs(delta) > 40);
      }
    }, { passive: true });

    item.addEventListener('touchend', endDrag);
    item.addEventListener('touchcancel', endDrag);
  });
}

function setupPaymentOptions() {
  const optionLabels = document.querySelectorAll('.payment-option');
  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  const vodafoneDetails = getElement('vodafoneDetails');
  const vodafoneNumber = getElement('vodafoneNumber');
  const paymentRef = getElement('paymentRef');
  if (!radios.length) return;

  const update = () => {
    optionLabels.forEach(label => {
      const input = label.querySelector('input');
      if (!input) return;
      label.classList.toggle('active', input.checked);
    });
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    const isVodafone = selected && selected.value === 'vodafone';
    if (vodafoneDetails) vodafoneDetails.style.display = isVodafone ? 'block' : 'none';
    if (vodafoneNumber) vodafoneNumber.required = !!isVodafone;
    if (paymentRef) paymentRef.required = !!isVodafone;
  };

  radios.forEach(radio => radio.addEventListener('change', update));
  update();
}

function getOrderHistoryFromStorage() {
  try {
    const key = STORAGE_KEYS.ORDER_HISTORY || 'orderHistory';
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('⚠️ تعذر قراءة سجل الطلبات:', error);
    return [];
  }
}

function generateOrderId() {
  return `OM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function saveOrderHistoryToStorage(history) {
  const key = STORAGE_KEYS.ORDER_HISTORY || 'orderHistory';
  const normalized = Array.isArray(history) ? history : [];
  localStorage.setItem(key, JSON.stringify(normalized));
}

function appendOrderToHistory(orderData) {
  if (!orderData || !orderData.packageData) return null;

  const submittedAt = new Date().toISOString();
  const orderId = orderData.orderId || generateOrderId();
  const estimatedReadyMinutes = Number.isFinite(Number(orderData.estimatedReadyMinutes))
    ? Math.round(Number(orderData.estimatedReadyMinutes))
    : getEstimatedReadyMinutes();
  const expectedReadyDate = orderData.expectedReadyAt
    ? new Date(orderData.expectedReadyAt)
    : calculateEstimatedReadyAt(submittedAt, estimatedReadyMinutes);
  const expectedReadyAt = expectedReadyDate && Number.isFinite(expectedReadyDate.getTime())
    ? expectedReadyDate.toISOString()
    : '';
  const packageSnapshot = JSON.parse(JSON.stringify(orderData.packageData));

  const orderEntry = {
    id: orderId,
    name: orderData.name,
    phone: orderData.phone,
    address: orderData.address,
    subtotalPrice: Number(orderData.subtotalPrice) || 0,
    deliveryFee: Number.isFinite(Number(orderData.deliveryFee)) ? Number(orderData.deliveryFee) : getDeliveryFee(),
    price: Number(orderData.price) || 0,
    frequency: orderData.frequency || 'مرة واحدة',
    paymentMethod: orderData.paymentMethod || '',
    paymentRef: orderData.paymentRef || '',
    vodafoneNumber: orderData.vodafoneNumber || '',
    isRecurring: !!orderData.isRecurring,
    repeatEveryDays: Number(orderData.repeatEveryDays) || 0,
    estimatedReadyMinutes,
    expectedReadyAt,
    packageData: packageSnapshot,
    submission: {
      status: 'pending',
      submittedAt,
      expectedReadyAt
    },
    timestamp: Date.now()
  };

  const history = getOrderHistoryFromStorage();
  history.unshift(orderEntry);
  saveOrderHistoryToStorage(history.slice(0, 50));
  return orderEntry;
}

function persistSubmittedOrderLocally(orderData = null) {
  if (orderData) {
    appendOrderToHistory(orderData);
  }

  // بعد إرسال الطلب بنحتفظ به في "طلباتي" فقط ونفضي العربة الحالية
  clearPackageFromStorage();
  currentPackage = null;
}

async function handleCheckoutSubmit(e) {
  assertPricesLoaded();
  e.preventDefault();
  const name = getElement('name').value.trim();
  const phone = getElement('phone').value.trim();
  const address = getElement('address').value.trim();
  const isRecurring = getElement('recurring')?.checked || false;
  if (!validateName(name)) { showErrorMessage(ERROR_MESSAGES.INVALID_NAME); return; }
  if (!validatePhone(phone)) { showErrorMessage(ERROR_MESSAGES.INVALID_PHONE); return; }
  if (!validateAddress(address)) { showErrorMessage(ERROR_MESSAGES.INVALID_ADDRESS); return; }

  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : '';
  const vodafoneNumber = getElement('vodafoneNumber')?.value.trim() || '';
  const paymentRef = getElement('paymentRef')?.value.trim() || '';
  if (!paymentMethod) { showWarningMessage('اختر طريقة الدفع'); return; }
  if (paymentMethod === 'vodafone' && !vodafoneNumber) { showWarningMessage('ادخل رقم فودافون كاش'); return; }
  if (paymentMethod === 'vodafone' && !paymentRef) { showWarningMessage('ادخل الرقم المرجعي للتحويل'); return; }

  const paymentLabel = paymentMethod === 'vodafone' ? 'فودافون كاش' : 'الدفع عند الاستلام';
  const repeatEveryDays = isRecurring ? currentPackage.deliveryDays : 0;
  const subtotalPrice = Number(currentPackage.price) || 0;
  const deliveryFee = getDeliveryFee();
  const totalPrice = calculateOrderTotal(subtotalPrice);
  const estimatedReadyMinutes = getEstimatedReadyMinutes();
  const expectedReadyDate = calculateEstimatedReadyAt(new Date(), estimatedReadyMinutes);
  const expectedReadyAt = expectedReadyDate ? expectedReadyDate.toISOString() : '';

  const orderData = {
    orderId: generateOrderId(),
    name,
    phone,
    address,
    subtotalPrice,
    deliveryFee,
    price: totalPrice,
    estimatedReadyMinutes,
    expectedReadyAt,
    frequency: isRecurring ? currentPackage.frequency : 'مرة واحدة',
    packageData: currentPackage,
    paymentMethod: paymentLabel,
    paymentRef,
    vodafoneNumber,
    vodafoneTarget: '01067465207',
    isRecurring,
    repeatEveryDays,
    nextDate: '',
    timestamp: Date.now()
  };

  const confirmed = await showConfirmation(buildOrderSummary(orderData, name));
  if (!confirmed) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const success = await submitOrderToBackend(orderData);
  if (success) {
    sendWhatsAppNotification(orderData);
    showSuccessMessage(`شكراً ${name} على طلبك!\n💰 ${formatPrice(orderData.price)}\n⏱️ الاستلام المتوقع بعد ${orderData.estimatedReadyMinutes} دقيقة.\n📌 طلبك محفوظ عندك حتى الاستلام.`, SUCCESS_MESSAGES.ORDER_SUBMITTED);
    persistSubmittedOrderLocally(orderData);
    setTimeout(() => window.location.href = 'index.html', 2000);
  } else {
    showErrorMessage(ERROR_MESSAGES.SUBMISSION_ERROR);
    if (submitBtn) submitBtn.disabled = false;
  }
}

// إضافة نموذج للكارْت (بدون خيارات دفع)
function addOrderFormToCart() {
  const formWrapper = getElement('formWrapper');
  if (!formWrapper) return;
  formWrapper.innerHTML = `
    <form id="orderForm" class="order-form">
      <div class="form-group">
        <label for="name">👤 الاسم الكامل</label>
        <input type="text" id="name" name="name" placeholder="محمد أحمد علي" required>
      </div>
      <div class="form-group">
        <label for="phone">📞 رقم الهاتف</label>
        <input type="tel" id="phone" name="phone" placeholder="01012345678" required>
      </div>
      <div class="form-group">
        <label for="address">📍 عنوان التوصيل</label>
        <textarea id="address" name="address" placeholder="المحافظة - المدينة - الشارع" rows="3" required></textarea>
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" id="recurring" name="recurring"> 🔁 هل تريد تكرار الطلب بشكل منتظم؟
        </label>
      </div>
      <button type="submit" class="submit-button">✅ تأكيد الطلب</button>
    </form>
  `;
  const orderForm = getElement('orderForm');
  if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
}

async function handleOrderSubmit(e) {
  assertPricesLoaded();
  e.preventDefault();
  const name = getElement('name').value.trim();
  const phone = getElement('phone').value.trim();
  const address = getElement('address').value.trim();
  const isRecurring = getElement('recurring')?.checked || false;
  if (!validateName(name)) { showErrorMessage(ERROR_MESSAGES.INVALID_NAME); return; }
  if (!validatePhone(phone)) { showErrorMessage(ERROR_MESSAGES.INVALID_PHONE); return; }
  if (!validateAddress(address)) { showErrorMessage(ERROR_MESSAGES.INVALID_ADDRESS); return; }

  const repeatEveryDays = isRecurring ? currentPackage.deliveryDays : 0;
  const subtotalPrice = Number(currentPackage.price) || 0;
  const deliveryFee = getDeliveryFee();
  const totalPrice = calculateOrderTotal(subtotalPrice);
  const estimatedReadyMinutes = getEstimatedReadyMinutes();
  const expectedReadyDate = calculateEstimatedReadyAt(new Date(), estimatedReadyMinutes);
  const expectedReadyAt = expectedReadyDate ? expectedReadyDate.toISOString() : '';

  const orderData = {
    orderId: generateOrderId(),
    name,
    phone,
    address,
    subtotalPrice,
    deliveryFee,
    price: totalPrice,
    estimatedReadyMinutes,
    expectedReadyAt,
    frequency: isRecurring ? currentPackage.frequency : 'مرة واحدة',
    packageData: currentPackage,
    paymentMethod: 'الدفع عند الاستلام',
    paymentRef: '',
    vodafoneNumber: phone,
    vodafoneTarget: '01067465207',
    isRecurring,
    repeatEveryDays,
    nextDate: '',
    timestamp: Date.now()
  };

  const confirmed = await showConfirmation(buildOrderSummary(orderData, name));
  if (!confirmed) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const success = await submitOrderToBackend(orderData);
  if (success) {
    sendWhatsAppNotification(orderData);
    showSuccessMessage(`شكراً ${name} على طلبك!\n💰 ${formatPrice(orderData.price)}\n⏱️ الاستلام المتوقع بعد ${orderData.estimatedReadyMinutes} دقيقة.\n📌 طلبك محفوظ عندك حتى الاستلام.`, SUCCESS_MESSAGES.ORDER_SUBMITTED);
    persistSubmittedOrderLocally(orderData);
    setTimeout(() => window.location.href = 'index.html', 2000);
  } else {
    showErrorMessage(ERROR_MESSAGES.SUBMISSION_ERROR);
    if (submitBtn) submitBtn.disabled = false;
  }
}

function buildOrderSummary(orderData, name) {
  const itemsList = Object.entries(currentPackage.items)
    .map(([itemId, qty]) => `<div>• ${formatItemDisplay(itemId, qty)}</div>`)
    .join('');
  const deliveryFeeValue = Number.isFinite(Number(orderData.deliveryFee))
    ? Number(orderData.deliveryFee)
    : getDeliveryFee();
  const estimatedReadyMinutes = Number.isFinite(Number(orderData.estimatedReadyMinutes))
    ? Math.round(Number(orderData.estimatedReadyMinutes))
    : getEstimatedReadyMinutes();
  const expectedReadyLabel = formatEstimatedReadyLabel(orderData.expectedReadyAt, estimatedReadyMinutes);
  return `
    <div style="text-align: right; direction: rtl; font-size: 14px;">
      <div><b>🆔 رقم الطلب:</b> ${sanitizeHTML(orderData.orderId || '-')}</div>
      <div><b>👤 الاسم:</b> ${sanitizeHTML(name)}</div>
      <div><b>📞 الهاتف:</b> ${orderData.phone}</div>
      <div><b>📍 العنوان:</b> ${sanitizeHTML(orderData.address)}</div>
      <hr style="margin: 12px 0;">
      <div><b>📦 المحتويات:</b></div>
      ${itemsList}
      <hr style="margin: 12px 0;">
      <div><b>⏰ التكرار:</b> ${orderData.frequency}</div>
      ${orderData.isRecurring ? `<div><b>🔁 كل:</b> ${orderData.repeatEveryDays} يوم</div>` : ''}
      <div><b>💳 طريقة الدفع:</b> ${orderData.paymentMethod || 'غير محدد'}</div>
      ${orderData.paymentRef ? `<div><b>🔢 الرقم المرجعي:</b> ${orderData.paymentRef}</div>` : ''}
      ${orderData.vodafoneNumber ? `<div><b>📲 رقم المرسل (فودافون):</b> ${orderData.vodafoneNumber}</div>` : ''}
      <div><b>📦 موعد الاستلام المتوقع:</b> ${sanitizeHTML(expectedReadyLabel)}</div>
      <div><b>🧺 سعر المنتجات:</b> ${formatPrice(orderData.subtotalPrice || 0)}</div>
      <div><b>🚚 خدمة التوصيل:</b> ${formatDeliveryFeeLabel(deliveryFeeValue)}</div>
      <div><b>💰 الإجمالي:</b> <span style="color: #2d8f4e; font-size: 18px;">${formatPrice(orderData.price)}</span></div>
    </div>
  `;
}

async function submitOrderToBackend(orderData) {
  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderData.orderId || '',
        customer_name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        details: formatOrderDetails(orderData.packageData),
        subtotal_price: orderData.subtotalPrice || 0,
        delivery_fee: Number.isFinite(Number(orderData.deliveryFee)) ? Number(orderData.deliveryFee) : getDeliveryFee(),
        total_price: orderData.price,
        expected_ready_at: orderData.expectedReadyAt || '',
        estimated_ready_minutes: Number(orderData.estimatedReadyMinutes) || getEstimatedReadyMinutes(),
        payment_method: orderData.paymentMethod,
        payment_ref: orderData.paymentRef,
        vodafone_sender: orderData.vodafoneNumber,
        vodafone_target: orderData.vodafoneTarget || '01067465207',
        is_recurring: orderData.isRecurring,
        repeat_every_days: orderData.repeatEveryDays,
        next_date: orderData.nextDate || ''
      })
    });
    const result = await response.json();
    if (!response.ok) {
      console.error('❌ خطأ من الخادم:', result);
      showErrorMessage(result.message || `خطأ من الخادم (${response.status})`);
      return false;
    }
    console.log('✅ تم حفظ الطلب:', result);
    recordSubmittedOrder(orderData);
    return true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error);
    showErrorMessage(`خطأ في الاتصال: ${error.message}`);
    return false;
  }
}

function enhanceVeggieIcons() {
  // حوّل الايموجي إلى شارة 3D في قائمة العناصر
  document.querySelectorAll('.package-item-name').forEach(el => {
    if (el.dataset.enhanced === 'true') return;
    const text = (el.textContent || '').trim();
    if (!text) return;
    const parts = text.split(' ');
    const emoji = parts.shift() || '';
    const label = parts.join(' ').trim();
    el.innerHTML = `<span class="veg-3d"><span>${emoji}</span></span><span class="veg-label">${label}</span>`;
    el.dataset.enhanced = 'true';
  });

  // كبّر الايموجي الرئيسي للباقة مع نفس التأثير
  document.querySelectorAll('.package-emoji').forEach(el => {
    if (el.dataset.enhanced === 'true') return;
    const emoji = (el.textContent || '').trim();
    el.innerHTML = `<span class="veg-3d veg-3d-large"><span>${emoji}</span></span>`;
    el.dataset.enhanced = 'true';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  enhanceVeggieIcons();
  initializeApp();
});

document.addEventListener('prices:updated', () => {
  if (!currentPackage) return;
  currentPackage.price = recalcPriceFromItems(currentPackage.items);
  savePackageToStorage(currentPackage);

  if (window.location.pathname.includes('cart.html')) {
    renderCart();
  }
  if (window.location.pathname.includes('checkout.html')) {
    renderCheckout();
  }
});
console.log('✅ One Market v1.0 - Script loaded');


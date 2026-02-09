/**
 * Utility Functions
 * ================================
 * Common helper functions for validation, calculation, and storage
 */

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate customer name
 * @param {string} name - Customer name
 * @returns {boolean} True if valid
 */
function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}

/**
 * Validate phone number (Egyptian format)
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.trim().replace(/\D/g, '');
  return cleaned.length === 11 || cleaned.length === 12;
}

/**
 * Validate address
 * @param {string} address - Delivery address
 * @returns {boolean} True if valid
 */
function validateAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  return trimmed.length >= 10 && trimmed.length <= 500;
}

/**
 * Validate quantity (must be positive number)
 * @param {number} qty - Quantity
 * @returns {boolean} True if valid
 */
function validateQuantity(qty) {
  const num = parseFloat(qty);
  return !isNaN(num) && num > 0 && num <= 1000;
}

/**
 * Validate price (must be positive number)
 * @param {number} price - Price
 * @returns {boolean} True if valid
 */
function validatePrice(price) {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && num <= 100000;
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate total price for a package
 * Price is calculated dynamically from PRODUCTS unitPrice * quantity
 * @param {Object} pkg - Package object
 * @param {Object} items - Items with quantities (optional, defaults to pkg.items)
 * @returns {number} Total price (calculated from current product prices)
 */
function calculatePackagePrice(pkg, items = null) {
  // Use provided items or package items
  const itemsToCalculate = items || pkg.items;
  if (!itemsToCalculate) return 0;

  let totalPrice = 0;

  Object.entries(itemsToCalculate).forEach(([itemId, quantity]) => {
    if (PRODUCTS[itemId]) {
      const unitPrice = PRODUCTS[itemId].unitPrice;
      totalPrice += quantity * unitPrice;
    }
  });

  return Math.round(totalPrice);
}

/**
 * Calculate total weight (kg) in a package
 * @param {Object} items - Items with quantities
 * @returns {number} Total weight in kg
 */
function calculateTotalWeight(items) {
  let totalWeight = 0;

  Object.entries(items).forEach(([itemId, quantity]) => {
    if (PRODUCTS[itemId] && PRODUCTS[itemId].unit === 'كجم') {
      totalWeight += quantity;
    }
  });

  return Math.round(totalWeight * 100) / 100;
}

/**
 * Format price for display
 * @param {number} price - Price amount
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
  return `${Math.round(price)} ${APP_CONFIG.currency}`;
}

/**
 * Round to 2 decimal places
 * @param {number} num - Number to round
 * @returns {number} Rounded number
 */
function roundToDecimals(num, places = 2) {
  const factor = Math.pow(10, places);
  return Math.round(num * factor) / factor;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Save package to localStorage
 * @param {Object} packageData - Package data to save
 */
function savePackageToStorage(packageData) {
  if (!packageData) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PACKAGE);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.CURRENT_PACKAGE, JSON.stringify(packageData));
}

/**
 * Load package from localStorage
 * @returns {Object|null} Package data or null
 */
function loadPackageFromStorage() {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PACKAGE);
  return data ? JSON.parse(data) : null;
}

/**
 * Clear package from storage
 */
function clearPackageFromStorage() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_PACKAGE);
}

/**
 * Check if order was recently submitted (prevent duplicates)
 * @param {Object} orderData - Order data to check
 * @returns {boolean} True if duplicate detected
 */
function isDuplicateOrder(orderData) {
  const key = STORAGE_KEYS.ORDERS_SUBMITTED;
  const orders = JSON.parse(localStorage.getItem(key) || '[]');
  const orderHash = JSON.stringify({
    name: orderData.name,
    phone: orderData.phone,
    address: orderData.address,
    price: orderData.price
  });

  return orders.some(order => {
    const timeDiff = Date.now() - order.timestamp;
    // Consider it duplicate if submitted in last 5 minutes
    return order.hash === orderHash && timeDiff < 5 * 60 * 1000;
  });
}

/**
 * Record submitted order to prevent duplicates
 * @param {Object} orderData - Order data to record
 */
function recordSubmittedOrder(orderData) {
  const key = STORAGE_KEYS.ORDERS_SUBMITTED;
  const orders = JSON.parse(localStorage.getItem(key) || '[]');

  orders.push({
    hash: JSON.stringify({
      name: orderData.name,
      phone: orderData.phone,
      address: orderData.address,
      price: orderData.price
    }),
    timestamp: Date.now()
  });

  // Keep only last 50 orders
  const recentOrders = orders.slice(-50);
  localStorage.setItem(key, JSON.stringify(recentOrders));
}

// ============================================
// FORMAT FUNCTIONS
// ============================================

/**
 * Format item display string
 * @param {string} itemId - Item identifier
 * @param {number} quantity - Item quantity
 * @returns {string} Formatted display string
 */
function formatItemDisplay(itemId, quantity) {
  const product = PRODUCTS[itemId];
  if (!product) return '';
  return `${product.emoji} ${product.name} ${quantity} ${product.unit}`;
}

/**
 * Format order details for display
 * @param {Object} packageData - Package data
 * @returns {string} Formatted order details
 */
function formatOrderDetails(packageData) {
  if (!packageData || !packageData.items) return 'لا توجد عناصر';

  const items = Object.entries(packageData.items)
    .map(([itemId, qty]) => formatItemDisplay(itemId, qty))
    .join('\n');

  return items;
}

/**
 * Format date to Arabic locale
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateArabic(date = new Date()) {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// ============================================
// URL ENCODING & MESSAGING
// ============================================

/**
 * URL encode string for WhatsApp API
 * @param {string} text - Text to encode
 * @returns {string} URL encoded text
 */
function encodeForWhatsApp(text) {
  return encodeURIComponent(text);
}

/**
 * Build WhatsApp message URL
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message text
 * @returns {string} WhatsApp URL
 */
function buildWhatsAppUrl(phoneNumber, message) {
  const encoded = encodeForWhatsApp(message);
  return `https://wa.me/${phoneNumber}?text=${encoded}`;
}

/**
 * Open WhatsApp with pre-filled message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message text
 */
function openWhatsAppChat(phoneNumber, message) {
  const url = buildWhatsAppUrl(phoneNumber, message);
  window.open(url, '_blank');
}

// ============================================
// DOM MANIPULATION
// ============================================

/**
 * Safely get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
function getElement(id) {
  return document.getElementById(id);
}

/**
 * Create element with class
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class name
 * @param {string} content - Element content
 * @returns {HTMLElement} Created element
 */
function createElement(tag, className = '', content = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content) el.innerHTML = content;
  return el;
}

/**
 * Show element
 * @param {HTMLElement} el - Element to show
 */
function showElement(el) {
  if (el) el.style.display = '';
}

/**
 * Hide element
 * @param {HTMLElement} el - Element to hide
 */
function hideElement(el) {
  if (el) el.style.display = 'none';
}

/**
 * Safe HTML sanitization for user input (basic)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// API/NETWORK FUNCTIONS
// ============================================

/**
 * Submit order to Google Sheets
 * @param {Object} orderData - Order data {name, phone, address, price, packageDetails, date}
 * @returns {Promise<boolean>} True if successful
 */
async function submitOrderToSheets(orderData) {
  try {
    // Check for duplicate submission
    if (isDuplicateOrder(orderData)) {
      console.warn('⚠️ Duplicate order detected');
      return false;
    }

    // Build payload
    const payload = {
      customer_name: sanitizeHTML(orderData.name),
      phone: orderData.phone,
      address: sanitizeHTML(orderData.address),
      order_details: formatOrderDetails(orderData.packageData),
      order_price: orderData.price,
      order_date: formatDateArabic(),
      frequency: orderData.frequency || 'مرة واحدة'
    };

    // Call Google Apps Script (you need to deploy a script)
    const response = await fetch(SHEETS_API.SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('❌ Server error:', response.status);
      return false;
    }

    // Record successful submission
    recordSubmittedOrder(orderData);
    return true;

  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

/**
 * Send WhatsApp notification
 * @param {Object} orderData - Order data
 */
function sendWhatsAppNotification(orderData) {
  try {
    const message = WHATSAPP_CONFIG.MESSAGE_TEMPLATE.orderConfirm(
      orderData.name,
      orderData.phone,
      orderData.price
    );

    // Optionally open WhatsApp for manual follow-up
    // const businessPhone = '201001234567'; // Replace with actual business number
    // openWhatsAppChat(businessPhone, message);

  } catch (error) {
    console.error('❌ WhatsApp error:', error);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Validation
    validateName,
    validatePhone,
    validateAddress,
    validateQuantity,
    validatePrice,
    // Calculation
    calculatePackagePrice,
    calculateTotalWeight,
    formatPrice,
    roundToDecimals,
    // Storage
    savePackageToStorage,
    loadPackageFromStorage,
    clearPackageFromStorage,
    isDuplicateOrder,
    recordSubmittedOrder,
    // Format
    formatItemDisplay,
    formatOrderDetails,
    formatDateArabic,
    // Messaging
    encodeForWhatsApp,
    buildWhatsAppUrl,
    openWhatsAppChat,
    // DOM
    getElement,
    createElement,
    showElement,
    hideElement,
    sanitizeHTML,
    // API
    submitOrderToSheets,
    sendWhatsAppNotification
  };
}

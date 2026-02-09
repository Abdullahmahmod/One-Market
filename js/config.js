/**
 * Configuration & Constants
 * ================================
 * Centralized configuration for the One Market app
 * Contains all data structures, constants, and global settings
 */

// ============================================
// APP CONFIGURATION
// ============================================

const APP_CONFIG = {
  name: 'One Market',
  version: '1.0.0',
  language: 'ar',
  currency: 'جنيه'
};

// ============================================
// PRODUCTS & PRICING
// ============================================

// Product information: labels, units, and unit prices
const PRODUCTS = {
  tomato: {
    label: '🍅 طماطم',
    emoji: '🍅',
    name: 'طماطم',
    unit: 'كجم',
    unitPrice: null // سيتم جلب السعر من الشيت
  },
  white_onion: {
    label: '🧅 بصل أبيض',
    emoji: '🧅',
    name: 'بصل أبيض',
    unit: 'كجم',
    unitPrice: null
  },
  red_onion: {
    label: '🧅 بصل أحمر',
    emoji: '🧅',
    name: 'بصل أحمر',
    unit: 'كجم',
    unitPrice: null
  },
  cucumber: {
    label: '🥒 خيار',
    emoji: '🥒',
    name: 'خيار',
    unit: 'كجم',
    unitPrice: null
  },
  zucchini: {
    label: '🥒 كوسة',
    emoji: '🥒',
    name: 'كوسة',
    unit: 'كجم',
    unitPrice: null
  },
  eggplant: {
    label: '🍆 باذنجان',
    emoji: '🍆',
    name: 'باذنجان',
    unit: 'كجم',
    unitPrice: null
  },
  carrot: {
    label: '🥕 جزر',
    emoji: '🥕',
    name: 'جزر',
    unit: 'كجم',
    unitPrice: null
  },
  bell_pepper: {
    label: '🫑 فلفل رومي',
    emoji: '🫑',
    name: 'فلفل رومي',
    unit: 'كجم',
    unitPrice: null
  },
  chili: {
    label: '🌶️ شطة',
    emoji: '🌶️',
    name: 'شطة',
    unit: 'وحدة',
    unitPrice: null
  },
  potato: {
    label: '🥔 بطاطس',
    emoji: '🥔',
    name: 'بطاطس',
    unit: 'كجم',
    unitPrice: null
  },
  hot_pepper: {
    label: '🌶️ فلفل حار',
    emoji: '🌶️',
    name: 'فلفل حار',
    unit: 'كجم',
    unitPrice: null
  },
  green_beans: {
    label: '🫘 فاصوليا خضراء',
    emoji: '🫘',
    name: 'فاصوليا خضراء',
    unit: 'كجم',
    unitPrice: null
  },
  peas: {
    label: '🫘 بسلة',
    emoji: '🫘',
    name: 'بسلة',
    unit: 'كجم',
    unitPrice: null
  },
  okra: {
    label: '🥗 بامية',
    emoji: '🥗',
    name: 'بامية',
    unit: 'كجم',
    unitPrice: null
  },
  spinach: {
    label: '🥬 سبانخ',
    emoji: '🥬',
    name: 'سبانخ',
    unit: 'حزمة',
    unitPrice: null
  },
  molokhia: {
    label: '🥬 ملوخية',
    emoji: '🥬',
    name: 'ملوخية',
    unit: 'حزمة',
    unitPrice: null
  },
  parsley: {
    label: '🌿 بقدونس',
    emoji: '🌿',
    name: 'بقدونس',
    unit: 'حزمة',
    unitPrice: null
  },
  coriander: {
    label: '🌿 كزبرة',
    emoji: '🌿',
    name: 'كزبرة',
    unit: 'حزمة',
    unitPrice: null
  },
  dill: {
    label: '🌿 شبت',
    emoji: '🌿',
    name: 'شبت',
    unit: 'حزمة',
    unitPrice: null
  },
  arugula: {
    label: '🌿 جرجير',
    emoji: '🌿',
    name: 'جرجير',
    unit: 'حزمة',
    unitPrice: null
  },
  lettuce: {
    label: '🥬 خس',
    emoji: '🥬',
    name: 'خس',
    unit: 'حبة',
    unitPrice: null
  },
  cabbage: {
    label: '🥬 كرنب',
    emoji: '🥬',
    name: 'كرنب',
    unit: 'حبة',
    unitPrice: null
  },
  broccoli: {
    label: '🥦 بروكلي',
    emoji: '🥦',
    name: 'بروكلي',
    unit: 'حبة',
    unitPrice: null
  },
  cauliflower: {
    label: '🥦 قرنبيط',
    emoji: '🥦',
    name: 'قرنبيط',
    unit: 'حبة',
    unitPrice: null
  },
  celery: {
    label: '🥬 كرفس',
    emoji: '🥬',
    name: 'كرفس',
    unit: 'حزمة',
    unitPrice: null
  },
  leek: {
    label: '🌱 كرات',
    emoji: '🌱',
    name: 'كرات',
    unit: 'حزمة',
    unitPrice: null
  },
  spring_onion: {
    label: '🧅 بصل أخضر',
    emoji: '🧅',
    name: 'بصل أخضر',
    unit: 'حزمة',
    unitPrice: null
  },
  garlic: {
    label: '🧄 ثوم',
    emoji: '🧄',
    name: 'ثوم',
    unit: 'كجم',
    unitPrice: null
  },
  ginger: {
    label: '🫚 زنجبيل',
    emoji: '🫚',
    name: 'زنجبيل',
    unit: 'كجم',
    unitPrice: null
  },
  sweet_potato: {
    label: '🍠 بطاطا حلوة',
    emoji: '🍠',
    name: 'بطاطا حلوة',
    unit: 'كجم',
    unitPrice: null
  },
  corn: {
    label: '🌽 ذرة',
    emoji: '🌽',
    name: 'ذرة',
    unit: 'حبة',
    unitPrice: null
  }
};

// ============================================
// PACKAGES
// ============================================

// Pre-defined package templates
// Note: Prices are calculated dynamically from PRODUCTS unitPrice * quantity
const PACKAGES = {
  half: {
    id: 'half',
    name: 'نصف أسبوعية',
    emoji: '🧺',
    frequency: 'كل 3 أيام',
    deliveryDays: 3,
    items: {
      tomato: 2.5,
      white_onion: 0.75,
      red_onion: 0.75,
      cucumber: 0.75,
      zucchini: 0.75,
      eggplant: 0.75,
      carrot: 0.75,
      bell_pepper: 0.75,
      chili: 1,
      potato: 2.5,
      hot_pepper: 0,
      green_beans: 0,
      peas: 0,
      okra: 0,
      spinach: 0,
      molokhia: 0,
      parsley: 0,
      coriander: 0,
      dill: 0,
      arugula: 0,
      lettuce: 0,
      cabbage: 0,
      broccoli: 0,
      cauliflower: 0,
      celery: 0,
      leek: 0,
      spring_onion: 0,
      garlic: 0,
      ginger: 0,
      sweet_potato: 0,
      corn: 0
    }
  },
  week: {
    id: 'week',
    name: 'أسبوعية',
    emoji: '📦',
    frequency: 'أسبوعي',
    deliveryDays: 7,
    items: {
      tomato: 5,
      white_onion: 1.5,
      red_onion: 1.5,
      cucumber: 1.5,
      zucchini: 1.5,
      eggplant: 1.5,
      carrot: 1.5,
      bell_pepper: 1.5,
      chili: 2,
      potato: 5,
      hot_pepper: 0,
      green_beans: 0,
      peas: 0,
      okra: 0,
      spinach: 0,
      molokhia: 0,
      parsley: 0,
      coriander: 0,
      dill: 0,
      arugula: 0,
      lettuce: 0,
      cabbage: 0,
      broccoli: 0,
      cauliflower: 0,
      celery: 0,
      leek: 0,
      spring_onion: 0,
      garlic: 0,
      ginger: 0,
      sweet_potato: 0,
      corn: 0
    }
  }
};

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  CURRENT_PACKAGE: 'cartPackage',
  ORDERS_SUBMITTED: 'submittedOrders'
};

// ============================================
// API CONFIGURATION
// ============================================

// Google Sheets API configuration (for order submission)
const SHEETS_API = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyetRatHPq4gsQEemFjrU2C1garMSGuVl8U6e_JltLEvYQK7LX_zWsdwyF7Zg8qeH1DYg/exec',
  // This script should handle: customer_name, phone, address, order_details, order_date
  ENDPOINT: 'submitOrder'
};

// ============================================
// DYNAMIC PRICING (load from product sheet)
// ============================================

function buildPriceApiUrls() {
  const urls = [];
  // User override via window.PRICE_API_URL or localStorage.priceApiUrl
  try {
    const winUrl = typeof window !== 'undefined' ? window.PRICE_API_URL : '';
    const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('priceApiUrl') : '';
    [winUrl, storedUrl].filter(Boolean).forEach(u => urls.push(u.replace(/\/$/, '')));
  } catch (_) {}

  // Production (Railway)
  urls.push('https://one-market-backend-production.up.railway.app/api/products');

  // Local dev first (أولوية لسيناريو localhost)
  urls.push('http://localhost:3000/api/products');
  urls.push('http://127.0.0.1:3000/api/products');

  // ثم نفس الأصل إن وُجد
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    if (origin && !origin.startsWith('file:') && origin !== 'null') {
      urls.push(`${origin.replace(/\/$/, '')}/api/products`);
    }
  }
  return urls;
}

const PRICE_API = {
  URLS: buildPriceApiUrls(),
  TIMEOUT: 7000 // ms
};

let productPricesPromise = null;

function getCurrentProductPrices() {
  const prices = {};
  Object.entries(PRODUCTS).forEach(([id, data]) => {
    prices[id] = Number(data.unitPrice) || 0;
  });
  return prices;
}

function dispatchPricesUpdated(detail) {
  if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
    try {
      document.dispatchEvent(new CustomEvent('prices:updated', { detail }));
    } catch (err) {
      console.warn('prices:updated event dispatch failed', err);
    }
  }
}

function applyProductPrices(priceMap = {}, options = {}) {
  const { source = 'sheet', dispatchEvent = true } = options;
  const applied = {};
  Object.entries(priceMap).forEach(([id, price]) => {
    const numeric = Number(price);
    if (PRODUCTS[id] && Number.isFinite(numeric) && numeric > 0) {
      PRODUCTS[id].unitPrice = numeric;
      applied[id] = numeric;
    }
  });
  if (dispatchEvent) {
    dispatchPricesUpdated({ source, priceMap: applied });
  }
  return applied;
}

function prunePackagesByPrices(pricesMap) {
  Object.values(PACKAGES).forEach(pkg => {
    if (!pkg.items) return;
    Object.keys(pkg.items).forEach(itemId => {
      const price = pricesMap[itemId];
      if (!Number.isFinite(price) || price <= 0) {
        delete pkg.items[itemId];
      }
    });
  });
}

function loadProductPrices(force = false) {
  if (!force && productPricesPromise) return productPricesPromise;

  productPricesPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PRICE_API.TIMEOUT);
    let lastError = null;
    for (const url of PRICE_API.URLS) {
      try {
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} @ ${url}`);
        const data = await resp.json();
        if (!data.success || !data.products) {
          throw new Error(data.message || `Invalid pricing response @ ${url}`);
        }
        clearTimeout(timeoutId);
        applyProductPrices(data.products, { source: data.source || 'sheet' });
        prunePackagesByPrices(data.products);
        return { source: data.source || 'sheet', prices: data.products, url };
      } catch (err) {
        lastError = err;
        console.warn('تعذر جلب الأسعار من', url, err.message);
      }
    }
    clearTimeout(timeoutId);
    console.error('فشل تحميل الأسعار بعد تجربة كل الروابط', lastError);
    throw lastError || new Error('تعذر جلب الأسعار');
  })();

  return productPricesPromise;
}

// WhatsApp Configuration
const WHATSAPP_CONFIG = {
  // Business phone number (format: country_code + number, e.g., 201001234567)
  BUSINESS_PHONE: '201067465207', // WhatsApp خدمة العملاء
  // Message templates
  MESSAGE_TEMPLATE: {
    orderConfirm: (name, phone, price) => 
      `🎉 شكرًا لطلبك! ${name}\n💰 الإجمالي: ${price} جنيه\n📞 سنتواصل معك قريبًا على: ${phone}`,
    orderNotification: (name, phone, orderDetails) =>
      `📦 طلب جديد من ${name}\n📞 ${phone}\n\nتفاصيل الطلب:\n${orderDetails}`
  }
};

// ============================================
// ERROR MESSAGES
// ============================================

const ERROR_MESSAGES = {
  INVALID_QTY: 'الكمية غير صحيحة. ادخل رقمًا أكبر من صفر',
  INVALID_PRICE: 'السعر غير صحيح. يجب أن يكون رقمًا موجبًا',
  INVALID_NAME: 'الاسم مطلوب ويجب أن يكون من 3 أحرف على الأقل',
  INVALID_PHONE: 'رقم الهاتف غير صحيح (11 رقمًا)',
  INVALID_ADDRESS: 'العنوان مطلوب ويجب أن يكون من 10 أحرف على الأقل',
  EMPTY_PACKAGE: 'اختر باقة أو أضف منتجات',
  EMPTY_CART: 'العربة فارغة',
  SUBMISSION_ERROR: 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى',
  NETWORK_ERROR: 'خطأ في الاتصال. تحقق من الإنترنت'
};

// ============================================
// SUCCESS MESSAGES
// ============================================

const SUCCESS_MESSAGES = {
  ORDER_SUBMITTED: 'تم إرسال طلبك بنجاح! ✅',
  PRICE_UPDATED: 'تم تحديث السعر',
  PACKAGE_ADDED: 'تمت إضافة الباقة للعربة'
};

// ============================================
// UI CONSTANTS
// ============================================

const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,  // ms
  TOAST_DURATION: 3000,     // ms
  MIN_QUANTITY: 0.25,
  DECIMAL_PLACES: 2
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APP_CONFIG,
    PRODUCTS,
  PACKAGES,
  STORAGE_KEYS,
  SHEETS_API,
  PRICE_API,
  WHATSAPP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
    UI_CONSTANTS,
    loadProductPrices,
    applyProductPrices,
    getCurrentProductPrices
  };
}

// Make config available in browser globals (GitHub Pages safety)
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  window.PRODUCTS = PRODUCTS;
  window.PACKAGES = PACKAGES;
  window.STORAGE_KEYS = STORAGE_KEYS;
  window.SHEETS_API = SHEETS_API;
  window.PRICE_API = PRICE_API;
  window.WHATSAPP_CONFIG = WHATSAPP_CONFIG;
  window.ERROR_MESSAGES = ERROR_MESSAGES;
  window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
  window.UI_CONSTANTS = UI_CONSTANTS;
  window.loadProductPrices = loadProductPrices;
  window.applyProductPrices = applyProductPrices;
  window.getCurrentProductPrices = getCurrentProductPrices;
}

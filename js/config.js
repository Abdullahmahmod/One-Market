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
  },
  apple: {
    label: '🍎 تفاح',
    emoji: '🍎',
    name: 'تفاح',
    unit: 'كجم',
    unitPrice: null
  },
  orange: {
    label: '🍊 برتقال',
    emoji: '🍊',
    name: 'برتقال',
    unit: 'كجم',
    unitPrice: null
  },
  mandarin: {
    label: '🍊 يوسفي',
    emoji: '🍊',
    name: 'يوسفي',
    unit: 'كجم',
    unitPrice: null
  },
  lemon: {
    label: '🍋 ليمون',
    emoji: '🍋',
    name: 'ليمون',
    unit: 'كجم',
    unitPrice: null
  },
  lime: {
    label: '🍋 ليمون أخضر',
    emoji: '🍋',
    name: 'ليمون أخضر',
    unit: 'كجم',
    unitPrice: null
  },
  grapefruit: {
    label: '🍊 جريب فروت',
    emoji: '🍊',
    name: 'جريب فروت',
    unit: 'كجم',
    unitPrice: null
  },
  banana: {
    label: '🍌 موز',
    emoji: '🍌',
    name: 'موز',
    unit: 'كجم',
    unitPrice: null
  },
  grapes: {
    label: '🍇 عنب',
    emoji: '🍇',
    name: 'عنب',
    unit: 'كجم',
    unitPrice: null
  },
  mango: {
    label: '🥭 مانجو',
    emoji: '🥭',
    name: 'مانجو',
    unit: 'كجم',
    unitPrice: null
  },
  strawberry: {
    label: '🍓 فراولة',
    emoji: '🍓',
    name: 'فراولة',
    unit: 'كجم',
    unitPrice: null
  },
  watermelon: {
    label: '🍉 بطيخ',
    emoji: '🍉',
    name: 'بطيخ',
    unit: 'حبة',
    unitPrice: null
  },
  cantaloupe: {
    label: '🍈 كنتالوب',
    emoji: '🍈',
    name: 'كنتالوب',
    unit: 'حبة',
    unitPrice: null
  },
  melon: {
    label: '🍈 شمام',
    emoji: '🍈',
    name: 'شمام',
    unit: 'حبة',
    unitPrice: null
  },
  dates: {
    label: '🌴 بلح',
    emoji: '🌴',
    name: 'بلح',
    unit: 'كجم',
    unitPrice: null
  },
  sugar_apple: {
    label: '🍈 نجا (قشطة)',
    emoji: '🍈',
    name: 'نجا (قشطة)',
    unit: 'حبة',
    unitPrice: null
  },
  guava: {
    label: '🍐 جوافة',
    emoji: '🍐',
    name: 'جوافة',
    unit: 'كجم',
    unitPrice: null
  },
  peach: {
    label: '🍑 خوخ',
    emoji: '🍑',
    name: 'خوخ',
    unit: 'كجم',
    unitPrice: null
  },
  plum: {
    label: '🍑 برقوق',
    emoji: '🍑',
    name: 'برقوق',
    unit: 'كجم',
    unitPrice: null
  },
  apricot: {
    label: '🍑 مشمش',
    emoji: '🍑',
    name: 'مشمش',
    unit: 'كجم',
    unitPrice: null
  },
  fig: {
    label: '🍐 تين',
    emoji: '🍐',
    name: 'تين',
    unit: 'كجم',
    unitPrice: null
  },
  pomegranate: {
    label: '🍎 رمان',
    emoji: '🍎',
    name: 'رمان',
    unit: 'كجم',
    unitPrice: null
  },
  pear: {
    label: '🍐 كمثرى',
    emoji: '🍐',
    name: 'كمثرى',
    unit: 'كجم',
    unitPrice: null
  },
  cherry: {
    label: '🍒 كرز',
    emoji: '🍒',
    name: 'كرز',
    unit: 'كجم',
    unitPrice: null
  },
  kiwi: {
    label: '🥝 كيوي',
    emoji: '🥝',
    name: 'كيوي',
    unit: 'كجم',
    unitPrice: null
  },
  pineapple: {
    label: '🍍 أناناس',
    emoji: '🍍',
    name: 'أناناس',
    unit: 'حبة',
    unitPrice: null
  },
  coconut: {
    label: '🥥 جوز هند',
    emoji: '🥥',
    name: 'جوز هند',
    unit: 'حبة',
    unitPrice: null
  },
  avocado: {
    label: '🥑 أفوكادو',
    emoji: '🥑',
    name: 'أفوكادو',
    unit: 'حبة',
    unitPrice: null
  },
  blueberry: {
    label: '🫐 توت أزرق',
    emoji: '🫐',
    name: 'توت أزرق',
    unit: 'كجم',
    unitPrice: null
  },
  raspberry: {
    label: '🍓 توت أحمر',
    emoji: '🍓',
    name: 'توت أحمر',
    unit: 'كجم',
    unitPrice: null
  },
  blackberry: {
    label: '🫐 توت أسود',
    emoji: '🫐',
    name: 'توت أسود',
    unit: 'كجم',
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
      corn: 0,
      apple: 0,
      orange: 0,
      mandarin: 0,
      lemon: 0,
      lime: 0,
      grapefruit: 0,
      banana: 0,
      grapes: 0,
      mango: 0,
      strawberry: 0,
      watermelon: 0,
      cantaloupe: 0,
      melon: 0,
      dates: 0,
      sugar_apple: 0,
      guava: 0,
      peach: 0,
      plum: 0,
      apricot: 0,
      fig: 0,
      pomegranate: 0,
      pear: 0,
      cherry: 0,
      kiwi: 0,
      pineapple: 0,
      coconut: 0,
      avocado: 0,
      blueberry: 0,
      raspberry: 0,
      blackberry: 0
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
      corn: 0,
      apple: 0,
      orange: 0,
      mandarin: 0,
      lemon: 0,
      lime: 0,
      grapefruit: 0,
      banana: 0,
      grapes: 0,
      mango: 0,
      strawberry: 0,
      watermelon: 0,
      cantaloupe: 0,
      melon: 0,
      dates: 0,
      sugar_apple: 0,
      guava: 0,
      peach: 0,
      plum: 0,
      apricot: 0,
      fig: 0,
      pomegranate: 0,
      pear: 0,
      cherry: 0,
      kiwi: 0,
      pineapple: 0,
      coconut: 0,
      avocado: 0,
      blueberry: 0,
      raspberry: 0,
      blackberry: 0
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
// DYNAMIC PRICING (load from backend API)
// ============================================

function buildPriceApiUrls() {
  const urls = [];
  const localUrls = [
    'http://localhost:3000/api/products',
    'http://127.0.0.1:3000/api/products'
  ];
  const railwayUrl = 'https://one-market-backend-production.up.railway.app/api/products';
  let sameOriginUrl = '';
  let isLocalRuntime = false;

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    const hostname = String(window.location.hostname || '').toLowerCase();
    const protocol = String(window.location.protocol || '').toLowerCase();
    isLocalRuntime = protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
    if (origin && !origin.startsWith('file:') && origin !== 'null') {
      sameOriginUrl = `${origin.replace(/\/$/, '')}/api/products`;
    }
  }

  // Optional override for staging/private backend endpoint
  try {
    const winUrl = typeof window !== 'undefined' ? window.PRICE_API_URL : '';
    const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('priceApiUrl') : '';
    [winUrl, storedUrl]
      .filter(Boolean)
      .forEach(u => urls.push(String(u).trim().replace(/\/$/, '')));
  } catch (_) {}

  if (isLocalRuntime) {
    localUrls.forEach(u => urls.push(u));
    if (sameOriginUrl) urls.push(sameOriginUrl);
    urls.push(railwayUrl);
  } else {
    if (sameOriginUrl) urls.push(sameOriginUrl);
    urls.push(railwayUrl);
    localUrls.forEach(u => urls.push(u));
  }

  return Array.from(new Set(urls.filter(Boolean)));
}

const PRICE_API = {
  URLS: buildPriceApiUrls(),
  TIMEOUT: 10000, // ms
  SOURCE: 'backend'
};

let productPricesPromise = null;

const PRODUCT_KEY_ALIASES = {
  onion: 'white_onion',
  whiteonion: 'white_onion',
  white_onion: 'white_onion',
  redonion: 'red_onion',
  red_onion: 'red_onion',
  springonion: 'spring_onion',
  spring_onion: 'spring_onion',
  greenonion: 'spring_onion',
  green_onion: 'spring_onion',
  bellpepper: 'bell_pepper',
  bell_pepper: 'bell_pepper',
  hotpepper: 'hot_pepper',
  hot_pepper: 'hot_pepper',
  greenbeans: 'green_beans',
  green_beans: 'green_beans',
  sweetpotato: 'sweet_potato',
  sweet_potato: 'sweet_potato',
  sugarapple: 'sugar_apple',
  sugar_apple: 'sugar_apple',
  sugarapplecustardapple: 'sugar_apple',
  sugar_apple_custard_apple: 'sugar_apple',
  custardapple: 'sugar_apple',
  custard_apple: 'sugar_apple',
  tangerine: 'mandarin'
};

function normalizeProductKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\u0600-\u06ffa-z0-9_ ]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const PRODUCT_KEY_INDEX = (() => {
  const index = {};
  Object.entries(PRODUCTS).forEach(([id, info]) => {
    const candidates = [id, info && info.name, info && info.label];
    candidates.forEach(raw => {
      const normalized = normalizeProductKey(raw);
      if (!normalized) return;
      index[normalized] = id;
      index[normalized.replace(/_/g, '')] = id;
    });
  });
  return index;
})();

function normalizeDigits(value) {
  const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
  const easternIndic = '۰۱۲۳۴۵۶۷۸۹';
  return String(value || '')
    .replace(/[٠-٩]/g, d => String(arabicIndic.indexOf(d)))
    .replace(/[۰-۹]/g, d => String(easternIndic.indexOf(d)));
}

function parsePriceNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value === 'string') {
    const normalized = normalizeDigits(value)
      .trim()
      .replace(/,/g, '.')
      .replace(/[^\d.-]+/g, '');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : NaN;
  }
  return NaN;
}

function resolveProductId(rawKey) {
  if (rawKey === null || rawKey === undefined) return null;

  const asText = String(rawKey).trim();
  if (!asText) return null;
  if (PRODUCTS[asText]) return asText;

  const normalized = normalizeProductKey(asText);
  if (!normalized) return null;
  if (PRODUCTS[normalized]) return normalized;

  const collapsed = normalized.replace(/_/g, '');
  return (
    PRODUCT_KEY_INDEX[normalized] ||
    PRODUCT_KEY_INDEX[collapsed] ||
    PRODUCT_KEY_ALIASES[normalized] ||
    PRODUCT_KEY_ALIASES[collapsed] ||
    null
  );
}

function extractNumericPrice(rawValue) {
  if (rawValue && typeof rawValue === 'object') {
    const nested =
      rawValue.unitPrice ??
      rawValue.unit_price ??
      rawValue.price ??
      rawValue.value ??
      rawValue.amount;
    return parsePriceNumber(nested);
  }
  return parsePriceNumber(rawValue);
}

function normalizePricePayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid pricing payload');
  }

  const source = typeof data.source === 'string' ? data.source : 'sheet';
  const rawProducts = data.products ?? data.prices ?? data.data ?? data.items ?? data;
  const prices = {};

  if (Array.isArray(rawProducts)) {
    rawProducts.forEach(row => {
      if (!row || typeof row !== 'object') return;
      const rawId =
        row.id ??
        row.productId ??
        row.product_id ??
        row.product ??
        row.key ??
        row.name ??
        row.item ??
        row.code;
      const productId = resolveProductId(rawId);
      const numeric = extractNumericPrice(row);
      if (productId && Number.isFinite(numeric)) {
        prices[productId] = numeric;
      }
    });
    return { source, prices };
  }

  if (!rawProducts || typeof rawProducts !== 'object') {
    throw new Error('Invalid product price map');
  }

  Object.entries(rawProducts).forEach(([rawId, rawValue]) => {
    const productId = resolveProductId(rawId);
    const numeric = extractNumericPrice(rawValue);
    if (productId && Number.isFinite(numeric)) {
      prices[productId] = numeric;
    }
  });

  return { source, prices };
}

const PRICE_ID_HEADER_KEYS = [
  'productid',
  'product',
  'itemid',
  'item',
  'code',
  'sku',
  'id',
  'name',
  'المنتج',
  'الصنف',
  'اسمالصنف',
  'اسم'
];

const PRICE_VALUE_HEADER_KEYS = [
  'price',
  'unitprice',
  'unitcost',
  'cost',
  'value',
  'amount',
  'السعر',
  'سعر'
];

function normalizeHeaderKey(value) {
  return normalizeProductKey(value).replace(/_/g, '');
}

function matchesHeaderToken(header, tokens) {
  return tokens.some(token => header.includes(token));
}

function detectSheetColumns(headers) {
  const normalizedHeaders = (headers || []).map(normalizeHeaderKey);
  let priceIndex = normalizedHeaders.findIndex(key => matchesHeaderToken(key, PRICE_VALUE_HEADER_KEYS));
  let idIndex = normalizedHeaders.findIndex((key, idx) => idx !== priceIndex && matchesHeaderToken(key, PRICE_ID_HEADER_KEYS));

  if (idIndex < 0 && normalizedHeaders.length > 0) idIndex = 0;
  if (priceIndex < 0 && normalizedHeaders.length > 1) priceIndex = idIndex === 0 ? 1 : 0;

  return { idIndex, priceIndex };
}

function extractPriceMapFromTable(headers, rows) {
  const prices = {};
  if (!Array.isArray(rows) || !rows.length) return prices;

  const { idIndex, priceIndex } = detectSheetColumns(headers);
  if (idIndex < 0 || priceIndex < 0) return prices;

  rows.forEach(row => {
    if (!Array.isArray(row)) return;
    const productId = resolveProductId(row[idIndex]);
    const numeric = parsePriceNumber(row[priceIndex]);
    if (productId && Number.isFinite(numeric)) {
      prices[productId] = numeric;
    }
  });

  return prices;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  if (row.length > 1 || String(row[0] || '').trim() !== '') {
    rows.push(row);
  }

  return rows;
}

function parseCsvPricePayload(text) {
  const rows = parseCsvRows(text || '');
  if (!rows.length) {
    throw new Error('CSV response is empty');
  }

  const headers = (rows[0] || []).map(v => String(v || '').trim());
  const dataRows = rows.slice(1);
  const prices = extractPriceMapFromTable(headers, dataRows);

  return { source: PRICE_API.SOURCE || 'backend', prices };
}

function parseGvizResponseText(text) {
  const match = String(text || '').match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?$/m);
  if (!match) {
    throw new Error('Invalid Google Visualization response');
  }
  return JSON.parse(match[1]);
}

function parseGvizPricePayload(text) {
  const parsed = parseGvizResponseText(text);
  const table = parsed && parsed.table;
  if (!table || !Array.isArray(table.rows)) {
    throw new Error('Google Visualization payload has no rows');
  }

  const headers = (table.cols || []).map(col => String((col && (col.label || col.id)) || '').trim());
  const rows = table.rows.map(row => {
    const cells = row && Array.isArray(row.c) ? row.c : [];
    return cells.map(cell => {
      if (!cell) return '';
      return cell.v ?? cell.f ?? '';
    });
  });
  const prices = extractPriceMapFromTable(headers, rows);

  return { source: PRICE_API.SOURCE || 'backend', prices };
}

async function fetchPricePayload(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PRICE_API.TIMEOUT);
  const sep = url.includes('?') ? '&' : '?';
  const requestUrl = `${url}${sep}_ts=${Date.now()}`;
  try {
    const resp = await fetch(requestUrl, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json,text/csv,text/plain,*/*' }
    });

    if (resp.status === 401 || resp.status === 403) {
      throw new Error('Pricing API access denied (401/403). تحقق من إعدادات صلاحيات الباك إند.');
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status} @ ${url}`);

    const contentType = String(resp.headers.get('content-type') || '').toLowerCase();
    const rawText = await resp.text();
    const text = String(rawText || '').trim();
    if (!text) throw new Error(`Empty response @ ${url}`);

    if (text.includes('google.visualization.Query.setResponse(')) {
      return parseGvizPricePayload(text);
    }

    if (contentType.includes('application/json') || text.startsWith('{') || text.startsWith('[')) {
      const json = JSON.parse(text);
      const normalized = normalizePricePayload(json);
      return { source: normalized.source || PRICE_API.SOURCE || 'backend', prices: normalized.prices };
    }

    if (contentType.includes('text/csv') || /(?:output|format)=csv/i.test(url) || text.includes(',')) {
      return parseCsvPricePayload(text);
    }

    throw new Error(`Unsupported response format @ ${url}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

function resetAllProductPrices() {
  Object.values(PRODUCTS).forEach(product => {
    product.unitPrice = null;
  });
}

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

function prunePackagesByPrices(pricesMap, options = {}) {
  const { onlyProvided = false } = options;
  Object.values(PACKAGES).forEach(pkg => {
    if (!pkg.items) return;
    Object.keys(pkg.items).forEach(itemId => {
      if (onlyProvided && !Object.prototype.hasOwnProperty.call(pricesMap, itemId)) {
        return;
      }
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
    let lastError = null;
    if (!Array.isArray(PRICE_API.URLS) || PRICE_API.URLS.length === 0) {
      throw new Error('Invalid pricing API URL configuration');
    }

    for (const url of PRICE_API.URLS) {
      try {
        const normalized = await fetchPricePayload(url);
        if (!Object.keys(normalized.prices || {}).length) {
          throw new Error(`No valid product prices found @ ${url}`);
        }

        resetAllProductPrices();
        const applied = applyProductPrices(normalized.prices, { source: normalized.source || 'sheet' });
        if (!Object.keys(applied).length) {
          throw new Error(`No matching product keys in response @ ${url}`);
        }

        prunePackagesByPrices(normalized.prices, { onlyProvided: true });

        return { source: normalized.source || 'sheet', prices: normalized.prices, applied, url };
      } catch (err) {
        lastError = err;
        console.warn('تعذر جلب الأسعار من', url, err.message);
      }
    }

    console.error('فشل تحميل الأسعار بعد تجربة كل الروابط', lastError);
    throw lastError || new Error('تعذر جلب الأسعار');
  })().catch(err => {
    productPricesPromise = null;
    throw err;
  });

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

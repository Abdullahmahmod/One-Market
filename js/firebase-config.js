/**
 * Firebase Configuration
 * ===============================
 * تكوين Firebase - قاعدة البيانات السحابية
 * 
 * 🔴 مهم: استبدل هذه القيم ببيانات مشروعك الخاص من Firebase Console
 * https://console.firebase.google.com/
 */

// ✅ One Market Firebase config (provided from Firebase Console)
// Guard against duplicate declarations
if (typeof FIREBASE_CONFIG === 'undefined') {
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyDrxUv7rwGCWSbbXtISXGSlOJ1YB65TBn4",
    authDomain: "one-market-af394.firebaseapp.com",
    databaseURL: "https://one-market-af394-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "one-market-af394",
    storageBucket: "one-market-af394.firebasestorage.app",
    messagingSenderId: "648165516461",
    appId: "1:648165516461:web:f164b0a00ba52bc3b85224",
    measurementId: "G-XTB6JW52X2"
  };
}

/**
 * Firebase Reference Paths
 * مسارات قاعدة البيانات
 */
if (typeof FIREBASE_PATHS === 'undefined') {
  var FIREBASE_PATHS = {
    ORDERS: 'orders',
    USERS: 'users',
    PRODUCTS: 'products',
    SETTINGS: 'settings'
  };
}

/**
 * Initialize Firebase
 * تهيئة Firebase
 */
function initializeFirebase() {
  // Check if Firebase is already initialized
  if (firebase.apps.length > 0) {
    console.log('✅ Firebase already initialized');
    return;
  }

  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log('✅ Firebase initialized successfully');
    
    // Get references
    window.firebaseDB = firebase.database();
    window.firebaseAuth = firebase.auth();
    window.firebaseStorage = firebase.storage();
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
}

/**
 * Check Firebase Configuration
 * التحقق من صحة التكوين
 */
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
  const missing = requiredFields.filter(field => 
    FIREBASE_CONFIG[field]?.includes('YOUR_')
  );

  if (missing.length > 0) {
    console.warn('⚠️ Firebase not configured properly. Missing:', missing);
    console.warn('📖 Please configure firebase-config.js with your Firebase credentials');
    return false;
  }

  return true;
}

function isFirebaseConfigured() {
  return validateFirebaseConfig();
}

// Auto-initialize on load if Firebase SDK is available
if (typeof firebase !== 'undefined' && validateFirebaseConfig()) {
  try {
    initializeFirebase();
    console.log('✅ Firebase initialized immediately on script load');
  } catch (err) {
    console.error('⚠️ Firebase initialization error, retrying on DOMContentLoaded:', err);
    // Fallback to DOMContentLoaded if immediate init fails
    document.addEventListener('DOMContentLoaded', () => {
      if (validateFirebaseConfig()) {
        initializeFirebase();
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.FIREBASE_PATHS = FIREBASE_PATHS;
  window.initializeFirebase = initializeFirebase;
  window.validateFirebaseConfig = validateFirebaseConfig;
  window.isFirebaseConfigured = isFirebaseConfigured;
}

/**
 * Price Manager - Multi-Source Price Management
 * =============================================
 * Manages product prices from multiple sources:
 * 1. Firebase Realtime Database
 * 2. Local Storage (Fallback)
 * 3. External API/CSV
 * 4. Manual Admin Override
 */

const PRICE_SOURCES = {
  FIREBASE: 'firebase',
  STORAGE: 'storage',
  API: 'api',
  ADMIN: 'admin',
  CSV: 'csv'
};

class PriceManager {
  constructor() {
    this.prices = {};
    this.source = PRICE_SOURCES.STORAGE;
    this.lastUpdate = null;
    this.listeners = [];
  }

  /**
   * Register a listener for price changes
   * @param {Function} callback - Called when prices change
   */
  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Notify all listeners of price changes
   */
  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb({ prices: this.prices, source: this.source, timestamp: this.lastUpdate });
      } catch (err) {
        console.error('Price listener error:', err);
      }
    });
  }

  /**
   * Load prices from Firebase
   * @returns {Promise<Object>}
   */
  async loadFromFirebase() {
    return new Promise((resolve, reject) => {
      if (!window.firebaseDB) {
        return reject(new Error('Firebase not initialized'));
      }

      const ref = window.firebaseDB.ref('products/prices');
      ref.once('value')
        .then(snapshot => {
          const data = snapshot.val() || {};
          this.prices = data;
          this.source = PRICE_SOURCES.FIREBASE;
          this.lastUpdate = new Date();
          this.notifyListeners();
          resolve({ success: true, prices: data, source: PRICE_SOURCES.FIREBASE });
        })
        .catch(err => {
          console.error('Firebase load error:', err);
          reject(err);
        });
    });
  }

  /**
   * Save prices to Firebase
   * @param {Object} prices - Price data to save
   * @returns {Promise<Object>}
   */
  async saveToFirebase(prices = this.prices) {
    return new Promise((resolve, reject) => {
      if (!window.firebaseDB) {
        return reject(new Error('Firebase not initialized'));
      }

      const ref = window.firebaseDB.ref('products/prices');
      ref.set(prices)
        .then(() => {
          this.prices = prices;
          this.source = PRICE_SOURCES.FIREBASE;
          this.lastUpdate = new Date();
          
          // Also save to localStorage as backup
          try {
            localStorage.setItem('productPrices', JSON.stringify(prices));
            localStorage.setItem('pricesSyncedToFirebase', new Date().toISOString());
          } catch (err) {
            console.warn('Failed to backup prices to localStorage:', err);
          }
          
          this.notifyListeners();
          resolve({ success: true, message: 'تم الحفظ في Firebase' });
        })
        .catch(err => {
          console.error('Firebase save error:', err);
          reject(err);
        });
    });
  }

  /**
   * Load prices from External API or CSV URL
   * @param {string} url - API endpoint or CSV file URL
   * @returns {Promise<Object>}
   */
  async loadFromExternalSource(url) {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Normalize the response
      const normalized = this.normalizePriceData(data);
      this.prices = normalized;
      this.source = PRICE_SOURCES.API;
      this.lastUpdate = new Date();
      this.notifyListeners();

      return {
        success: true,
        prices: normalized,
        source: PRICE_SOURCES.API,
        url: url
      };
    } catch (err) {
      console.error('External source load error:', err);
      throw err;
    }
  }

  /**
   * Load prices from LocalStorage
   * @returns {Object}
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('productPrices');
      const prices = stored ? JSON.parse(stored) : {};
      this.prices = prices;
      this.source = PRICE_SOURCES.STORAGE;
      this.lastUpdate = new Date();
      this.notifyListeners();
      return { success: true, prices, source: PRICE_SOURCES.STORAGE };
    } catch (err) {
      console.error('Storage load error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Save prices to LocalStorage
   * @param {Object} prices - Price data
   * @returns {Object}
   */
  saveToStorage(prices = this.prices) {
    try {
      localStorage.setItem('productPrices', JSON.stringify(prices));
      this.prices = prices;
      this.source = PRICE_SOURCES.STORAGE;
      this.lastUpdate = new Date();
      this.notifyListeners();
      return { success: true, message: 'تم الحفظ محلياً' };
    } catch (err) {
      console.error('Storage save error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Load from CSV content
   * @param {string} csvContent - CSV file content
   * @returns {Object}
   */
  loadFromCSV(csvContent) {
    try {
      const lines = csvContent.trim().split('\n');
      const prices = {};

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const [productId, price] = lines[i].split(',').map(v => v.trim());
        if (productId && price) {
          prices[productId] = parseFloat(price);
        }
      }

      this.prices = prices;
      this.source = PRICE_SOURCES.CSV;
      this.lastUpdate = new Date();
      this.notifyListeners();

      return { success: true, prices, source: PRICE_SOURCES.CSV };
    } catch (err) {
      console.error('CSV parse error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Update a single product price
   * @param {string} productId - Product identifier
   * @param {number} price - New price
   * @returns {Object}
   */
  updatePrice(productId, price) {
    if (!productId || isNaN(price)) {
      return { success: false, error: 'Invalid product or price' };
    }

    this.prices[productId] = parseFloat(price);
    this.source = PRICE_SOURCES.ADMIN;
    this.lastUpdate = new Date();
    this.notifyListeners();

    return { success: true, productId, price, message: 'تم تحديث السعر' };
  }

  /**
   * Get price for a product
   * @param {string} productId - Product identifier
   * @returns {number}
   */
  getPrice(productId) {
    return this.prices[productId] || 0;
  }

  /**
   * Get all prices
   * @returns {Object}
   */
  getPrices() {
    return { ...this.prices };
  }

  /**
   * Get current source
   * @returns {string}
   */
  getSource() {
    return this.source;
  }

  /**
   * Normalize price data from different formats
   * @param {*} data - Raw data from external source
   * @returns {Object}
   */
  normalizePriceData(data) {
    if (typeof data !== 'object' || data === null) {
      return {};
    }

    const normalized = {};

    // Handle array format
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.id && item.price) {
          normalized[item.id] = parseFloat(item.price);
        }
      });
      return normalized;
    }

    // Handle object format
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number' || !isNaN(parseFloat(value))) {
        normalized[key] = parseFloat(value);
      }
    });

    return normalized;
  }

  /**
   * Export prices as JSON
   * @returns {string}
   */
  exportAsJSON() {
    return JSON.stringify(this.prices, null, 2);
  }

  /**
   * Export prices as CSV
   * @returns {string}
   */
  exportAsCSV() {
    const header = 'Product ID,Price\n';
    const rows = Object.entries(this.prices)
      .map(([id, price]) => `${id},${price}`)
      .join('\n');
    return header + rows;
  }

  /**
   * Clear all prices
   */
  clear() {
    this.prices = {};
    this.source = PRICE_SOURCES.STORAGE;
    this.lastUpdate = new Date();
    this.notifyListeners();
  }
}

// Global instance
window.priceManager = new PriceManager();

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PriceManager, PRICE_SOURCES };
}

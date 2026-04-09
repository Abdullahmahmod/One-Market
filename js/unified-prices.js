/**
 * Unified Price System
 * ====================
 * manages prices across Firebase and localStorage in a coordinated way
 */

const UnifiedPriceSystem = {
  // Save prices to Firebase under products path
  async savePricesToFirebase(pricesMap) {
    try {
      const db = window.firebaseDB;
      if (!db) {
        console.error('❌ Firebase not initialized');
        return { success: false, error: 'Firebase not initialized' };
      }

      // Update each product's price
      const updates = {};
      Object.entries(pricesMap).forEach(([productId, price]) => {
        const numeric = Number(price);
        if (Number.isFinite(numeric) && numeric > 0) {
          // Store price both ways for compatibility
          updates[`products/${productId}/unitPrice`] = numeric;
          updates[`prices/${productId}`] = numeric;
        }
      });

      await ref(db, '/').update(updates);
      
      console.log('✅ Prices saved to Firebase:', Object.keys(pricesMap).length, 'products');
      
      // Also update localStorage as backup
      localStorage.setItem('productPrices', JSON.stringify(pricesMap));
      
      return { success: true, message: 'Prices synchronized' };
    } catch (error) {
      console.error('❌ Error saving prices:', error);
      return { success: false, error: error.message };
    }
  },

  // Load prices from Firebase
  async getPricesFromFirebase() {
    try {
      const db = window.firebaseDB;
      if (!db) {
        console.warn('⚠️ Firebase not initialized, using localStorage');
        return this.getPricesFromLocalStorage();
      }

      // Try to get prices from products first
      const snapshot = await get(ref(db, 'products'));
      const products = snapshot.exists() ? snapshot.val() : {};

      const prices = {};
      Object.entries(products).forEach(([productId, product]) => {
        const price = Number(product?.unitPrice ?? product?.price ?? 0);
        if (Number.isFinite(price) && price > 0) {
          prices[productId] = price;
        }
      });

      console.log('✅ Prices loaded from Firebase:', Object.keys(prices).length, 'products');
      return { success: true, prices, source: 'firebase' };
    } catch (error) {
      console.warn('⚠️ Error loading from Firebase, using localStorage:', error.message);
      return this.getPricesFromLocalStorage();
    }
  },

  // Load prices from localStorage
  getPricesFromLocalStorage() {
    try {
      const stored = localStorage.getItem('productPrices');
      const prices = stored ? JSON.parse(stored) : {};
      
      if (Object.keys(prices).length > 0) {
        console.log('✅ Prices loaded from localStorage:', Object.keys(prices).length, 'products');
        return { success: true, prices, source: 'localStorage' };
      }
      
      return { success: true, prices: {}, source: 'localStorage' };
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
      return { success: false, error: error.message, prices: {} };
    }
  },

  // Get price for specific product (with fallback chain)
  getPrice(productId) {
    // First check if we have it cached
    if (!this.cachedPrices) {
      // Load from localStorage immediately
      const result = this.getPricesFromLocalStorage();
      this.cachedPrices = result.prices || {};
    }

    return this.cachedPrices[productId] || 0;
  },

  // Clear cache to force reload
  clearCache() {
    this.cachedPrices = null;
  }
};

// Make available globally
window.UnifiedPriceSystem = UnifiedPriceSystem;

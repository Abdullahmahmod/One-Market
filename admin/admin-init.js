// admin-init.js - Initialize Admin Dashboard
(function() {
  'use strict';

  const AdminInit = {
    async init() {
      console.log('🚀 جاري تهيئة لوحة التحكم الإدارية...');

      // Wait for all dependencies to load
      await this.waitForDependencies();

      // Initialize managers
      this.initializePriceManager();
      this.initializeOrdersManager();

      console.log('✅ تم تهيئة لوحة التحكم بنجاح!');
      this.logStatus();
    },

    async waitForDependencies(maxAttempts = 50) {
      let attempts = 0;
      return new Promise((resolve) => {
        const checkDeps = () => {
          attempts++;
          const hasConfig = typeof APP_CONFIG !== 'undefined' && APP_CONFIG !== null;
          const hasProducts = typeof PRODUCTS !== 'undefined' && PRODUCTS !== null;
          const hasStorageKeys = hasConfig && typeof APP_CONFIG.STORAGE_KEYS !== 'undefined';
          const hasPriceManager = typeof PriceManager !== 'undefined';
          const hasOrdersManager = typeof OrdersManager !== 'undefined';

          if (hasConfig && hasProducts && hasStorageKeys && hasPriceManager && hasOrdersManager) {
            console.log('✅ تم تحميل جميع المكتبات المطلوبة');
            resolve();
          } else if (attempts < maxAttempts) {
            setTimeout(checkDeps, 100);
          } else {
            console.warn('⚠️ انتظار انتهاء المكتبات: ' + attempts + ' محاولة');
            console.log('حالة التحميل:', {
              APP_CONFIG: hasConfig,
              PRODUCTS: hasProducts,
              STORAGE_KEYS: hasStorageKeys,
              PriceManager: hasPriceManager,
              OrdersManager: hasOrdersManager
            });
            resolve(); // Continue anyway
          }
        };
        checkDeps();
      });
    },

    initializePriceManager() {
      if (typeof PriceManager === 'undefined') {
        console.warn('⚠️ مدير الأسعار غير متاح');
        return;
      }

      try {
        if (PriceManager.DashboardUI && typeof PriceManager.DashboardUI.renderPricesTable === 'function') {
          PriceManager.DashboardUI.renderPricesTable();
          console.log('✅ تم تهيئة جدول الأسعار');
        }
      } catch (error) {
        console.error('❌ خطأ في تهيئة مدير الأسعار:', error);
      }
    },

    async initializeOrdersManager() {
      if (typeof OrdersManager === 'undefined') {
        console.warn('⚠️ مدير الطلبات غير متاح');
        return;
      }

      try {
        await OrdersManager.getOrders();
        if (OrdersManager.DashboardUI && typeof OrdersManager.DashboardUI.renderOrdersTable === 'function') {
          OrdersManager.DashboardUI.renderOrdersTable();
          console.log('✅ تم تهيئة جدول الطلبات');
        }
      } catch (error) {
        console.error('❌ خطأ في تهيئة مدير الطلبات:', error);
      }
    },

    logStatus() {
      const status = {
        PriceManager: typeof PriceManager !== 'undefined' ? '✅' : '❌',
        OrdersManager: typeof OrdersManager !== 'undefined' ? '✅' : '❌',
        DashboardCharts: typeof window.DashboardCharts !== 'undefined' ? '✅' : '❌',
        Firebase: typeof FirebaseService !== 'undefined' ? '✅' : '❌',
        LocalStorage: typeof Storage !== 'undefined' ? '✅' : '❌'
      };

      console.group('📊 حالة لوحة التحكم');
      Object.entries(status).forEach(([key, value]) => {
        console.log(`  ${value} ${key}`);
      });
      console.groupEnd();
    },

    // Public methods
    reloadPrices() {
      if (typeof PriceManager !== 'undefined' && PriceManager.DashboardUI) {
        PriceManager.DashboardUI.renderPricesTable();
      }
    },

    reloadOrders() {
      if (typeof OrdersManager !== 'undefined' && OrdersManager.DashboardUI) {
        OrdersManager.DashboardUI.renderOrdersTable();
      }
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminInit.init());
  } else {
    AdminInit.init();
  }

  // Expose to global scope for manual access
  window.AdminInit = AdminInit;
})();

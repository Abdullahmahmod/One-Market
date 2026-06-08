(() => {
  'use strict';

  // Check admin authentication first
  if (typeof adminAuth === 'undefined') {
    console.error('❌ Admin authentication not loaded');
    window.location.href = '../index.html';
  }

  const CONFIG = {
    // Firebase Auth enabled - PIN system removed
    sessionKey: 'dashboardSessionUntil',
    sessionDurationMs: 15 * 60 * 1000,
    themeKey: 'adminTheme'
  };

  const SELECTORS = {
    totalOrders: 'totalOrders',
    totalRevenue: 'totalRevenue',
    avgOrderValue: 'avgOrderValue',
    recurringOrders: 'recurringOrders',
    activeProducts: 'activeProducts',
    avgProductPrice: 'avgProductPrice',
    recentOrdersBody: 'recentOrdersBody',
    summaryList: 'summaryList',
    cartSnapshot: 'cartSnapshot',
    priceControlSummary: 'priceControlSummary',
    ordersEmptyState: 'ordersEmptyState',
    recentOrdersEmptyState: 'recentOrdersEmptyState',
    lastUpdateLabel: 'lastUpdateLabel',
    refreshBtn: 'refreshDashboardBtn',
    themeToggle: 'themeToggle',
    themeToggleText: 'themeToggleText',
    lockSessionBtn: 'lockSessionBtn',
    liveRegion: 'admLiveRegion'
  };

  const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: 'قيد المراجعة', color: '#f6b100' },
    { value: 'preparing', label: 'جاري التحضير', color: '#0a7bdc' },
    { value: 'out_for_delivery', label: 'جاري التوصيل مع المندوب', color: '#5b3fd1' },
    { value: 'completed', label: 'تم التسليم', color: '#1e9a4b' },
    { value: 'cancelled', label: 'تم الإلغاء', color: '#d63d3d' }
  ];

  const Utils = {
    safeParse(raw, fallback) {
      try {
        const value = JSON.parse(raw);
        return value ?? fallback;
      } catch {
        return fallback;
      }
    },

    getStorageKey(name, fallback) {
      if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS && STORAGE_KEYS[name]) {
        return STORAGE_KEYS[name];
      }
      return fallback;
    },

    getById(id) {
      return document.getElementById(id);
    },

    announce(message) {
      const el = Utils.getById(SELECTORS.liveRegion);
      if (!el) return;
      el.textContent = message;
    },

    delay(ms = 120) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    normalizeStatus(status) {
      const raw = String(status || '').trim().toLowerCase();
      if (!raw) return 'pending';
      if (raw === 'processing') return 'preparing';
      return raw;
    },

    getStatusMeta(status) {
      const normalized = Utils.normalizeStatus(status);
      return ORDER_STATUS_OPTIONS.find((item) => item.value === normalized)
        || { value: normalized, label: normalized, color: '#6c757d' };
    },

    getOrderStatus(order = {}) {
      return Utils.normalizeStatus(order?.status || order?.submission?.status || 'pending');
    },

    getOrderIdentifier(order = {}) {
      return String(order?.key || order?.id || order?.orderId || '').trim();
    },

    getOrderSubmittedAt(order = {}) {
      return order?.submission?.submittedAt || order?.submittedAt || order?.timestamp || '';
    },

    getOrderDisplayAddress(order = {}) {
      const area = String(order?.deliveryArea || '').trim();
      const address = String(order?.address || '').trim();
      if (area && address.includes(area)) return address;
      if (area && address) return `${area} - ${address}`;
      return address || area || '-';
    },

    getCustomerType(order = {}) {
      const accountType = String(order?.customerAccountType || '').trim().toLowerCase();
      if (accountType === 'registered' || accountType === 'guest') return accountType;

      const hasEmail = Boolean(String(order?.customerEmail || '').trim());
      const hasUid = Boolean(String(order?.customerUid || '').trim());
      const isAnonymous = typeof order?.customerIsAnonymous === 'boolean'
        ? order.customerIsAnonymous
        : !hasEmail;

      if ((hasUid && !isAnonymous) || hasEmail) return 'registered';
      return 'guest';
    },

    getCustomerTypeMeta(order = {}) {
      const type = Utils.getCustomerType(order);
      if (type === 'registered') {
        return { value: 'registered', label: 'عميل مسجل', className: 'is-registered' };
      }
      return { value: 'guest', label: 'ضيف', className: 'is-guest' };
    }
  };

  // Firebase Authentication handler (replaces old PIN system)
  const Auth = {
    lockSession() {
      adminAuth.logout(); // Use Firebase logout
    }
  };

  const Theme = {
    getInitialTheme() {
      const saved = localStorage.getItem(CONFIG.themeKey);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    apply(theme) {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      localStorage.setItem(CONFIG.themeKey, theme);

      const button = Utils.getById(SELECTORS.themeToggle);
      const text = Utils.getById(SELECTORS.themeToggleText);
      if (!button || !text) return;

      const isDark = theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      text.textContent = isDark ? 'الوضع الفاتح' : 'الوضع الداكن';
      button.firstElementChild.textContent = isDark ? '☀️' : '🌙';
    },

    init() {
      Theme.apply(Theme.getInitialTheme());

      const button = Utils.getById(SELECTORS.themeToggle);
      if (!button) return;
      button.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        Theme.apply(current === 'dark' ? 'light' : 'dark');
      });
    }
  };

  const Data = {
    getOrderHistory() {
      const key = Utils.getStorageKey('ORDER_HISTORY', 'orderHistory');
      const parsed = Utils.safeParse(localStorage.getItem(key) || '[]', []);
      return Array.isArray(parsed) ? parsed : [];
    },

    getCurrentCart() {
      const key = Utils.getStorageKey('CURRENT_PACKAGE', 'cartPackage');
      const parsed = Utils.safeParse(localStorage.getItem(key) || 'null', null);
      return parsed && typeof parsed === 'object' ? parsed : null;
    },

    getPriceControlData() {
      const prices = Utils.safeParse(localStorage.getItem('productPrices') || '{}', {});
      const customProducts = Utils.safeParse(localStorage.getItem('customProducts') || '{}', {});
      const categorySettings = Utils.safeParse(localStorage.getItem('categorySettings') || '{"vegetables":true,"fruits":true,"herbs":true}', {});
      const allProducts = typeof PRODUCTS !== 'undefined' && PRODUCTS ? PRODUCTS : {};

      const entries = Object.entries(allProducts);
      const activePrices = entries
        .map(([id, product]) => Number(prices[id] ?? product?.unitPrice ?? 0))
        .filter((price) => Number.isFinite(price) && price > 0);

      const activeProducts = activePrices.length;
      const avgProductPrice = activeProducts
        ? Math.round(activePrices.reduce((sum, price) => sum + price, 0) / activeProducts)
        : 0;

      const inactiveProducts = entries.length - activeProducts;
      const customCount = Object.keys(customProducts).length;
      const disabledCategories = Object.entries(categorySettings).filter(([, enabled]) => enabled === false).length;

      return {
        totalProducts: entries.length,
        activeProducts,
        inactiveProducts,
        avgProductPrice,
        customCount,
        disabledCategories,
        hasLocalPrices: Object.keys(prices).length > 0
      };
    },

    async getOrders() {
      const firebaseBridge = window.FirebaseBridge;
      if (firebaseBridge && typeof firebaseBridge.isEnabled === 'function' && firebaseBridge.isEnabled()) {
        try {
          const result = await firebaseBridge.service.getAllOrders();
          if (result?.success && Array.isArray(result.orders)) {
            return result.orders;
          }
        } catch (error) {
          console.warn('Firebase dashboard orders failed, using local data instead.', error);
        }
      }

      if (typeof FirebaseService !== 'undefined') {
        try {
          if (typeof FirebaseService.getAllOrders === 'function') {
            const result = await FirebaseService.getAllOrders();
            if (result?.success && Array.isArray(result.orders)) {
              return result.orders;
            }
          }
          if (FirebaseService.Orders && typeof FirebaseService.Orders.getAll === 'function') {
            const result = await FirebaseService.Orders.getAll();
            if (Array.isArray(result)) {
              return result;
            }
            if (result?.success && Array.isArray(result.orders)) {
              return result.orders;
            }
          }
        } catch (error) {
          console.warn('Firebase service dashboard orders failed, using local data instead.', error);
        }
      }

      return Data.getOrderHistory();
    },

    async readDashboardData() {
      console.log('Dashboard: Reading dashboard data...');
      const orders = await Data.getOrders();
      console.log('Dashboard: Orders loaded:', orders?.length || 0, 'orders');
      const cart = Data.getCurrentCart();
      const priceControl = Data.getPriceControlData();

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (Number(order?.price) || 0), 0);
      const recurringOrders = orders.filter((order) => Boolean(order?.isRecurring)).length;
      const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

      return {
        orders,
        cart,
        priceControl,
        metrics: {
          totalOrders,
          totalRevenue,
          recurringOrders,
          avgOrderValue
        }
      };
    }
  };

  const Formatter = {
    currency(value) {
      const amount = Number(value) || 0;
      const currency = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.currency : 'جنيه';
      return `${Math.round(amount)} ${currency}`;
    },

    date(value) {
      if (!value) return '-';
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return '-';
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },

    nowTime() {
      return new Intl.DateTimeFormat('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());
    }
  };

  const UI = {
    setText(id, value) {
      const element = Utils.getById(id);
      if (element) element.textContent = value;
    },

    setLoadingState(isLoading) {
      const stats = document.querySelector('.adm-stats');
      const grid = document.querySelector('.adm-grid');
      if (stats) stats.setAttribute('aria-busy', String(isLoading));
      if (grid) grid.setAttribute('aria-busy', String(isLoading));

      const refreshBtn = Utils.getById(SELECTORS.refreshBtn);
      if (refreshBtn) {
        refreshBtn.setAttribute('aria-busy', String(isLoading));
        refreshBtn.disabled = isLoading;
      }
    },

    renderSkeletons() {
      UI.setLoadingState(true);

      UI.setText(SELECTORS.totalOrders, '');
      UI.setText(SELECTORS.totalRevenue, '');
      UI.setText(SELECTORS.avgOrderValue, '');
      UI.setText(SELECTORS.recurringOrders, '');
      UI.setText(SELECTORS.activeProducts, '');
      UI.setText(SELECTORS.avgProductPrice, '');

      ['totalOrders', 'totalRevenue', 'avgOrderValue', 'recurringOrders', 'activeProducts', 'avgProductPrice'].forEach((id) => {
        const el = Utils.getById(id);
        if (!el) return;
        el.classList.add('adm-skeleton', 'adm-skeleton--line-lg');
      });

      const recentBody = Utils.getById(SELECTORS.recentOrdersBody);
      if (recentBody) {
        recentBody.innerHTML = Array.from({ length: 5 }).map(() => (
          '<tr><td colspan="9"><div class="adm-skeleton adm-skeleton--line"></div></td></tr>'
        )).join('');
      }

      const summary = Utils.getById(SELECTORS.summaryList);
      if (summary) {
        summary.innerHTML = Array.from({ length: 4 }).map(() => (
          '<li><div class="adm-skeleton adm-skeleton--line"></div></li>'
        )).join('');
      }

      const cart = Utils.getById(SELECTORS.cartSnapshot);
      if (cart) {
        cart.innerHTML = [
          '<div class="adm-skeleton adm-skeleton--line"></div>',
          '<div class="adm-skeleton adm-skeleton--line" style="margin-top:8px"></div>',
          '<div class="adm-skeleton adm-skeleton--line" style="margin-top:8px"></div>'
        ].join('');
      }

      const priceSummary = Utils.getById(SELECTORS.priceControlSummary);
      if (priceSummary) {
        priceSummary.innerHTML = Array.from({ length: 4 }).map(() => (
          '<div class="adm-skeleton adm-skeleton--line"></div>'
        )).join('');
      }
    },

    clearMetricSkeletons() {
      ['totalOrders', 'totalRevenue', 'avgOrderValue', 'recurringOrders', 'activeProducts', 'avgProductPrice'].forEach((id) => {
        const el = Utils.getById(id);
        if (!el) return;
        el.classList.remove('adm-skeleton', 'adm-skeleton--line-lg');
      });
    },

    renderMetrics(metrics) {
      UI.clearMetricSkeletons();
      UI.setText(SELECTORS.totalOrders, String(metrics.totalOrders));
      UI.setText(SELECTORS.totalRevenue, Formatter.currency(metrics.totalRevenue));
      UI.setText(SELECTORS.avgOrderValue, Formatter.currency(metrics.avgOrderValue));
      UI.setText(SELECTORS.recurringOrders, String(metrics.recurringOrders));
      document.querySelectorAll('[data-card]').forEach((card) => card.classList.add('adm-reveal'));
    },

    renderPriceMetrics(priceControl) {
      UI.setText(SELECTORS.activeProducts, String(priceControl.activeProducts));
      UI.setText(SELECTORS.avgProductPrice, Formatter.currency(priceControl.avgProductPrice));

      const summary = Utils.getById(SELECTORS.priceControlSummary);
      if (!summary) return;

      summary.innerHTML = [
        `إجمالي المنتجات: ${priceControl.totalProducts}`,
        `المنتجات النشطة: ${priceControl.activeProducts}`,
        `المنتجات غير النشطة: ${priceControl.inactiveProducts}`,
        `منتجات مخصصة: ${priceControl.customCount}`,
        `أصناف معطلة: ${priceControl.disabledCategories}`,
        `مصدر الأسعار المحلي: ${priceControl.hasLocalPrices ? 'متوفر' : 'غير متوفر'}`
      ].map((item) => `<li>${item}</li>`).join('');
    },

    renderOrders(orders) {
      console.log('Dashboard: renderOrders called with', orders?.length || 0, 'orders');
      const body = Utils.getById(SELECTORS.recentOrdersBody);
      const empty = Utils.getById(SELECTORS.recentOrdersEmptyState);
      if (!body) {
        console.error('Dashboard: recentOrdersBody element not found');
        return;
      }

      body.innerHTML = '';
      const recentOrders = orders.slice(0, 8);

      if (!recentOrders.length) {
        if (empty) empty.hidden = false;
        return;
      }

      if (empty) empty.hidden = true;

      recentOrders.forEach((order) => {
        const tr = document.createElement('tr');
        const submittedAt = Utils.getOrderSubmittedAt(order);
        const orderId = Utils.getOrderIdentifier(order) || '-';
        const hasOrderId = orderId !== '-';
        const statusMeta = Utils.getStatusMeta(Utils.getOrderStatus(order));
        const customerTypeMeta = Utils.getCustomerTypeMeta(order);
        const statusOptionsHtml = ORDER_STATUS_OPTIONS.map((item) => (
          `<option value="${item.value}" ${item.value === statusMeta.value ? 'selected' : ''}>${item.label}</option>`
        )).join('');
        
        // Get items summary
        const itemsSummary = UI.getOrderItemsSummary(order);

        tr.innerHTML = `
          <td><code>${Utils.escapeHtml(orderId)}</code></td>
          <td>${Utils.escapeHtml(order?.name || '-')}</td>
          <td><span class="adm-customer-badge ${Utils.escapeHtml(customerTypeMeta.className)}">${Utils.escapeHtml(customerTypeMeta.label)}</span></td>
          <td>${Utils.escapeHtml(order?.phone || '-')}</td>
          <td>${Utils.escapeHtml(itemsSummary)}</td>
          <td>${Formatter.currency(order?.price)}</td>
          <td>
            <button data-order-json='${JSON.stringify(order).replace(/'/g, "&apos;")}' class="adm-btn-details" style="background: #0066cc; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85em; font-weight:bold;">Details</button>
          </td>
          <td>
            <select class="status-select" data-order-id="${Utils.escapeHtml(hasOrderId ? orderId : '')}" data-current-status="${Utils.escapeHtml(statusMeta.value)}" style="border-color:${statusMeta.color}" ${hasOrderId ? '' : 'disabled'}>
              ${statusOptionsHtml}
            </select>
          </td>
          <td><span class="adm-chip">${Utils.escapeHtml(order?.paymentMethod || 'غير محدد')}</span></td>
          <td>${Formatter.date(submittedAt)}</td>
        `;
        tr.dataset.orderData = JSON.stringify(order);
        body.appendChild(tr);
      });

      body.querySelectorAll('.status-select[data-order-id]').forEach((select) => {
        if (select.dataset.bound === 'true') return;
        select.addEventListener('change', async (event) => {
          const orderId = event.currentTarget?.dataset?.orderId || '';
          const nextStatus = event.currentTarget?.value || 'pending';
          const previousStatus = event.currentTarget?.dataset?.currentStatus || 'pending';
          if (!orderId || typeof OrdersManager === 'undefined' || !OrdersManager.updateOrderStatus) return;

          const result = await OrdersManager.updateOrderStatus(orderId, nextStatus);
          if (!result) {
            event.currentTarget.value = previousStatus;
            return;
          }

          const statusMeta = Utils.getStatusMeta(nextStatus);
          event.currentTarget.dataset.currentStatus = statusMeta.value;
          event.currentTarget.style.borderColor = statusMeta.color;
        });
        select.dataset.bound = 'true';
      });

      // Bind details buttons
      body.querySelectorAll('.adm-btn-details').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          try {
            const orderJson = btn.getAttribute('data-order-json');
            if (!orderJson) {
              console.error('No order data in button');
              return;
            }
            const order = JSON.parse(orderJson);
            UI.displayOrderDetailsModal(order);
          } catch (err) {
            console.error('Error showing order details:', err);
            alert('خطأ في عرض التفاصيل: ' + err.message);
          }
        });
      });
    },
    
    getOrderItemsSummary(order) {
      try {
        const orderItems = typeof extractOrderLineItems === 'function'
          ? extractOrderLineItems(order)
          : [];

        if (!orderItems.length) {
          return '❌ بدون منتجات';
        }

        const itemList = orderItems
          .slice(0, 3)
          .map((item) => String(item?.summary || item?.name || '').trim())
          .filter(Boolean)
          .join(' • ');

        const remaining = orderItems.length - 3;
        return remaining > 0 ? `${itemList} ...و${remaining}` : itemList;
      } catch (err) {
        console.warn('Error getting items summary:', err);
        return 'منتجات';
      }
    },
    
    showOrderDetails(orderId, event) {
      event.preventDefault();
      event.stopPropagation();
      
      // Find the order in the table
      const tr = event.target.closest('tr');
      if (!tr || !tr.dataset.orderData) {
        console.error('Order data not found');
        return;
      }
      
      try {
        const order = JSON.parse(tr.dataset.orderData);
        UI.displayOrderDetailsModal(order);
      } catch (err) {
        console.error('Failed to parse order data:', err);
      }
    },
    
    displayOrderDetailsModal(order) {
      // Safety checks
      if (!order) {
        alert('خطأ: لا يوجد بيانات الطلب');
        return;
      }

      const orderItems = typeof extractOrderLineItems === 'function'
        ? extractOrderLineItems(order)
        : [];
      const packageInfo = order?.packageData || {};
      
      const orderId = order?.orderId || order?.id || 'غير محدد';
      
      // Build items table
      let itemsHtml = '';
      let totalItemsPrice = 0;
      
      if (orderItems.length > 0) {
        itemsHtml = orderItems.map((item) => {
          const id = item?.productId || item?.id || item?.name || '';
          const quantityValue = Number(item?.quantity);
          const hasQuantity = Number.isFinite(quantityValue) && quantityValue > 0;

          // Get product info from multiple sources
          let product = {};
          
          // Try to get from global PRODUCTS
          if (id && typeof window.PRODUCTS !== 'undefined' && window.PRODUCTS[id]) {
            product = window.PRODUCTS[id];
          }
          // Try to get from pricesData
          else if (id && typeof window.pricesData !== 'undefined' && window.pricesData[id]) {
            product = { name: id, unitPrice: window.pricesData[id] };
          }
          // Fallback to basic info
          else {
            product = {
              name: item?.name || id || 'منتج',
              emoji: '🧺',
              unit: 'وحدة'
            };
          }
          
          const name = item?.name || product?.name || product?.label || id || 'منتج';
          const emoji = item?.emoji || product?.emoji || '🧺';
          const unit = item?.unit || product?.unit || '—';
          const quantityText = hasQuantity
            ? (typeof formatOrderQuantity === 'function' ? formatOrderQuantity(quantityValue) : String(quantityValue))
            : '—';
          
          // Get price from multiple sources
          let price = Number(item?.unitPrice);
          if (!Number.isFinite(price) && id && typeof window.pricesData !== 'undefined' && window.pricesData[id]) {
            price = window.pricesData[id];
          } else if (!Number.isFinite(price) && product?.unitPrice) {
            price = product.unitPrice;
          } else if (!Number.isFinite(price) && hasQuantity && packageInfo?.price && orderItems.length === 1) {
            price = packageInfo.price / quantityValue;
          } else if (!Number.isFinite(price) && hasQuantity && order?.subtotalPrice && orderItems.length === 1) {
            price = order.subtotalPrice / quantityValue;
          } else if (!Number.isFinite(price) && hasQuantity && order?.price && orderItems.length === 1) {
            price = order.price / quantityValue;
          }

          const itemTotalValue = Number(item?.totalPrice);
          const itemTotal = Number.isFinite(itemTotalValue)
            ? itemTotalValue
            : (Number.isFinite(price) && hasQuantity ? price * quantityValue : 0);
          totalItemsPrice += itemTotal;
          
          return `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px; text-align: right; font-weight: bold;">${emoji} ${name}</td>
              <td style="padding: 12px; text-align: center; font-weight: bold;">${quantityText}</td>
              <td style="padding: 12px; text-align: center;">${unit}</td>
              <td style="padding: 12px; text-align: left;">${Number.isFinite(price) ? price.toFixed(2) : '—'} ج.م</td>
              <td style="padding: 12px; text-align: left; background: #f0f0f0; font-weight: bold;">${itemTotal.toFixed(2)} ج.م</td>
            </tr>
          `;
        }).join('');
      } else {
        // Show debug information when no items found
        const debugInfo = `
          <tr>
            <td colspan="5" style="padding: 20px; text-align: center; color: #e74c3c;">
              <strong>❌ لم يتم العثور على منتجات في الطلب</strong><br>
              <small style="color: #666;">
                تم البحث في: orderDetails, packageData.items, items, details<br>
                البيانات المتوفرة: ${JSON.stringify(Object.keys(order || {}))}
              </small>
            </td>
          </tr>
        `;
        itemsHtml = debugInfo;
      }
      
      // Create modal HTML
      const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; direction: rtl; animation: fadeIn 0.3s ease-in;">
          <div style="background: white; border-radius: 12px; padding: 30px; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 3px solid #0066cc; padding-bottom: 15px;">
              <h2 style="margin: 0; color: #0066cc; font-size: 1.6em;">📦 تفاصيل الطلب</h2>
              <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: #e74c3c; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: bold; transition: all 0.2s;">✕</button>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #0066cc;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                <div>
                  <div style="color: #666; font-size: 0.9em;">رقم الطلب:</div>
                  <code style="background: #e8f4f8; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 1.1em; font-weight: bold; color: #0066cc;">${Utils.escapeHtml(orderId)}</code>
                </div>
                <div>
                  <div style="color: #666; font-size: 0.9em;">اسم العميل :</div>
                  <div style="font-size: 1.2em; font-weight: bold; margin-top: 5px;">${Utils.escapeHtml(order?.name || '-')}</div>
                </div>
                <div>
                  <div style="color: #666; font-size: 0.9em;">الهاتف:</div>
                  <div style="direction: ltr; font-size: 1.1em; margin-top: 5px; font-weight: bold;">${Utils.escapeHtml(order?.phone || '-')}</div>
                </div>
                <div>
                  <div style="color: #666; font-size: 0.9em;">طريقة الدفع:</div>
                  <div style="font-size: 1.1em; font-weight: bold; margin-top: 5px;">${Utils.escapeHtml(order?.paymentMethod || 'غير محدد')}</div>
                </div>
                <div style="grid-column: 1/-1;">
                  <div style="color: #666; font-size: 0.9em;">عنوان التوصيل:</div>
                  <div style="font-size: 1em; margin-top: 5px; line-height: 1.6;">${Utils.escapeHtml(Utils.getOrderDisplayAddress(order))}</div>
                </div>
                <div>
                  <div style="color: #666; font-size: 0.9em;">نوع الطلب:</div>
                  <div style="font-size: 1.1em; font-weight: bold; margin-top: 5px;">
                    ${order?.orderType === 'custom' ? '🛒 طلب مخصص' : '📦 باقة'}
                  </div>
                </div>
                <div>
                  <div style="color: #666; font-size: 0.9em;">التكرار:</div>
                  <div style="font-size: 1.1em; font-weight: bold; margin-top: 5px;">
                    ${order?.isRecurring ? `🔄 ${order?.frequency || 'غير محدد'}` : '🔸 مرة واحدة'}
                  </div>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #0066cc; padding-bottom: 10px; font-size: 1.2em;">📋 المنتجات المشتراة:</h3>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
                  <thead style="background: #0066cc; color: white;">
                    <tr>
                      <th style="padding: 15px; text-align: right; font-weight: bold;">المنتج</th>
                      <th style="padding: 15px; text-align: center; font-weight: bold;">الكمية</th>
                      <th style="padding: 15px; text-align: center; font-weight: bold;">الوحدة</th>
                      <th style="padding: 15px; text-align: left; font-weight: bold;">السعر الواحد</th>
                      <th style="padding: 15px; text-align: left; font-weight: bold;">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; border-left: 5px solid #0066cc;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #0066cc;">
                <span style="font-size: 1em;">💰 <strong>إجمالي المنتجات:</strong></span>
                <span style="font-size: 1.3em; font-weight: bold; color: #0066cc;">${totalItemsPrice.toFixed(2)} ج.م</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 1em;">🚚 <strong>رسوم التوصيل:</strong></span>
                <span style="font-size: 1.1em; font-weight: bold;">${Utils.escapeHtml(order?.deliveryFee || 0)} ج.م</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px solid #0066cc;">
                <span style="font-size: 1.2em;"><strong>الإجمالي النهائي:</strong></span>
                <span style="font-size: 1.5em; font-weight: bold; color: #27ae60;">${Formatter.currency(order?.price || 0)}</span>
              </div>
            </div>
          </div>
        </div>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        </style>
      `;
      
      // Create and inject modal
      const container = document.createElement('div');
      container.innerHTML = modalHTML;
      document.body.appendChild(container.firstElementChild);
      
      // Close on background click
      const backdrop = container.firstElementChild;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.remove();
        }
      });
    },

    renderSummary(orders) {
      const summary = Utils.getById(SELECTORS.summaryList);
      if (!summary) return;

      const cash = orders.filter((order) => (order?.paymentMethod || '').includes('الاستلام')).length;
      const vodafone = orders.filter((order) => (order?.paymentMethod || '').includes('فودافون')).length;
      const pending = orders.filter((order) => Utils.getOrderStatus(order) === 'pending').length;
      const preparing = orders.filter((order) => Utils.getOrderStatus(order) === 'preparing').length;
      const outForDelivery = orders.filter((order) => Utils.getOrderStatus(order) === 'out_for_delivery').length;
      
      const totalRevenue = orders.reduce((sum, order) => sum + (Number(order?.price) || 0), 0);
      const avgPrice = orders.length ? Math.round(totalRevenue / orders.length) : 0;
      
      const recurringCount = orders.filter((order) => Boolean(order?.isRecurring)).length;
      const completedCount = orders.filter((order) => Utils.getOrderStatus(order) === 'completed').length;
      const cancelledCount = orders.filter((order) => Utils.getOrderStatus(order) === 'cancelled').length;
      const registeredCount = orders.filter((order) => Utils.getCustomerType(order) === 'registered').length;
      const guestCount = orders.length - registeredCount;
      
      // New statistics for packages vs custom orders
      const packageOrders = orders.filter((order) => order?.orderType === 'package').length;
      const customOrders = orders.filter((order) => order?.orderType === 'custom').length;
      const weeklyOrders = orders.filter((order) => order?.frequency?.includes('أسبوع')).length;
      const halfWeeklyOrders = orders.filter((order) => order?.frequency?.includes('نصف')).length;

      summary.innerHTML = [
        `💰 الإيراد الكلي: ${totalRevenue} جنيه`,
        `📊 متوسط الطلب: ${avgPrice} جنيه`,
        `💳 طرق دفع: استلام (${cash}) | فودافون (${vodafone})`,
        `👥 نوع العملاء: مسجل (${registeredCount}) | ضيف (${guestCount})`,
        `📦 نوع الطلبات: باقات (${packageOrders}) | مخصصة (${customOrders})`,
        `🔄 التكرار: أسبوعي (${weeklyOrders}) | نصف أسبوعي (${halfWeeklyOrders})`,
        `✅ مكتملة: ${completedCount} | 🔄 متكررة: ${recurringCount}`,
        `⏳ قيد المراجعة: ${pending} | 🧑‍🍳 جاري التحضير: ${preparing}`,
        `🛵 مع المندوب: ${outForDelivery} | ❌ ملغاة: ${cancelledCount}`,
        `⏱️ آخر تحديث: ${Formatter.nowTime()}`
      ].map((item) => `<li>${item}</li>`).join('');
    },

    renderCart(cart) {
      const wrapper = Utils.getById(SELECTORS.cartSnapshot);
      if (!wrapper) return;

      if (!cart || !cart.items || !Object.keys(cart.items).length) {
        wrapper.textContent = 'لا يوجد طلب حالي داخل العربة.';
        return;
      }

      const itemLines = Object.entries(cart.items)
        .slice(0, 3)
        .map(([itemId, qty]) => {
          const productName = (typeof PRODUCTS !== 'undefined' && PRODUCTS[itemId]?.name) ? PRODUCTS[itemId].name : itemId;
          return `${productName}: ${qty}`;
        });

      wrapper.innerHTML = `
        <p><strong>اسم الطلب:</strong> ${cart.name || 'طلب مخصص'}</p>
        <p><strong>القيمة الحالية:</strong> ${Formatter.currency(cart.price)}</p>
        <p><strong>عناصر بالعربة:</strong> ${itemLines.join(' | ')}</p>
      `;
    },

    renderLastUpdate() {
      UI.setText(SELECTORS.lastUpdateLabel, `تم التحديث: ${Formatter.nowTime()}`);
    }
  };

  const Controller = {
    async refresh() {
      UI.renderSkeletons();
      await Utils.delay(150);

      const payload = await Data.readDashboardData();
      UI.renderMetrics(payload.metrics);
      UI.renderPriceMetrics(payload.priceControl);
      UI.renderOrders(payload.orders);
      UI.renderSummary(payload.orders);
      UI.renderCart(payload.cart);
      UI.renderLastUpdate();

      // Initialize charts if available
      if (window.DashboardCharts && typeof window.DashboardCharts.initCharts === 'function') {
        window.DashboardCharts.initCharts(payload.orders);
      }

      // Initialize admin control managers
      if (typeof PriceManager !== 'undefined' && PriceManager.DashboardUI) {
        PriceManager.DashboardUI.renderPricesTable();
      }

      if (typeof OrdersManager !== 'undefined' && OrdersManager.DashboardUI) {
        await OrdersManager.getOrders();
        OrdersManager.DashboardUI.renderOrdersTable();
      }

      UI.setLoadingState(false);
      Utils.announce('تم تحديث لوحة التحكم');
    },

    bindEvents() {
      const refreshBtn = Utils.getById(SELECTORS.refreshBtn);
      if (refreshBtn) refreshBtn.addEventListener('click', Controller.refresh);

      const lockBtn = Utils.getById(SELECTORS.lockSessionBtn);
      if (lockBtn) lockBtn.addEventListener('click', Auth.lockSession);

      window.addEventListener('storage', (event) => {
        if (['productPrices', 'customProducts', 'categorySettings', 'orderHistory'].includes(event.key)) {
          Controller.refresh();
        }
      });

      document.addEventListener('orders:updated', () => {
        Controller.refresh();
      });
    },

    async init() {
      console.log('🎬 Dashboard.init() starting...');
      
      // Check if adminAuth is available
      if (typeof adminAuth === 'undefined') {
        console.error('❌ Admin auth class not loaded');
        return;
      }
      
      // Wait for admin authentication to complete
      console.log('⏳ Calling ensureAdminAccess()...');
      let hasAccess;
      try {
        hasAccess = await adminAuth.ensureAdminAccess(20000); // 20 second timeout
      } catch (err) {
        console.error('❌ Error checking admin access:', err);
        hasAccess = false;
      }
      
      console.log(`🔐 ensureAdminAccess returned: ${hasAccess}`);
      
      if (!hasAccess) {
        console.error('❌ Admin access verification failed - user must login via modal');
        // Admin auth will show login form automatically
        return;
      }

      console.log('✅ Admin verified - initializing dashboard...');
      Theme.init();
      Controller.bindEvents();
      await Controller.refresh();
      console.log('✅ Dashboard fully initialized');
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await Controller.init();
  });
})();

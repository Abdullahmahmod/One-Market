(() => {
  'use strict';

  console.log('=== DASHBOARD.JS V3 ARABIC VERSION LOADING ===');

  // Check admin authentication
  if (typeof adminAuth === 'undefined') {
    console.error('Admin authentication not loaded');
    return;
  }

  const CONFIG = {
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
    { value: 'pending', label: 'Pending', color: '#f6b100' },
    { value: 'preparing', label: 'Preparing', color: '#0a7bdc' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: '#5b3fd1' },
    { value: 'completed', label: 'Completed', color: '#1e9a4b' },
    { value: 'cancelled', label: 'Cancelled', color: '#d63d3d' }
  ];

  const Utils = {
    getById(id) {
      return document.getElementById(id);
    },

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    delay(ms = 120) {
      return new Promise((resolve) => setTimeout(resolve, ms));
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

    getOrderSubmittedAt(order = {}) {
      return order?.submission?.submittedAt || order?.submittedAt || order?.timestamp || new Date().toISOString();
    },

    getOrderIdentifier(order = {}) {
      return order?.orderId || order?.id || 'unknown';
    },

    getCustomerType(order = {}) {
      if (order?.customerUid && !order?.customerIsAnonymous) return 'registered';
      return 'guest';
    },

    setText(id, text) {
      const el = Utils.getById(id);
      if (el) el.textContent = String(text);
    }
  };

  const Formatter = {
    currency(value) {
      const num = Number(value) || 0;
      return num.toFixed(2) + ' EGP';
    },

    date(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return '-';
      return date.toLocaleDateString('ar-EG');
    },

    nowTime() {
      return new Date().toLocaleTimeString('ar-EG');
    }
  };

  const Data = {
    async getOrders() {
      console.log('Getting orders from Firebase...');
      
      // Try Firebase Bridge first
      const firebaseBridge = window.FirebaseBridge;
      if (firebaseBridge && typeof firebaseBridge.isEnabled === 'function' && firebaseBridge.isEnabled()) {
        try {
          const result = await firebaseBridge.service.getAllOrders();
          if (result?.success && Array.isArray(result.orders)) {
            return result.orders;
          }
        } catch (error) {
          console.warn('Firebase Bridge orders failed, trying Firebase Service', error);
        }
      }

      // Try Firebase Service
      if (typeof FirebaseService !== 'undefined') {
        try {
          if (typeof FirebaseService.getAllOrders === 'function') {
            const result = await FirebaseService.getAllOrders();
            if (result?.success && Array.isArray(result.orders)) {
              return result.orders;
            }
          }
        } catch (error) {
          console.warn('Firebase service orders failed, using local data', error);
        }
      }

      return [];
    },

    getCurrentCart() {
      const key = 'cartPackage';
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return null;
      }
    },

    getPriceControlData() {
      try {
        const prices = JSON.parse(localStorage.getItem('productPrices') || '{}');
        const customProducts = JSON.parse(localStorage.getItem('customProducts') || '{}');
        const allProducts = typeof PRODUCTS !== 'undefined' && PRODUCTS ? PRODUCTS : {};

        const entries = Object.entries(allProducts);
        const activePrices = entries
          .map(([id, product]) => Number(prices[id] ?? product?.unitPrice ?? 0))
          .filter((price) => Number.isFinite(price) && price > 0);

        const activeProducts = activePrices.length;
        const avgProductPrice = activeProducts
          ? Math.round(activePrices.reduce((sum, price) => sum + price, 0) / activeProducts)
          : 0;

        return {
          totalProducts: entries.length,
          activeProducts,
          avgProductPrice,
          customCount: Object.keys(customProducts).length
        };
      } catch {
        return {
          totalProducts: 0,
          activeProducts: 0,
          avgProductPrice: 0,
          customCount: 0
        };
      }
    },

    async readDashboardData() {
      console.log('Reading dashboard data...');
      const orders = await Data.getOrders();
      console.log('Orders loaded:', orders?.length || 0, 'orders');
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
          avgOrderValue,
          recurringOrders
        }
      };
    }
  };

  const UI = {
    renderSkeletons() {
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
    },

    clearMetricSkeletons() {
      ['totalOrders', 'totalRevenue', 'avgOrderValue', 'recurringOrders', 'activeProducts', 'avgProductPrice'].forEach((id) => {
        const el = Utils.getById(id);
        if (!el) return;
        el.classList.remove('adm-skeleton', 'adm-skeleton--line-lg');
      });
    },

    renderMetrics(metrics) {
      Utils.setText(SELECTORS.totalOrders, metrics.totalOrders);
      Utils.setText(SELECTORS.totalRevenue, Formatter.currency(metrics.totalRevenue));
      Utils.setText(SELECTORS.avgOrderValue, Formatter.currency(metrics.avgOrderValue));
      Utils.setText(SELECTORS.recurringOrders, metrics.recurringOrders);
      UI.clearMetricSkeletons();
    },

    renderPriceMetrics(priceControl) {
      Utils.setText(SELECTORS.activeProducts, String(priceControl.activeProducts));
      Utils.setText(SELECTORS.avgProductPrice, Formatter.currency(priceControl.avgProductPrice));

      const summary = Utils.getById(SELECTORS.priceControlSummary);
      if (!summary) return;

      summary.innerHTML = [
        `Total Products: ${priceControl.totalProducts}`,
        `Active Products: ${priceControl.activeProducts}`,
        `Custom Products: ${priceControl.customCount}`
      ].map((item) => `<li>${item}</li>`).join('');
    },

    getOrderItemsSummary(order) {
      try {
        let items = {};
        if (order?.packageData?.items) {
          items = order.packageData.items;
        } else if (order?.items && Object.keys(order.items).length) {
          items = order.items;
        } else if (order?.orderData?.items) {
          items = order.orderData.items;
        } else if (order?.customProducts || order?.products) {
          items = order.customProducts || order.products;
        }
        
        if (!Object.keys(items).length) {
          return 'No products';
        }
        
        const itemList = Object.entries(items)
          .slice(0, 3)
          .map(([id, qty]) => {
            const product = typeof PRODUCTS !== 'undefined' ? PRODUCTS[id] : null;
            const name = product?.name || product?.emoji || id;
            return `${qty} ${product?.unit || 'unit'} ${name}`;
          })
          .join(' \u2022 ');
        
        const remaining = Object.keys(items).length - 3;
        return remaining > 0 ? `${itemList} \u2022 ${remaining} more` : itemList;
      } catch (err) {
        console.warn('Error getting items summary:', err);
        return 'Products';
      }
    },

    renderOrders(orders) {
      console.log('renderOrders called with', orders?.length || 0, 'orders');
      const body = Utils.getById(SELECTORS.recentOrdersBody);
      const empty = Utils.getById(SELECTORS.recentOrdersEmptyState);
      if (!body) {
        console.error('recentOrdersBody element not found');
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
        const statusOptionsHtml = ORDER_STATUS_OPTIONS.map((item) => (
          `<option value="${item.value}" ${item.value === statusMeta.value ? 'selected' : ''}>${item.label}</option>`
        )).join('');
        
        const itemsSummary = UI.getOrderItemsSummary(order);

        tr.innerHTML = `
          <td><code>${Utils.escapeHtml(orderId)}</code></td>
          <td>${Utils.escapeHtml(order?.name || '-')}</td>
          <td>${Utils.escapeHtml(order?.phone || '-')}</td>
          <td>${Utils.escapeHtml(itemsSummary)}</td>
          <td>${Formatter.currency(order?.price)}</td>
          <td>
            <button data-order-json='${JSON.stringify(order).replace(/'/g, "&apos;")}' class="adm-btn-details" style="background: linear-gradient(135deg, #3498db, #2980b9); color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:600; transition: all 0.3s ease;">Details</button>
          </td>
          <td>
            <select class="status-select" data-order-id="${Utils.escapeHtml(hasOrderId ? orderId : '')}" data-current-status="${Utils.escapeHtml(statusMeta.value)}" style="border-color:${statusMeta.color}; padding:8px; border-radius:6px; font-weight:600;" ${hasOrderId ? '' : 'disabled'}>
              ${statusOptionsHtml}
            </select>
          </td>
          <td><span class="adm-chip" style="background: linear-gradient(135deg, #f39c12, #e67e22); color:white; padding:4px 12px; border-radius:20px; font-weight:600;">${Utils.escapeHtml(order?.paymentMethod || 'N/A')}</span></td>
          <td>${Formatter.date(submittedAt)}</td>
        `;
        tr.dataset.orderData = JSON.stringify(order);
        body.appendChild(tr);
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
            alert('Error showing details: ' + err.message);
          }
        });
      });
    },

    displayOrderDetailsModal(order) {
      if (!order) {
        alert('Error: No order data');
        return;
      }

      let items = {};
      let packageInfo = {};
      
      if (order?.packageData?.items) {
        items = order.packageData.items;
        packageInfo = order.packageData;
      } else if (order?.items) {
        items = order.items;
      } else if (order?.orderData?.items) {
        items = order.orderData.items;
        packageInfo = order.orderData;
      } else if (order?.customProducts || order?.products) {
        items = order.customProducts || order.products;
      }
      
      const orderId = order?.orderId || order?.id || 'Unknown';
      const submittedAt = order?.submission?.submittedAt || order?.submittedAt || order?.timestamp || new Date().toISOString();
      
      let itemsHtml = '';
      let totalItemsPrice = 0;
      
      if (Object.keys(items).length > 0) {
        itemsHtml = Object.entries(items).map(([id, qty]) => {
          let product = {};
          let price = 0;
          
          if (typeof window.PRODUCTS !== 'undefined' && window.PRODUCTS[id]) {
            product = window.PRODUCTS[id];
          }
          
          if (typeof window.pricesData !== 'undefined' && window.pricesData[id]) {
            price = window.pricesData[id];
          } else if (product?.unitPrice) {
            price = product.unitPrice;
          } else if (packageInfo?.price && Object.keys(items).length === 1) {
            price = packageInfo.price / qty;
          } else if (order?.subtotalPrice && Object.keys(items).length === 1) {
            price = order.subtotalPrice / qty;
          } else if (order?.price && Object.keys(items).length === 1) {
            price = order.price / qty;
          }
          
          const itemTotal = price * qty;
          totalItemsPrice += itemTotal;
          
          return `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px; text-align: right; font-weight: bold;">${product?.emoji || '\ud83d\udce6'} ${product?.name || id}</td>
              <td style="padding: 12px; text-align: center; font-weight: bold;">${qty}</td>
              <td style="padding: 12px; text-align: center;">${product?.unit || 'unit'}</td>
              <td style="padding: 12px; text-align: left;">${price.toFixed(2)} EGP</td>
              <td style="padding: 12px; text-align: left; font-weight: bold;">${itemTotal.toFixed(2)} EGP</td>
            </tr>
          `;
        }).join('');
      } else {
        itemsHtml = `
          <tr>
            <td colspan="5" style="padding: 20px; text-align: center; color: #e74c3c;">
              <strong>No products found in order</strong>
            </td>
          </tr>
        `;
      }
      
      const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px);">
          <div style="background: linear-gradient(135deg, #ffffff, #f8f9fa); border-radius: 20px; padding: 30px; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border: 2px solid #3498db;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: linear-gradient(135deg, #3498db, #2980b9); padding: 20px; border-radius: 15px; color: white;">
              <h2 style="margin: 0; font-size: 1.8rem; font-weight: 700;">Order Details</h2>
              <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.3s ease;">X</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
              <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 15px; border: 2px solid #3498db;">
                <h3 style="color: #2c3e50; margin-bottom: 15px; font-weight: 700;">Customer Information</h3>
                <p style="margin: 8px 0;"><strong>Name:</strong> ${Utils.escapeHtml(order?.name || 'N/A')}</p>
                <p style="margin: 8px 0;"><strong>Phone:</strong> ${Utils.escapeHtml(order?.phone || 'N/A')}</p>
                <p style="margin: 8px 0;"><strong>Address:</strong> ${Utils.escapeHtml(order?.address || 'N/A')}</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 15px; border: 2px solid #27ae60;">
                <h3 style="color: #2c3e50; margin-bottom: 15px; font-weight: 700;">Order Information</h3>
                <p style="margin: 8px 0;"><strong>Order ID:</strong> <code style="background: #3498db; color: white; padding: 4px 8px; border-radius: 6px;">${Utils.escapeHtml(orderId)}</code></p>
                <p style="margin: 8px 0;"><strong>Total:</strong> <strong style="color: #27ae60; font-size: 1.3em;">${Formatter.currency(order?.price || 0)}</strong></p>
                <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${Utils.escapeHtml(order?.paymentMethod || 'N/A')}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${Formatter.date(submittedAt)}</p>
              </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 15px; border: 2px solid #f39c12;">
              <h3 style="color: #2c3e50; margin-bottom: 15px; font-weight: 700;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #3498db, #2980b9); color: white;">
                    <th style="padding: 15px; text-align: right; font-weight: 700;">Product</th>
                    <th style="padding: 15px; text-align: center; font-weight: 700;">Quantity</th>
                    <th style="padding: 15px; text-align: center; font-weight: 700;">Unit</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700;">Unit Price</th>
                    <th style="padding: 15px; text-align: left; font-weight: 700;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHTML;
      document.body.appendChild(modalContainer);

      const backdrop = modalContainer.firstElementChild;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.remove();
        }
      });
    },

    renderSummary(orders) {
      const summary = Utils.getById(SELECTORS.summaryList);
      if (!summary) return;

      const pending = orders.filter((order) => Utils.getOrderStatus(order) === 'pending').length;
      const preparing = orders.filter((order) => Utils.getOrderStatus(order) === 'preparing').length;
      const completedCount = orders.filter((order) => Utils.getOrderStatus(order) === 'completed').length;
      const cancelledCount = orders.filter((order) => Utils.getOrderStatus(order) === 'cancelled').length;

      const totalRevenue = orders.reduce((sum, order) => sum + (Number(order?.price) || 0), 0);
      const avgPrice = orders.length ? Math.round(totalRevenue / orders.length) : 0;

      summary.innerHTML = [
        `Total Revenue: ${totalRevenue} EGP`,
        `Average Order: ${avgPrice} EGP`,
        `Completed: ${completedCount} | Cancelled: ${cancelledCount}`,
        `Pending: ${pending} | Preparing: ${preparing}`,
        `Last Update: ${Formatter.nowTime()}`
      ].map((item) => `<li>${item}</li>`).join('');
    },

    renderCart(cart) {
      const wrapper = Utils.getById(SELECTORS.cartSnapshot);
      if (!wrapper) return;

      if (!cart || !cart.items || !Object.keys(cart.items).length) {
        wrapper.textContent = 'No items in cart.';
        return;
      }

      const itemLines = Object.entries(cart.items)
        .slice(0, 3)
        .map(([itemId, qty]) => {
          const productName = (typeof PRODUCTS !== 'undefined' && PRODUCTS[itemId]?.name) ? PRODUCTS[itemId].name : itemId;
          return `${productName}: ${qty}`;
        });

      wrapper.innerHTML = `
        <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 15px; border: 2px solid #3498db;">
          <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-weight: 700;">Current Cart (${Object.keys(cart.items).length} items)</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${itemLines.map(item => `<li style="margin: 5px 0;">${item}</li>`).join('')}
          </ul>
          <p style="margin: 15px 0 0 0; font-weight: bold; color: #27ae60; font-size: 1.1em;">
            Total: ${Formatter.currency(cart.price || 0)}
          </p>
        </div>
      `;
    },

    renderLastUpdate() {
      const label = Utils.getById(SELECTORS.lastUpdateLabel);
      if (label) {
        label.textContent = `Last updated: ${Formatter.nowTime()}`;
      }
    },

    setLoadingState(isLoading) {
      const refreshBtn = Utils.getById(SELECTORS.refreshBtn);
      if (refreshBtn) {
        refreshBtn.disabled = isLoading;
        refreshBtn.textContent = isLoading ? 'Loading...' : 'Refresh Data';
      }
    }
  };

  const Controller = {
    async refresh() {
      UI.setLoadingState(true);
      UI.renderSkeletons();
      await Utils.delay(150);

      try {
        const payload = await Data.readDashboardData();
        UI.renderMetrics(payload.metrics);
        UI.renderPriceMetrics(payload.priceControl);
        UI.renderOrders(payload.orders);
        UI.renderSummary(payload.orders);
        UI.renderCart(payload.cart);
        UI.renderLastUpdate();
      } catch (error) {
        console.error('Dashboard refresh failed:', error);
      } finally {
        UI.setLoadingState(false);
      }
    },

    async init() {
      console.log('=== Dashboard.init() starting ===');
      
      try {
        console.log('Step 1: Checking adminAuth...');
        const hasAccess = await adminAuth.ensureAdminAccess();
        console.log('Step 2: ensureAdminAccess returned:', hasAccess);
        
        if (!hasAccess) {
          console.log('Step 3: Admin access denied');
          return;
        }

        console.log('Step 4: Admin verified - initializing dashboard...');
        UI.setLoadingState(true);
        UI.renderSkeletons();
        await Utils.delay(150);

        console.log('Step 5: Reading dashboard data...');
        const payload = await Data.readDashboardData();
        console.log('Step 6: Data loaded:', {
          orders: payload.orders?.length || 0,
          hasCart: !!payload.cart,
          hasPriceControl: !!payload.priceControl
        });

        console.log('Step 7: Rendering UI components...');
        UI.renderMetrics(payload.metrics);
        UI.renderPriceMetrics(payload.priceControl);
        UI.renderOrders(payload.orders);
        UI.renderSummary(payload.orders);
        UI.renderCart(payload.cart);
        UI.renderLastUpdate();

        console.log('Step 8: Checking OrdersManager...');
        if (typeof OrdersManager !== 'undefined' && OrdersManager.DashboardUI) {
          console.log('Step 9: OrdersManager found, getting orders...');
          await OrdersManager.getOrders();
          OrdersManager.DashboardUI.renderOrdersTable();
        } else {
          console.log('Step 9: OrdersManager not found or no DashboardUI');
        }

        UI.setLoadingState(false);
        console.log('=== Dashboard fully initialized ===');
      } catch (error) {
        console.error('=== Dashboard initialization failed ===', error);
        console.error('Error stack:', error.stack);
        UI.setLoadingState(false);
      }
    }
  };

  // Initialize dashboard when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Controller.init());
  } else {
    Controller.init();
  }

  // Expose dashboard controller globally
  window.Dashboard = Controller;

})();

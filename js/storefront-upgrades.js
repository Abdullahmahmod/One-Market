(() => {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  const CART_STORAGE_KEY = (window.STORAGE_KEYS && window.STORAGE_KEYS.CURRENT_PACKAGE) || 'cartPackage';
  const FRUIT_IDS = new Set([
    'apple', 'orange', 'mandarin', 'lemon', 'lime', 'grapefruit', 'banana',
    'grapes', 'mango', 'strawberry', 'watermelon', 'cantaloupe', 'melon',
    'dates', 'sugar_apple', 'guava', 'peach', 'plum', 'apricot', 'fig', 'pomegranate',
    'pear', 'cherry', 'kiwi', 'pineapple', 'coconut', 'avocado', 'blueberry',
    'raspberry', 'blackberry'
  ]);

  const drawer = document.getElementById('cartDrawer');
  const drawerBackdrop = document.getElementById('cartDrawerBackdrop');
  const drawerItems = document.getElementById('cartDrawerItems');
  const drawerTotal = document.getElementById('cartDrawerTotal');
  const closeDrawerBtn = document.getElementById('closeCartDrawerBtn');
  const mobilePurchaseBar = document.getElementById('mobilePurchaseBar');
  const mobileCartTrigger = document.getElementById('mobileCartTrigger');
  const mobileCartCount = document.getElementById('mobileCartCount');
  const mobileCartTotal = document.getElementById('mobileCartTotal');
  const recommendationsSection = document.getElementById('recommendationsSection');
  const recommendationsGrid = document.getElementById('recommendationsGrid');

  const analyticsHooks = [];
  const hoverStartByProduct = new Map();
  let maxScrollDepth = 0;
  let previousCartCount = 0;
  let isDrawerOpen = false;
  let activeTouchStartX = null;
  let activeTouchStartY = null;
  let drawerTouchStartX = null;
  let drawerTouchStartY = null;

  function isDesktopLikeViewport() {
    return window.matchMedia('(min-width: 901px) and (pointer: fine)').matches;
  }

  function forceDrawerClosed() {
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.hidden = true;
    }
    if (drawerBackdrop) {
      drawerBackdrop.classList.remove('is-visible');
      drawerBackdrop.hidden = true;
    }
    document.body.classList.remove('cart-drawer-open');
    isDrawerOpen = false;
  }

  const storefrontAnalytics = {
    startedAt: Date.now(),
    hoverTimeByProductMs: {},
    hoverCountByProduct: {},
    addToCartByProduct: {},
    clickCountByProduct: {},
    scrollDepthPercentMax: 0,
    events: []
  };

  function emitAnalytics(type, payload = {}) {
    const event = {
      type,
      payload,
      at: new Date().toISOString()
    };
    storefrontAnalytics.events.push(event);
    if (storefrontAnalytics.events.length > 200) {
      storefrontAnalytics.events.shift();
    }

    analyticsHooks.forEach((hook) => {
      try {
        hook(event, storefrontAnalytics);
      } catch (_) {}
    });
  }

  // Integration hook for future backend logging.
  window.StorefrontAnalytics = {
    state: storefrontAnalytics,
    onEvent(handler) {
      if (typeof handler === 'function') analyticsHooks.push(handler);
    },
    flush() {
      const snapshot = JSON.parse(JSON.stringify(storefrontAnalytics));
      emitAnalytics('analytics:flush', { size: snapshot.events.length });
      return snapshot;
    }
  };

  function normalizeQty(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 0;
    return Number(num.toFixed(2));
  }

  function getStep(unit) {
    return unit === 'كجم' ? 0.5 : 1;
  }

  function formatPriceSafe(value) {
    if (typeof window.formatPrice === 'function') return window.formatPrice(value);
    return `${Math.round(Number(value) || 0)} جنيه`;
  }

  function formatQty(qty, unit) {
    const n = normalizeQty(qty);
    const text = Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/, '');
    return `${text} ${unit || 'وحدة'}`;
  }

  function detectCategory(productId, product) {
    if (FRUIT_IDS.has(productId)) return 'fruits';
    if ((product && product.unit) === 'حزمة') return 'herbs';
    return 'vegetables';
  }

  function readCartPackage() {
    try {
      if (typeof window.loadPackageFromStorage === 'function') {
        return window.loadPackageFromStorage();
      }
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeCartPackage(pkg) {
    if (!pkg || !pkg.items || !Object.keys(pkg.items).length) {
      if (typeof window.clearPackageFromStorage === 'function') {
        window.clearPackageFromStorage();
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      document.dispatchEvent(new CustomEvent('cart:external-updated'));
      document.dispatchEvent(new CustomEvent('cart:changed', {
        detail: { items: {}, total: 0, count: 0 }
      }));
      updateSurfaceCounters();
      return;
    }

    if (typeof window.savePackageToStorage === 'function') {
      window.savePackageToStorage(pkg);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(pkg));
    }

    const total = Number(pkg.price) || 0;
    const count = Object.keys(pkg.items || {}).length;

    document.dispatchEvent(new CustomEvent('cart:external-updated'));
    document.dispatchEvent(new CustomEvent('cart:changed', {
      detail: { items: pkg.items, total, count }
    }));
    updateSurfaceCounters();
  }

  function recalcPrice(items) {
    return Object.entries(items || {}).reduce((sum, [productId, qty]) => {
      const price = Number(window.PRODUCTS && window.PRODUCTS[productId] && window.PRODUCTS[productId].unitPrice);
      if (!Number.isFinite(price) || price <= 0) return sum;
      return sum + (price * normalizeQty(qty));
    }, 0);
  }

  function updateProductQuantity(productId, direction) {
    const product = window.PRODUCTS && window.PRODUCTS[productId];
    if (!product) return;
    const step = getStep(product.unit);
    const pkg = readCartPackage() || {
      id: 'week',
      name: 'طلب مخصص',
      emoji: '🛒',
      frequency: 'أسبوعي',
      deliveryDays: 7,
      isRecurring: false,
      items: {}
    };

    const current = normalizeQty((pkg.items && pkg.items[productId]) || 0);
    let next = current;
    if (direction === 'inc') next = normalizeQty(current + step);
    if (direction === 'dec') next = normalizeQty(current - step);
    if (direction === 'remove') next = 0;

    pkg.items = pkg.items || {};
    if (next > 0) {
      pkg.items[productId] = next;
    } else {
      delete pkg.items[productId];
    }

    pkg.price = Number(recalcPrice(pkg.items).toFixed(2));
    pkg.createdAt = pkg.createdAt || new Date().toISOString();

    writeCartPackage(pkg);
    emitAnalytics('cart:mutate', { productId, direction, qty: next });
  }

  function getCartData() {
    const pkg = readCartPackage();
    const items = (pkg && pkg.items) || {};
    const rows = Object.entries(items).map(([productId, qty]) => {
      const product = window.PRODUCTS && window.PRODUCTS[productId];
      if (!product) return null;
      const price = Number(product.unitPrice);
      if (!Number.isFinite(price) || price <= 0) return null;
      const amount = Number((price * normalizeQty(qty)).toFixed(2));
      return {
        id: productId,
        name: product.name,
        emoji: product.emoji,
        unit: product.unit,
        qty: normalizeQty(qty),
        amount
      };
    }).filter(Boolean);

    const total = Number((pkg && Number(pkg.price)) || recalcPrice(items) || 0).toFixed(2);
    return {
      rows,
      total: Number(total),
      count: rows.length
    };
  }

  function renderCartDrawer() {
    if (!drawerItems || !drawerTotal) return;
    const data = getCartData();

    if (!data.rows.length) {
      drawerItems.innerHTML = '<div class="drawer-empty">العربة فارغة حالياً</div>';
    } else {
      drawerItems.innerHTML = data.rows.map((row) => `
        <article class="drawer-item" role="listitem" data-product="${row.id}">
          <div class="drawer-item-head">
            <h4 class="drawer-item-name">${row.emoji || '🧺'} ${row.name}</h4>
            <button type="button" class="drawer-remove-btn keyboard-focus-ring" data-action="remove" data-product="${row.id}" aria-label="حذف ${row.name}">✕</button>
          </div>
          <div class="drawer-item-line">${formatPriceSafe(row.amount)}</div>
          <div class="drawer-stepper" aria-label="تغيير الكمية">
            <button type="button" class="keyboard-focus-ring" data-action="inc" data-product="${row.id}">+</button>
            <strong>${formatQty(row.qty, row.unit)}</strong>
            <button type="button" class="keyboard-focus-ring" data-action="dec" data-product="${row.id}">−</button>
          </div>
        </article>
      `).join('');
    }

    drawerTotal.textContent = formatPriceSafe(data.total);
    if (mobileCartTotal) mobileCartTotal.textContent = formatPriceSafe(data.total);
    if (mobileCartCount) mobileCartCount.textContent = String(data.count);
  }

  function updateSurfaceCounters() {
    const data = getCartData();
    const isMobileViewport = window.matchMedia('(max-width: 600px)').matches;
    if (mobilePurchaseBar) {
      mobilePurchaseBar.hidden = !(isMobileViewport && data.count > 0);
    }
    const quickCount = document.getElementById('quickCartCount');
    const stickyCount = document.getElementById('stickyCartCount');
    const headerCount = document.getElementById('cartCount');

    if (quickCount) quickCount.textContent = String(data.count);
    if (stickyCount) stickyCount.textContent = String(data.count);
    if (headerCount) headerCount.textContent = String(data.count);
    if (mobileCartCount) mobileCartCount.textContent = String(data.count);
    if (mobileCartTotal) mobileCartTotal.textContent = formatPriceSafe(data.total);

    if (data.count > previousCartCount) {
      emitAnalytics('cart:add_detected', { count: data.count });
    }
    previousCartCount = data.count;
  }

  function openCartDrawer() {
    if (!drawer || !drawerBackdrop) return;
    isDrawerOpen = true;
    drawer.hidden = false;
    drawerBackdrop.hidden = false;

    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      drawerBackdrop.classList.add('is-visible');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cart-drawer-open');
    });

    renderCartDrawer();
    emitAnalytics('cart:drawer_open');
  }

  function closeCartDrawer() {
    if (!drawer || !drawerBackdrop) return;
    isDrawerOpen = false;
    drawer.classList.remove('is-open');
    drawerBackdrop.classList.remove('is-visible');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-drawer-open');

    window.setTimeout(() => {
      if (!isDrawerOpen) {
        drawer.hidden = true;
        drawerBackdrop.hidden = true;
      }
    }, 220);

    emitAnalytics('cart:drawer_close');
  }

  function bindDrawerActions() {
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', closeCartDrawer);
    }

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', closeCartDrawer);
    }

    if (drawerItems) {
      drawerItems.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-action][data-product]');
        if (!btn) return;

        const productId = btn.dataset.product;
        const action = btn.dataset.action;
        if (!productId || !action) return;

        const row = btn.closest('.drawer-item');
        if (action === 'remove' && row) {
          row.classList.add('is-removing');
          window.setTimeout(() => {
            updateProductQuantity(productId, 'remove');
            renderCartDrawer();
          }, 140);
          return;
        }

        updateProductQuantity(productId, action);
        renderCartDrawer();
      });
    }

    const quickCartBtn = document.getElementById('quickCartBtn');
    const stickyCartFab = document.getElementById('stickyCartFab');

    [quickCartBtn, stickyCartFab, mobileCartTrigger]
      .filter(Boolean)
      .forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
          // Desktop: keep native navigation behavior to cart page.
          if (trigger !== mobileCartTrigger && isDesktopLikeViewport()) return;
          event.preventDefault();
          openCartDrawer();
        });
      });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isDrawerOpen) {
        closeCartDrawer();
      }
      if ((event.altKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        openCartDrawer();
      }
    });

    // Swipe gesture on touch devices only.
    window.addEventListener('touchstart', (event) => {
      if (window.matchMedia('(pointer: fine)').matches || window.innerWidth > 900) return;
      if (!event.touches || !event.touches[0]) return;
      activeTouchStartX = event.touches[0].clientX;
      activeTouchStartY = event.touches[0].clientY;
      if (drawer && drawer.contains(event.target)) {
        drawerTouchStartX = activeTouchStartX;
        drawerTouchStartY = activeTouchStartY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (event) => {
      if (window.matchMedia('(pointer: fine)').matches || window.innerWidth > 900) return;
      if (!event.touches || !event.touches[0]) return;
      const x = event.touches[0].clientX;
      const y = event.touches[0].clientY;

      if (
        !isDrawerOpen &&
        activeTouchStartX !== null &&
        activeTouchStartY !== null &&
        activeTouchStartX > (window.innerWidth - 18)
      ) {
        const delta = x - activeTouchStartX;
        const deltaY = y - activeTouchStartY;
        if (delta < -90 && Math.abs(delta) > (Math.abs(deltaY) * 1.6)) {
          activeTouchStartX = null;
          activeTouchStartY = null;
          openCartDrawer();
        }
      }

      if (isDrawerOpen && drawerTouchStartX !== null && drawerTouchStartY !== null) {
        const delta = x - drawerTouchStartX;
        const deltaY = y - drawerTouchStartY;
        if (delta > 90 && Math.abs(delta) > (Math.abs(deltaY) * 1.6)) {
          drawerTouchStartX = null;
          drawerTouchStartY = null;
          closeCartDrawer();
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      activeTouchStartX = null;
      activeTouchStartY = null;
      drawerTouchStartX = null;
      drawerTouchStartY = null;
    }, { passive: true });
  }

  function getVisibleProducts() {
    const cards = Array.from(document.querySelectorAll('.market-product-card[data-product]'));
    return cards.map((card) => {
      const productId = card.dataset.product;
      const product = window.PRODUCTS && window.PRODUCTS[productId];
      if (!product) return null;

      const price = Number(product.unitPrice);
      if (!Number.isFinite(price) || price <= 0) return null;

      return {
        id: productId,
        name: product.name,
        emoji: product.emoji || '🧺',
        category: detectCategory(productId, product),
        price
      };
    }).filter(Boolean);
  }

  function median(values) {
    const nums = values.slice().sort((a, b) => a - b);
    if (!nums.length) return 0;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  }

  function scoreRecommendation(candidate, cartRows) {
    let score = 0;
    const categories = new Set(cartRows.map((row) => detectCategory(row.id, window.PRODUCTS[row.id])));
    const cartPrices = cartRows.map((row) => Number((window.PRODUCTS[row.id] || {}).unitPrice)).filter((n) => Number.isFinite(n) && n > 0);
    const targetPrice = median(cartPrices);

    if (categories.has(candidate.category)) score += 5;
    if (targetPrice > 0) {
      const dist = Math.abs(candidate.price - targetPrice);
      score += Math.max(0, 3 - (dist / Math.max(1, targetPrice)) * 3);
    }

    score += (storefrontAnalytics.clickCountByProduct[candidate.id] || 0) * 0.1;
    score += (storefrontAnalytics.hoverCountByProduct[candidate.id] || 0) * 0.08;

    return score;
  }

  function renderRecommendations() {
    if (!recommendationsSection || !recommendationsGrid) return;

    const cart = getCartData();
    const cartIds = new Set(cart.rows.map((row) => row.id));
    const visibleProducts = getVisibleProducts();

    if (!visibleProducts.length) {
      recommendationsSection.hidden = true;
      return;
    }

    const ranked = visibleProducts
      .filter((product) => !cartIds.has(product.id))
      .map((product) => ({
        ...product,
        score: scoreRecommendation(product, cart.rows)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    if (!ranked.length) {
      recommendationsSection.hidden = true;
      return;
    }

    recommendationsSection.hidden = false;
    recommendationsGrid.innerHTML = ranked.map((item) => `
      <article class="recommend-card" data-product="${item.id}">
        <span class="recommend-emoji">${item.emoji}</span>
        <div class="recommend-info">
          <h4 class="recommend-name">${item.name}</h4>
          <p class="recommend-price">${formatPriceSafe(item.price)}</p>
        </div>
        <button type="button" class="recommend-add-btn" data-product="${item.id}" aria-label="إضافة ${item.name}">+</button>
      </article>
    `).join('');
  }

  function bindRecommendationActions() {
    if (!recommendationsGrid) return;

    recommendationsGrid.addEventListener('click', (event) => {
      const addBtn = event.target.closest('.recommend-add-btn[data-product]');
      if (!addBtn) return;

      const productId = addBtn.dataset.product;
      if (!productId) return;

      const cardActionBtn = document.querySelector(`.market-product-card[data-product="${productId}"] button[data-action="add"]`);
      if (cardActionBtn) {
        cardActionBtn.click();
      } else {
        updateProductQuantity(productId, 'inc');
      }

      addBtn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.12)' },
        { transform: 'scale(1)' }
      ], { duration: 180, easing: 'ease-out' });

      emitAnalytics('recommendation:add_click', { productId });
      renderCartDrawer();
      renderRecommendations();
    });
  }

  function observeLazyImages() {
    const images = Array.from(document.querySelectorAll('.lazy-product-image'));
    if (!images.length) return;

    if (!('IntersectionObserver' in window)) {
      images.forEach((img) => {
        const src = img.getAttribute('data-src');
        if (src) img.src = src;
      });
      return;
    }

    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.getAttribute('data-src');
        if (src && img.src !== src) {
          img.src = src;
        }
        io.unobserve(img);
      });
    }, {
      rootMargin: '120px 0px 120px 0px',
      threshold: 0.01
    });

    images.forEach((img) => {
      img.addEventListener('load', () => {
        img.classList.add('loaded');
        const media = img.closest('.market-product-media');
        if (media) {
          media.classList.remove('is-loading');
          media.classList.add('image-ready');
        }
      }, { once: true });

      observer.observe(img);
    });
  }

  function bindBehaviorTracking() {
    // Hover duration tracking via event delegation.
    productsGrid.addEventListener('pointerover', (event) => {
      const card = event.target.closest('.market-product-card[data-product]');
      if (!card) return;
      if (card.contains(event.relatedTarget)) return;

      const productId = card.dataset.product;
      if (!productId) return;
      hoverStartByProduct.set(productId, performance.now());
      storefrontAnalytics.hoverCountByProduct[productId] = (storefrontAnalytics.hoverCountByProduct[productId] || 0) + 1;
      emitAnalytics('product:hover_start', { productId });
    });

    productsGrid.addEventListener('pointerout', (event) => {
      const card = event.target.closest('.market-product-card[data-product]');
      if (!card) return;
      if (card.contains(event.relatedTarget)) return;

      const productId = card.dataset.product;
      const startedAt = hoverStartByProduct.get(productId);
      if (!startedAt) return;

      const elapsed = Math.max(0, performance.now() - startedAt);
      hoverStartByProduct.delete(productId);
      storefrontAnalytics.hoverTimeByProductMs[productId] = (storefrontAnalytics.hoverTimeByProductMs[productId] || 0) + elapsed;
      emitAnalytics('product:hover_end', { productId, elapsedMs: Math.round(elapsed) });
    });

    productsGrid.addEventListener('click', (event) => {
      const card = event.target.closest('.market-product-card[data-product]');
      if (!card) return;
      const productId = card.dataset.product;
      storefrontAnalytics.clickCountByProduct[productId] = (storefrontAnalytics.clickCountByProduct[productId] || 0) + 1;

      const actionBtn = event.target.closest('button[data-action]');
      if (actionBtn && (actionBtn.dataset.action === 'add' || actionBtn.dataset.action === 'increase')) {
        storefrontAnalytics.addToCartByProduct[productId] = (storefrontAnalytics.addToCartByProduct[productId] || 0) + 1;
        emitAnalytics('product:add_to_cart_click', { productId, action: actionBtn.dataset.action });
      }

      emitAnalytics('product:card_click', { productId });
    });

    // Keyboard add shortcut on focused product card.
    productsGrid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.market-product-card[data-product]');
      if (!card) return;
      const addBtn = card.querySelector('button[data-action="add"]');
      if (!addBtn) return;
      event.preventDefault();
      addBtn.click();
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
        const depth = Math.round((window.scrollY / scrollable) * 100);
        if (depth > maxScrollDepth) {
          maxScrollDepth = depth;
          storefrontAnalytics.scrollDepthPercentMax = depth;
          emitAnalytics('page:scroll_depth', { depth });
        }
        ticking = false;
      });
    }, { passive: true });
  }

  function bootstrap() {
    forceDrawerClosed();

    bindDrawerActions();
    bindRecommendationActions();
    bindBehaviorTracking();
    renderCartDrawer();
    updateSurfaceCounters();
    renderRecommendations();
    observeLazyImages();

    document.addEventListener('products:rendered', () => {
      observeLazyImages();
      renderRecommendations();
    });

    document.addEventListener('prices:updated', () => {
      renderCartDrawer();
      renderRecommendations();
    });

    document.addEventListener('cart:changed', () => {
      renderCartDrawer();
      renderRecommendations();
      updateSurfaceCounters();
    });

    // Keep UI in sync if another tab updates localStorage.
    window.addEventListener('storage', (event) => {
      if (event.key !== CART_STORAGE_KEY) return;
      renderCartDrawer();
      renderRecommendations();
      updateSurfaceCounters();
    });

    window.addEventListener('resize', updateSurfaceCounters, { passive: true });
    window.addEventListener('pageshow', forceDrawerClosed);
  }

  bootstrap();
})();

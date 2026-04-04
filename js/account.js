(() => {
  'use strict';

  const CUSTOMER_PHONE_STORAGE_KEY = 'oneMarketCustomerPhone';
  const ORDER_STATUS_MAP = {
    pending: { label: 'قيد المراجعة', className: 'pending' },
    preparing: { label: 'جاري التحضير', className: 'preparing' },
    out_for_delivery: { label: 'جاري التوصيل مع المندوب', className: 'out_for_delivery' },
    completed: { label: 'تم التسليم', className: 'completed' },
    cancelled: { label: 'تم الإلغاء', className: 'cancelled' }
  };

  const state = {
    service: null,
    user: null,
    profile: null,
    orders: []
  };

  function getEl(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizePhone(value = '') {
    return String(value || '').replace(/\D/g, '');
  }

  function rememberCustomerPhone(phone = '') {
    try {
      const normalized = normalizePhone(phone);
      if (!normalized) return;
      localStorage.setItem(CUSTOMER_PHONE_STORAGE_KEY, normalized);
    } catch (_) {}
  }

  function getRememberedCustomerPhone() {
    try {
      return normalizePhone(localStorage.getItem(CUSTOMER_PHONE_STORAGE_KEY) || '');
    } catch (_) {
      return '';
    }
  }

  function showNotice(icon, title, text) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({ icon, title, text });
      return;
    }
    window.alert(text || title);
  }

  function isValidPhone(phone = '') {
    if (typeof validatePhone === 'function') {
      return validatePhone(phone);
    }
    const digits = normalizePhone(phone);
    return digits.length === 11 || digits.length === 12;
  }

  function formatCurrency(value) {
    if (typeof formatPrice === 'function') {
      return formatPrice(Number(value) || 0);
    }
    return `${Math.round(Number(value) || 0)} جنيه`;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'غير محدد';
    if (typeof formatDateArabic === 'function') {
      return formatDateArabic(date);
    }
    return date.toLocaleString('ar-EG');
  }

  function getOrderSubmittedAt(order = {}) {
    return order?.submission?.submittedAt || order?.submittedAt || order?.timestamp || '';
  }

  function getOrderIdentifier(order = {}) {
    return String(order?.id || order?.orderId || order?.key || '').trim() || '-';
  }

  function normalizeStatus(status = '') {
    const raw = String(status || '').trim().toLowerCase();
    if (!raw) return 'pending';
    if (raw === 'processing') return 'preparing';
    if (raw === 'delivered') return 'completed';
    return raw;
  }

  function getStatusMeta(status = '') {
    const normalized = normalizeStatus(status);
    return ORDER_STATUS_MAP[normalized] || ORDER_STATUS_MAP.pending;
  }

  function getOrderStatusHistory(order = {}) {
    const rawHistory = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
    const normalized = rawHistory
      .map((entry = {}) => ({
        status: normalizeStatus(entry?.status || ''),
        at: entry?.at || entry?.timestamp || entry?.updatedAt || '',
        note: String(entry?.note || '').trim(),
        by: String(entry?.by || entry?.actor || '').trim(),
        deliveryAgentName: String(entry?.deliveryAgentName || '').trim(),
        deliveryAgentPhone: String(entry?.deliveryAgentPhone || '').trim(),
        cancellationReason: String(entry?.cancellationReason || '').trim()
      }))
      .filter((entry) => Boolean(entry.status));

    const currentStatus = normalizeStatus(order?.status || order?.submission?.status || '');
    const currentStatusAt = order?.statusUpdatedAt
      || order?.submission?.updatedAt
      || order?.updatedAt
      || order?.submission?.submittedAt
      || order?.submittedAt
      || order?.timestamp
      || new Date().toISOString();

    const hasCurrent = normalized.some((entry) => (
      entry.status === currentStatus
      && (!entry.at || String(entry.at) === String(currentStatusAt))
    ));

    if (!hasCurrent && currentStatus) {
      normalized.push({
        status: currentStatus,
        at: currentStatusAt,
        note: '',
        by: '',
        deliveryAgentName: String(order?.deliveryAgentName || '').trim(),
        deliveryAgentPhone: String(order?.deliveryAgentPhone || '').trim(),
        cancellationReason: String(order?.cancellationReason || '').trim()
      });
    }

    normalized.sort((a, b) => {
      const timeA = new Date(a.at).getTime();
      const timeB = new Date(b.at).getTime();
      return (Number.isFinite(timeA) ? timeA : 0) - (Number.isFinite(timeB) ? timeB : 0);
    });

    return normalized;
  }

  function renderOrderStatusHistory(order = {}) {
    const history = getOrderStatusHistory(order);
    if (!history.length) return '';

    const rows = history
      .slice(-6)
      .map((entry) => {
        const statusMeta = getStatusMeta(entry.status);
        const noteParts = [];
        if (entry.note) noteParts.push(entry.note);
        if (entry.cancellationReason) noteParts.push(`سبب الإلغاء: ${entry.cancellationReason}`);
        if (entry.deliveryAgentName) noteParts.push(`المندوب: ${entry.deliveryAgentName}`);
        if (entry.deliveryAgentPhone) noteParts.push(`رقم المندوب: ${entry.deliveryAgentPhone}`);
        if (entry.by) noteParts.push(`بواسطة: ${entry.by}`);
        const noteText = noteParts.join(' • ');

        return `
          <li class="orders-status-history-item">
            <span class="orders-status ${escapeHtml(statusMeta.className)}">${escapeHtml(statusMeta.label)}</span>
            <span class="orders-status-history-time">${escapeHtml(formatDate(entry.at))}</span>
            ${noteText ? `<span class="orders-status-history-note">${escapeHtml(noteText)}</span>` : ''}
          </li>
        `;
      })
      .join('');

    return `
      <div class="orders-status-history">
        <div class="orders-status-history-title">تتبع الحالة</div>
        <ul class="orders-status-history-list">${rows}</ul>
      </div>
    `;
  }

  function getDisplayAddress(order = {}) {
    const area = String(order?.deliveryArea || '').trim();
    const address = String(order?.address || '').trim();
    if (area && address.includes(area)) return address;
    if (area && address) return `${area} - ${address}`;
    return address || area || '-';
  }

  function getCustomerType(order = {}) {
    const accountType = String(order?.customerAccountType || '').trim().toLowerCase();
    if (accountType === 'registered' || accountType === 'guest') return accountType;

    const hasEmail = Boolean(String(order?.customerEmail || '').trim());
    const hasUid = Boolean(String(order?.customerUid || '').trim());
    const isAnonymous = typeof order?.customerIsAnonymous === 'boolean'
      ? order.customerIsAnonymous
      : !hasEmail;

    if ((hasUid && !isAnonymous) || hasEmail) return 'registered';
    return 'guest';
  }

  function getOrderItems(order = {}) {
    const items = order?.packageData?.items || {};
    const rows = Object.entries(items).map(([itemId, qty]) => {
      const product = typeof PRODUCTS !== 'undefined' ? PRODUCTS[itemId] : null;
      const name = product ? `${product.emoji} ${product.name}` : itemId;
      const unit = product ? product.unit : '';
      return `<li class="orders-item-row"><span>${escapeHtml(name)}</span><span class="item-qty">${escapeHtml(`${qty} ${unit}`.trim())}</span></li>`;
    });
    if (rows.length) return rows.join('');
    return '<li class="orders-item-row"><span>لا توجد عناصر</span></li>';
  }

  function isLoggedInUser(user = state.user) {
    return Boolean(user && !user.isAnonymous);
  }

  function getFirebaseService() {
    if (typeof FirebaseService === 'undefined') return null;
    if (typeof FirebaseService.isAvailable === 'function' && !FirebaseService.isAvailable()) return null;
    return FirebaseService;
  }

  function setAuthInputsDefaultPhone() {
    const authPhone = getEl('accountAuthPhone');
    if (!authPhone || authPhone.value) return;
    const remembered = getRememberedCustomerPhone();
    if (remembered) {
      authPhone.value = remembered;
    }
  }

  function updateHeaderCartCount() {
    const badge = getEl('cartCount');
    if (!badge) return;
    let count = 0;
    try {
      const packageData = typeof loadPackageFromStorage === 'function'
        ? loadPackageFromStorage()
        : JSON.parse(localStorage.getItem('cartPackage') || 'null');
      count = Object.keys(packageData?.items || {}).length;
    } catch (_) {
      count = 0;
    }
    badge.textContent = String(count);
  }

  function updateAuthUI() {
    const loggedOut = getEl('accountAuthLoggedOut');
    const loggedIn = getEl('accountAuthLoggedIn');
    const profilePanel = getEl('accountProfilePanel');
    const emailEl = getEl('accountUserEmail');
    const typeChip = getEl('accountUserTypeChip');
    const loggedInUser = isLoggedInUser();

    if (loggedOut) loggedOut.hidden = loggedInUser;
    if (loggedIn) loggedIn.hidden = !loggedInUser;
    if (profilePanel) profilePanel.hidden = !loggedInUser;
    if (emailEl) emailEl.textContent = state.user?.email || '-';

    if (typeChip) {
      const chipType = loggedInUser ? 'registered' : 'guest';
      typeChip.classList.remove('registered', 'guest');
      typeChip.classList.add(chipType);
      typeChip.textContent = chipType === 'registered' ? 'عميل مسجل' : 'ضيف';
    }
  }

  function populateProfileForm() {
    const nameInput = getEl('accountName');
    const phoneInput = getEl('accountPhone');
    const addressInput = getEl('accountAddress');

    const profileName = String(state.profile?.name || '').trim();
    const profilePhone = normalizePhone(state.profile?.phone || '');
    const profileAddress = String(state.profile?.address || '').trim();
    const rememberedPhone = getRememberedCustomerPhone();

    if (nameInput) nameInput.value = profileName;
    if (phoneInput) phoneInput.value = profilePhone || rememberedPhone;
    if (addressInput) addressInput.value = profileAddress;
  }

  function matchOrderByIdentity(order = {}, identity = {}) {
    const uid = String(identity.uid || '').trim();
    const phone = normalizePhone(identity.phone || '');

    if (uid && String(order?.customerUid || '').trim() === uid) {
      return true;
    }

    if (phone) {
      const orderPhone = normalizePhone(
        order?.customerPhoneNormalized || order?.customerPhone || order?.phone || ''
      );
      return orderPhone === phone;
    }

    return false;
  }

  function sortOrdersByDate(orders = []) {
    return (Array.isArray(orders) ? orders.slice() : []).sort((a, b) => {
      const dateA = new Date(getOrderSubmittedAt(a)).getTime() || 0;
      const dateB = new Date(getOrderSubmittedAt(b)).getTime() || 0;
      return dateB - dateA;
    });
  }

  function renderOrdersEmpty(message = 'لا توجد طلبات مطابقة لهذا الحساب حالياً.') {
    const listEl = getEl('accountOrdersList');
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="empty-cart-message">
        <div class="empty-cart-icon">📦</div>
        <div class="empty-cart-text">${escapeHtml(message)}</div>
        <a href="shop.html" class="continue-shopping-btn">ابدأ التسوق</a>
      </div>
    `;
  }

  function renderOrders(orders = []) {
    const listEl = getEl('accountOrdersList');
    const countEl = getEl('accountOrdersCount');
    const hintEl = getEl('accountOrdersHint');
    if (!listEl) return;

    const normalized = sortOrdersByDate(orders);
    state.orders = normalized;
    if (countEl) countEl.textContent = String(normalized.length);
    if (hintEl) {
      hintEl.textContent = isLoggedInUser()
        ? 'إجمالي طلبات حسابك (قديمة + جديدة):'
        : 'إجمالي الطلبات المرتبطة برقم الهاتف:';
    }

    if (!normalized.length) {
      renderOrdersEmpty();
      return;
    }

    listEl.innerHTML = normalized.map((order) => {
      const statusMeta = getStatusMeta(order?.status || order?.submission?.status);
      const submittedAt = getOrderSubmittedAt(order);
      const customerType = getCustomerType(order) === 'registered' ? 'عميل مسجل' : 'ضيف';
      const statusUpdatedAt = order?.statusUpdatedAt || order?.submission?.updatedAt || order?.updatedAt || submittedAt;
      const deliveryAgentName = String(order?.deliveryAgentName || '').trim();
      const deliveryAgentPhone = String(order?.deliveryAgentPhone || '').trim();
      const cancellationReason = String(order?.cancellationReason || '').trim();
      return `
        <article class="orders-card">
          <div class="orders-card-top">
            <div>
              <div class="orders-id">طلب #${escapeHtml(getOrderIdentifier(order))}</div>
              <div class="orders-date">${escapeHtml(formatDate(submittedAt))}</div>
            </div>
            <span class="orders-status ${escapeHtml(statusMeta.className)}">${escapeHtml(statusMeta.label)}</span>
          </div>

          <div class="orders-package">${escapeHtml(order?.packageData?.emoji || '🛒')} ${escapeHtml(order?.packageData?.name || 'طلب مخصص')}</div>
          <ul class="orders-items">${getOrderItems(order)}</ul>
          ${renderOrderStatusHistory(order)}

          <div class="orders-meta">
            <div class="orders-meta-row"><span>الاسم</span><b>${escapeHtml(order?.name || 'غير متوفر')}</b></div>
            <div class="orders-meta-row"><span>الهاتف</span><b>${escapeHtml(order?.phone || 'غير متوفر')}</b></div>
            <div class="orders-meta-row"><span>عنوان التوصيل</span><b>${escapeHtml(getDisplayAddress(order))}</b></div>
            ${deliveryAgentName ? `<div class="orders-meta-row"><span>اسم المندوب</span><b>${escapeHtml(deliveryAgentName)}</b></div>` : ''}
            ${deliveryAgentPhone ? `<div class="orders-meta-row"><span>رقم المندوب</span><b>${escapeHtml(deliveryAgentPhone)}</b></div>` : ''}
            ${cancellationReason ? `<div class="orders-meta-row"><span>سبب الإلغاء</span><b>${escapeHtml(cancellationReason)}</b></div>` : ''}
            <div class="orders-meta-row"><span>نوع العميل</span><b>${escapeHtml(customerType)}</b></div>
            <div class="orders-meta-row"><span>طريقة الدفع</span><b>${escapeHtml(order?.paymentMethod || 'غير محدد')}</b></div>
            <div class="orders-meta-row"><span>آخر تحديث للحالة</span><b>${escapeHtml(formatDate(statusUpdatedAt))}</b></div>
            <div class="orders-meta-row total"><span>الإجمالي</span><b>${escapeHtml(formatCurrency(order?.price || 0))}</b></div>
          </div>
        </article>
      `;
    }).join('');
  }

  function getIdentityFromState() {
    const profilePhone = normalizePhone(state.profile?.phone || '');
    const profilePhoneInput = normalizePhone(getEl('accountPhone')?.value || '');
    const authPhoneInput = normalizePhone(getEl('accountAuthPhone')?.value || '');
    const rememberedPhone = getRememberedCustomerPhone();

    const identity = {
      uid: String(state.user?.uid || '').trim(),
      phone: profilePhone || profilePhoneInput || authPhoneInput || rememberedPhone
    };

    if (identity.phone) {
      rememberCustomerPhone(identity.phone);
    }
    return identity;
  }

  async function loadOrders() {
    if (!state.service) {
      renderOrdersEmpty('خدمة الحساب غير متاحة حالياً. تأكد من إعدادات Firebase.');
      return;
    }

    const identity = getIdentityFromState();
    if (!identity.uid && !identity.phone) {
      renderOrdersEmpty('سجل دخولك أو أدخل رقم الهاتف لعرض الطلبات المرتبطة بك.');
      return;
    }

    const refreshBtn = getEl('accountRefreshOrdersBtn');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      let result = null;
      if (typeof state.service.getOrdersByCustomer === 'function') {
        result = await state.service.getOrdersByCustomer(identity);
      } else if (state.service.Orders && typeof state.service.Orders.getByCustomer === 'function') {
        result = await state.service.Orders.getByCustomer(identity);
      } else if (typeof state.service.getAllOrders === 'function') {
        result = await state.service.getAllOrders();
        if (result?.success) {
          result.orders = (result.orders || []).filter((order) => matchOrderByIdentity(order, identity));
        }
      }

      if (!result?.success) {
        throw new Error(result?.error || 'تعذر جلب الطلبات');
      }

      renderOrders(result.orders || []);
    } catch (error) {
      renderOrdersEmpty('تعذر تحميل الطلبات حالياً. حاول مرة أخرى.');
      showNotice('error', 'خطأ', error?.message || 'تعذر تحميل الطلبات');
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  async function loadProfile() {
    if (!state.service || !isLoggedInUser()) {
      state.profile = null;
      populateProfileForm();
      return;
    }

    try {
      const result = await state.service.getCustomerProfile(state.user.uid);
      if (result?.success && result.profile) {
        state.profile = result.profile;
      } else {
        state.profile = {
          email: state.user.email || '',
          role: 'customer'
        };
      }
    } catch (_) {
      state.profile = {
        email: state.user.email || '',
        role: 'customer'
      };
    }

    populateProfileForm();
  }

  async function saveProfile() {
    if (!state.service || !isLoggedInUser()) {
      showNotice('warning', 'تنبيه', 'سجل دخولك أولاً لحفظ بيانات الحساب.');
      return;
    }

    const name = String(getEl('accountName')?.value || '').trim();
    const phone = normalizePhone(getEl('accountPhone')?.value || '');
    const address = String(getEl('accountAddress')?.value || '').trim();

    if (name && typeof validateName === 'function' && !validateName(name)) {
      showNotice('warning', 'تنبيه', 'الاسم يجب أن يكون 3 أحرف على الأقل.');
      return;
    }

    if (!phone || !isValidPhone(phone)) {
      showNotice('warning', 'تنبيه', 'اكتب رقم هاتف صحيح لربط طلباتك القديمة.');
      return;
    }

    if (address && typeof validateAddress === 'function' && !validateAddress(address)) {
      showNotice('warning', 'تنبيه', 'العنوان يجب أن يكون أوضح (10 أحرف على الأقل).');
      return;
    }

    const saveBtn = getEl('accountSaveProfileBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
      const payload = {
        ...(state.profile || {}),
        role: state.profile?.role || 'customer',
        email: state.user?.email || state.profile?.email || '',
        name,
        phone,
        address
      };

      const result = await state.service.saveCustomerProfile(state.user.uid, payload);
      if (!result?.success) {
        throw new Error(result?.error || 'تعذر حفظ بيانات الحساب');
      }

      state.profile = payload;
      rememberCustomerPhone(phone);
      showNotice('success', 'تم', 'تم حفظ بيانات الحساب بنجاح.');
      await loadOrders();
    } catch (error) {
      showNotice('error', 'خطأ', error?.message || 'تعذر حفظ البيانات');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function handleAuthAction(mode = 'login') {
    if (!state.service) {
      showNotice('warning', 'تنبيه', 'خدمة الحساب غير متاحة حالياً.');
      return;
    }

    const email = String(getEl('accountAuthEmail')?.value || '').trim();
    const password = String(getEl('accountAuthPassword')?.value || '').trim();
    const phone = normalizePhone(getEl('accountAuthPhone')?.value || '');

    if (!email || !password) {
      showNotice('warning', 'تنبيه', 'اكتب البريد الإلكتروني وكلمة المرور أولاً.');
      return;
    }

    if (phone && !isValidPhone(phone)) {
      showNotice('warning', 'تنبيه', 'رقم الهاتف غير صحيح.');
      return;
    }

    const actionBtn = getEl(mode === 'register' ? 'accountRegisterBtn' : 'accountLoginBtn');
    if (actionBtn) actionBtn.disabled = true;

    try {
      let result = null;
      if (mode === 'register') {
        const profileData = phone ? { phone } : {};
        result = await state.service.registerCustomer(email, password, profileData);
      } else {
        result = await state.service.loginCustomer(email, password);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'تعذر تسجيل الدخول');
      }

      if (phone) {
        rememberCustomerPhone(phone);
      }

      showNotice(
        'success',
        'تم',
        mode === 'register'
          ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح.'
          : 'تم تسجيل الدخول بنجاح.'
      );
    } catch (error) {
      showNotice('error', 'خطأ', error?.message || 'تعذر تنفيذ العملية');
    } finally {
      if (actionBtn) actionBtn.disabled = false;
    }
  }

  async function handleLogout() {
    if (!state.service || typeof state.service.logout !== 'function') {
      showNotice('warning', 'تنبيه', 'تعذر تنفيذ تسجيل الخروج حالياً.');
      return;
    }

    const logoutBtn = getEl('accountLogoutBtn');
    if (logoutBtn) logoutBtn.disabled = true;

    try {
      const result = await state.service.logout();
      if (!result?.success) {
        throw new Error(result?.error || 'تعذر تسجيل الخروج');
      }
      showNotice('success', 'تم', 'تم تسجيل الخروج.');
    } catch (error) {
      showNotice('error', 'خطأ', error?.message || 'تعذر تسجيل الخروج');
    } finally {
      if (logoutBtn) logoutBtn.disabled = false;
    }
  }

  function bindEvents() {
    const loginBtn = getEl('accountLoginBtn');
    const registerBtn = getEl('accountRegisterBtn');
    const logoutBtn = getEl('accountLogoutBtn');
    const saveForm = getEl('accountProfileForm');
    const refreshBtn = getEl('accountRefreshOrdersBtn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => handleAuthAction('login'));
    }
    if (registerBtn) {
      registerBtn.addEventListener('click', () => handleAuthAction('register'));
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    if (saveForm) {
      saveForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await saveProfile();
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener('click', loadOrders);
    }
  }

  async function handleAuthStateChange(payload = {}) {
    state.user = payload?.user || null;
    if (payload?.profile) {
      state.profile = payload.profile;
    } else if (!isLoggedInUser()) {
      state.profile = null;
    }

    updateAuthUI();
    await loadProfile();
    await loadOrders();
  }

  async function init() {
    state.service = getFirebaseService();
    bindEvents();
    updateHeaderCartCount();
    setAuthInputsDefaultPhone();

    window.addEventListener('storage', (event) => {
      if (event.key === 'cartPackage' || event.key === (typeof STORAGE_KEYS !== 'undefined' ? STORAGE_KEYS?.CURRENT_PACKAGE : 'cartPackage')) {
        updateHeaderCartCount();
      }
    });

    if (!state.service) {
      updateAuthUI();
      renderOrdersEmpty('خدمة الحساب غير متاحة حالياً. تأكد من إعدادات Firebase.');
      return;
    }

    if (typeof state.service.onAuthChange === 'function') {
      state.service.onAuthChange((payload) => {
        handleAuthStateChange(payload);
      });
      return;
    }

    state.user = typeof state.service.getCurrentUser === 'function'
      ? state.service.getCurrentUser()
      : null;
    updateAuthUI();
    await loadProfile();
    await loadOrders();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

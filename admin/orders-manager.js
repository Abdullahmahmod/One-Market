// Orders Manager - Admin dashboard order operations.
const OrdersManager = (function() {
  'use strict';

  let orders = [];
  let pollingInterval = null;
  const POLLING_INTERVAL = 5000;
  const VALID_STATUSES = ['pending', 'preparing', 'out_for_delivery', 'completed', 'cancelled'];
  const STATUS_LABELS = {
    pending: 'قيد المراجعة',
    preparing: 'جاري التحضير',
    out_for_delivery: 'جاري التوصيل مع المندوب',
    completed: 'تم التسليم',
    cancelled: 'تم الإلغاء'
  };
  const STATUS_COLORS = {
    pending: '#f6b100',
    preparing: '#0a7bdc',
    out_for_delivery: '#5b3fd1',
    completed: '#1e9a4b',
    cancelled: '#d63d3d'
  };

  function safeParse(raw, fallback) {
    try {
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function getOrderHistoryStorageKey() {
    if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS?.ORDER_HISTORY) {
      return STORAGE_KEYS.ORDER_HISTORY;
    }
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG?.STORAGE_KEYS?.ORDER_HISTORY) {
      return APP_CONFIG.STORAGE_KEYS.ORDER_HISTORY;
    }
    return 'orderHistory';
  }

  function saveLocalOrders(nextOrders) {
    try {
      localStorage.setItem(getOrderHistoryStorageKey(), JSON.stringify(nextOrders));
    } catch (error) {
      console.warn('لا يمكن حفظ الطلبات في localStorage:', error);
    }
  }

  function normalizeStatus(status) {
    const value = String(status || '').trim().toLowerCase();
    if (!value) return 'pending';
    if (value === 'processing') return 'preparing';
    return VALID_STATUSES.includes(value) ? value : 'pending';
  }

  function normalizePhone(value = '') {
    return String(value || '').replace(/\D/g, '');
  }

  function buildStatusHistoryEntry(status, meta = {}) {
    const normalizedStatus = normalizeStatus(status);
    const at = String(meta?.at || '').trim() || new Date().toISOString();
    const by = String(meta?.by || meta?.actor || '').trim() || 'admin';
    const note = String(meta?.note || '').trim();
    const deliveryAgentName = String(meta?.deliveryAgentName || '').trim();
    const deliveryAgentPhone = normalizePhone(meta?.deliveryAgentPhone || '');
    const cancellationReason = String(meta?.cancellationReason || '').trim();

    const entry = { status: normalizedStatus, at, by };
    if (note) entry.note = note;
    if (deliveryAgentName) entry.deliveryAgentName = deliveryAgentName;
    if (deliveryAgentPhone) entry.deliveryAgentPhone = deliveryAgentPhone;
    if (cancellationReason) entry.cancellationReason = cancellationReason;
    return entry;
  }

  async function collectStatusMeta(status, currentOrder = {}) {
    const normalizedStatus = normalizeStatus(status);
    const baseMeta = {
      deliveryAgentName: String(currentOrder?.deliveryAgentName || '').trim(),
      deliveryAgentPhone: normalizePhone(currentOrder?.deliveryAgentPhone || ''),
      cancellationReason: String(currentOrder?.cancellationReason || '').trim(),
      note: ''
    };

    if (normalizedStatus === 'cancelled') {
      if (typeof Swal !== 'undefined') {
        const result = await Swal.fire({
          title: 'سبب إلغاء الطلب',
          input: 'text',
          inputValue: baseMeta.cancellationReason,
          inputPlaceholder: 'اكتب سبب الإلغاء',
          confirmButtonText: 'حفظ',
          showCancelButton: true,
          cancelButtonText: 'إلغاء',
          inputValidator: (value) => {
            if (!String(value || '').trim()) return 'سبب الإلغاء مطلوب';
            return null;
          }
        });
        if (!result.isConfirmed) {
          return { cancelled: true, meta: null };
        }
        const reason = String(result.value || '').trim();
        return {
          cancelled: false,
          meta: {
            ...baseMeta,
            cancellationReason: reason,
            note: `سبب الإلغاء: ${reason}`
          }
        };
      }

      const reason = String(window.prompt('اكتب سبب إلغاء الطلب') || '').trim();
      if (!reason) {
        showError('سبب الإلغاء مطلوب.');
        return { cancelled: true, meta: null };
      }
      return {
        cancelled: false,
        meta: {
          ...baseMeta,
          cancellationReason: reason,
          note: `سبب الإلغاء: ${reason}`
        }
      };
    }

    if (normalizedStatus === 'out_for_delivery') {
      if (typeof Swal !== 'undefined') {
        const { value, isConfirmed } = await Swal.fire({
          title: 'بيانات المندوب',
          html: `
            <input id="deliveryAgentNameInput" class="swal2-input" placeholder="اسم المندوب" value="${escapeHtml(baseMeta.deliveryAgentName)}">
            <input id="deliveryAgentPhoneInput" class="swal2-input" placeholder="رقم المندوب" value="${escapeHtml(baseMeta.deliveryAgentPhone)}">
          `,
          focusConfirm: false,
          confirmButtonText: 'حفظ',
          showCancelButton: true,
          cancelButtonText: 'تخطي',
          preConfirm: () => {
            const nameEl = document.getElementById('deliveryAgentNameInput');
            const phoneEl = document.getElementById('deliveryAgentPhoneInput');
            const name = String(nameEl?.value || '').trim();
            const phone = normalizePhone(phoneEl?.value || '');
            return { name, phone };
          }
        });

        if (!isConfirmed) {
          return { cancelled: false, meta: { ...baseMeta } };
        }

        const deliveryAgentName = String(value?.name || '').trim();
        const deliveryAgentPhone = normalizePhone(value?.phone || '');
        const noteParts = [];
        if (deliveryAgentName) noteParts.push(`المندوب: ${deliveryAgentName}`);
        if (deliveryAgentPhone) noteParts.push(`رقم المندوب: ${deliveryAgentPhone}`);

        return {
          cancelled: false,
          meta: {
            ...baseMeta,
            deliveryAgentName,
            deliveryAgentPhone,
            note: noteParts.join(' • ')
          }
        };
      }

      const deliveryAgentName = String(window.prompt('اسم المندوب (اختياري)') || '').trim();
      const deliveryAgentPhone = normalizePhone(window.prompt('رقم المندوب (اختياري)') || '');
      const noteParts = [];
      if (deliveryAgentName) noteParts.push(`المندوب: ${deliveryAgentName}`);
      if (deliveryAgentPhone) noteParts.push(`رقم المندوب: ${deliveryAgentPhone}`);
      return {
        cancelled: false,
        meta: {
          ...baseMeta,
          deliveryAgentName,
          deliveryAgentPhone,
          note: noteParts.join(' • ')
        }
      };
    }

    return { cancelled: false, meta: baseMeta };
  }

  function getOrderIdentifier(order = {}) {
    return String(order?.key || order?.id || order?.orderId || '').trim();
  }

  function findOrderIndex(orderId) {
    const target = String(orderId || '').trim();
    if (!target) return -1;
    return orders.findIndex((order) => getOrderIdentifier(order) === target);
  }

  function normalizeOrder(order = {}) {
    const submittedAt = order?.submission?.submittedAt || order?.submittedAt || order?.timestamp || new Date().toISOString();
    const normalizedStatus = normalizeStatus(order?.status || order?.submission?.status);
    const identifier = getOrderIdentifier(order) || `OM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const statusUpdatedAt = order?.statusUpdatedAt || order?.submission?.updatedAt || order?.updatedAt || submittedAt;
    const rawHistory = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
    const normalizedHistory = rawHistory.length
      ? rawHistory
        .map((entry = {}) => buildStatusHistoryEntry(entry?.status || normalizedStatus, {
          at: entry?.at || entry?.timestamp || entry?.updatedAt || statusUpdatedAt,
          by: entry?.by || entry?.actor || 'admin',
          note: entry?.note || '',
          deliveryAgentName: entry?.deliveryAgentName || '',
          deliveryAgentPhone: entry?.deliveryAgentPhone || '',
          cancellationReason: entry?.cancellationReason || ''
        }))
      : [buildStatusHistoryEntry(normalizedStatus, {
        at: statusUpdatedAt,
        by: 'system',
        note: 'تم استلام الطلب'
      })];
    const normalizedItems = typeof sanitizeOrderItemsMap === 'function'
      ? sanitizeOrderItemsMap(
        order?.packageData?.items ? order.packageData
          : (order?.items && !Array.isArray(order.items)) ? order.items
            : order?.orderData?.items ? order.orderData.items
              : (order?.customProducts || order?.products || {})
      )
      : {};
    const normalizedOrderDetails = typeof extractOrderLineItems === 'function'
      ? extractOrderLineItems(order)
      : [];
    const normalizedDetailsText = String(order?.details || '').trim()
      || normalizedOrderDetails.map((item) => String(item?.summary || item?.name || '').trim()).filter(Boolean).join('\n');
    const normalizedItemsSummary = String(order?.itemsSummary || '').trim()
      || normalizedOrderDetails.map((item) => String(item?.summary || item?.name || '').trim()).filter(Boolean).join(' • ');

    return {
      ...order,
      id: identifier,
      orderId: identifier,
      status: normalizedStatus,
      statusUpdatedAt,
      statusHistory: normalizedHistory,
      deliveryAgentName: String(order?.deliveryAgentName || '').trim() || null,
      deliveryAgentPhone: normalizePhone(order?.deliveryAgentPhone || '') || null,
      cancellationReason: String(order?.cancellationReason || '').trim() || null,
      packageData: order?.packageData && typeof order.packageData === 'object'
        ? {
          ...order.packageData,
          items: Object.keys(normalizedItems).length
            ? normalizedItems
            : (order.packageData.items && typeof order.packageData.items === 'object' ? order.packageData.items : {})
        }
        : (Object.keys(normalizedItems).length ? { items: normalizedItems } : (order?.packageData || null)),
      items: normalizedItems,
      orderDetails: normalizedOrderDetails,
      details: normalizedDetailsText,
      itemsSummary: normalizedItemsSummary,
      submittedAt,
      submission: {
        ...(order?.submission || {}),
        status: normalizedStatus,
        submittedAt: order?.submission?.submittedAt || submittedAt,
        updatedAt: order?.submission?.updatedAt || statusUpdatedAt
      }
    };
  }

  function normalizeOrdersPayload(payload) {
    if (Array.isArray(payload)) {
      return payload.map(normalizeOrder);
    }
    if (payload?.success && Array.isArray(payload.orders)) {
      return payload.orders.map(normalizeOrder);
    }
    return [];
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[normalizeStatus(status)] || String(status || 'pending');
  }

  function getStatusColor(status) {
    return STATUS_COLORS[normalizeStatus(status)] || '#6c757d';
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

  function getCustomerTypeMeta(order = {}) {
    const type = getCustomerType(order);
    if (type === 'registered') {
      return { value: 'registered', label: 'عميل مسجل', className: 'is-registered' };
    }
    return { value: 'guest', label: 'ضيف', className: 'is-guest' };
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '-';
    return date.toLocaleString('ar-EG');
  }

  function getOrderItems(order = {}) {
    const details = Array.isArray(order?.orderDetails) && order.orderDetails.length
      ? order.orderDetails
      : (typeof extractOrderLineItems === 'function' ? extractOrderLineItems(order) : []);

    return details
      .map((item) => String(item?.summary || item?.name || '').trim())
      .filter(Boolean);
  }

  async function fetchOrdersFromFirebase() {
    if (typeof FirebaseService === 'undefined') return [];

    if (typeof FirebaseService.getAllOrders === 'function') {
      const payload = await FirebaseService.getAllOrders();
      const normalized = normalizeOrdersPayload(payload);
      if (normalized.length) return normalized;
    }

    if (FirebaseService.Orders && typeof FirebaseService.Orders.getAll === 'function') {
      const payload = await FirebaseService.Orders.getAll();
      const normalized = normalizeOrdersPayload(payload);
      if (normalized.length) return normalized;
    }

    return [];
  }

  function fetchOrdersFromLocalStorage() {
    const stored = localStorage.getItem(getOrderHistoryStorageKey());
    const parsed = safeParse(stored || '[]', []);
    return Array.isArray(parsed) ? parsed.map(normalizeOrder) : [];
  }

  async function getOrders() {
    try {
      const cloudOrders = await fetchOrdersFromFirebase();
      if (cloudOrders.length) {
        orders = cloudOrders;
        return orders;
      }
    } catch (error) {
      console.warn('تعذر جلب الطلبات من Firebase، سيتم استخدام البيانات المحلية:', error);
    }

    orders = fetchOrdersFromLocalStorage();
    return orders;
  }

  async function syncStatusToFirebase(order, newStatus, statusMeta = {}) {
    if (typeof FirebaseService === 'undefined') return false;

    const identifiers = [order?.key, order?.id, order?.orderId]
      .map((value) => String(value || '').trim())
      .filter(Boolean);
    const uniqueIdentifiers = Array.from(new Set(identifiers));

    for (const identifier of uniqueIdentifiers) {
      try {
        if (typeof FirebaseService.updateOrderStatus === 'function') {
          const result = await FirebaseService.updateOrderStatus(identifier, newStatus, statusMeta);
          if (!result || result.success !== false) return true;
        }
      } catch (_) {}

      try {
        if (FirebaseService.Orders && typeof FirebaseService.Orders.updateStatus === 'function') {
          const result = await FirebaseService.Orders.updateStatus(identifier, newStatus, statusMeta);
          if (!result || result.success !== false) return true;
        }
      } catch (_) {}
    }

    return false;
  }

  async function updateOrderStatus(orderId, newStatus, statusMeta = null) {
    const normalizedStatus = normalizeStatus(newStatus);
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      showError(`الحالة غير صالحة. القيم المسموحة: ${VALID_STATUSES.join(', ')}`);
      return false;
    }

    const index = findOrderIndex(orderId);
    if (index === -1) {
      showError('الطلب غير موجود.');
      return false;
    }

    const targetOrder = orders[index];
    let finalStatusMeta = statusMeta;
    if (!finalStatusMeta || typeof finalStatusMeta !== 'object') {
      const collected = await collectStatusMeta(normalizedStatus, targetOrder);
      if (collected?.cancelled) return false;
      finalStatusMeta = collected?.meta || {};
    }

    const safeMeta = {
      deliveryAgentName: String(finalStatusMeta?.deliveryAgentName || '').trim(),
      deliveryAgentPhone: normalizePhone(finalStatusMeta?.deliveryAgentPhone || ''),
      cancellationReason: String(finalStatusMeta?.cancellationReason || '').trim(),
      note: String(finalStatusMeta?.note || '').trim(),
      actor: String(finalStatusMeta?.actor || 'admin').trim() || 'admin'
    };
    const statusUpdatedAt = new Date().toISOString();
    const statusHistory = Array.isArray(targetOrder?.statusHistory) ? targetOrder.statusHistory.slice() : [];
    statusHistory.push(buildStatusHistoryEntry(normalizedStatus, {
      at: statusUpdatedAt,
      by: safeMeta.actor,
      note: safeMeta.note,
      deliveryAgentName: safeMeta.deliveryAgentName,
      deliveryAgentPhone: safeMeta.deliveryAgentPhone,
      cancellationReason: safeMeta.cancellationReason
    }));
    orders[index] = {
      ...targetOrder,
      status: normalizedStatus,
      statusUpdatedAt,
      statusHistory,
      deliveryAgentName: safeMeta.deliveryAgentName || targetOrder?.deliveryAgentName || null,
      deliveryAgentPhone: safeMeta.deliveryAgentPhone || targetOrder?.deliveryAgentPhone || null,
      cancellationReason: normalizedStatus === 'cancelled'
        ? (safeMeta.cancellationReason || targetOrder?.cancellationReason || null)
        : null,
      statusNote: safeMeta.note || targetOrder?.statusNote || null,
      submission: {
        ...(targetOrder?.submission || {}),
        status: normalizedStatus,
        updatedAt: statusUpdatedAt
      }
    };

    saveLocalOrders(orders);

    const synced = await syncStatusToFirebase(orders[index], normalizedStatus, safeMeta);
    if (!synced) {
      console.warn('تعذر مزامنة الحالة في Firebase، تم حفظها محليًا فقط.');
    }

    document.dispatchEvent(new CustomEvent('orders:updated', { detail: { type: 'status', orderId } }));
    showSuccess(`تم تحديث حالة الطلب ${orderId} إلى: ${getStatusLabel(normalizedStatus)}`);
    return true;
  }

  async function syncDeleteToFirebase(order) {
    if (typeof FirebaseService === 'undefined') return false;

    const identifiers = [order?.key, order?.id, order?.orderId]
      .map((value) => String(value || '').trim())
      .filter(Boolean);
    const uniqueIdentifiers = Array.from(new Set(identifiers));

    for (const identifier of uniqueIdentifiers) {
      try {
        if (typeof FirebaseService.deleteOrder === 'function') {
          const result = await FirebaseService.deleteOrder(identifier);
          if (!result || result.success !== false) return true;
        }
      } catch (_) {}

      try {
        if (FirebaseService.Orders && typeof FirebaseService.Orders.delete === 'function') {
          const result = await FirebaseService.Orders.delete(identifier);
          if (!result || result.success !== false) return true;
        }
      } catch (_) {}
    }
    return false;
  }

  async function deleteOrder(orderId) {
    if (!confirm('هل تريد حذف هذا الطلب نهائيًا؟')) return false;

    const index = findOrderIndex(orderId);
    if (index === -1) {
      showError('الطلب غير موجود.');
      return false;
    }

    const [removedOrder] = orders.splice(index, 1);
    saveLocalOrders(orders);
    await syncDeleteToFirebase(removedOrder);
    document.dispatchEvent(new CustomEvent('orders:updated', { detail: { type: 'delete', orderId } }));
    showSuccess('تم حذف الطلب.');
    return true;
  }

  async function addOrderNote(orderId, note) {
    const trimmed = String(note || '').trim();
    if (!trimmed) {
      showError('اكتب ملاحظة قبل الحفظ.');
      return false;
    }

    const index = findOrderIndex(orderId);
    if (index === -1) {
      showError('الطلب غير موجود.');
      return false;
    }

    const targetOrder = orders[index];
    const notes = Array.isArray(targetOrder?.notes) ? targetOrder.notes.slice() : [];
    notes.push({
      text: trimmed,
      timestamp: new Date().toISOString(),
      addedBy: 'admin'
    });

    orders[index] = { ...targetOrder, notes };
    saveLocalOrders(orders);
    showSuccess('تمت إضافة الملاحظة.');
    return true;
  }

  function getStats() {
    const stats = {
      total: orders.length,
      pending: 0,
      preparing: 0,
      out_for_delivery: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      todayOrders: 0,
      recurringOrders: 0
    };

    const todayKey = new Date().toDateString();
    orders.forEach((order) => {
      const status = normalizeStatus(order?.status || order?.submission?.status);
      stats[status] = (stats[status] || 0) + 1;
      stats.totalRevenue += Number(order?.price) || 0;

      const submittedAt = order?.submission?.submittedAt || order?.submittedAt || order?.timestamp;
      if (new Date(submittedAt).toDateString() === todayKey) {
        stats.todayOrders += 1;
      }

      if (order?.isRecurring) {
        stats.recurringOrders += 1;
      }
    });

    stats.avgOrderValue = stats.total ? Math.round(stats.totalRevenue / stats.total) : 0;
    return stats;
  }

  function exportOrdersCSV() {
    if (!orders.length) {
      showError('لا توجد طلبات للتصدير.');
      return;
    }

    let csv = 'رقم الطلب,العميل,نوع العميل,الهاتف,العنوان,الإجمالي,الحالة,آخر تحديث للحالة,سبب الإلغاء,اسم المندوب,رقم المندوب,طريقة الدفع,التاريخ\n';
    orders.forEach((order) => {
      const identifier = getOrderIdentifier(order);
      const submittedAt = order?.submission?.submittedAt || order?.submittedAt || order?.timestamp;
      const statusUpdatedAt = order?.statusUpdatedAt || order?.submission?.updatedAt || order?.updatedAt || submittedAt;
      const customerType = getCustomerTypeMeta(order).label;
      csv += `"${identifier}","${order?.name || ''}","${customerType}","${order?.phone || ''}","${getDisplayAddress(order)}",${Number(order?.price) || 0},"${getStatusLabel(order?.status)}","${formatDate(statusUpdatedAt)}","${order?.cancellationReason || ''}","${order?.deliveryAgentName || ''}","${order?.deliveryAgentPhone || ''}","${order?.paymentMethod || ''}","${formatDate(submittedAt)}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('تم تصدير الطلبات.');
  }

  function startPolling(callback) {
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
      await getOrders();
      if (typeof callback === 'function') callback(orders);
    }, POLLING_INTERVAL);
  }

  function stopPolling() {
    if (!pollingInterval) return;
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  const DashboardUI = {
    async renderOrdersTable(skipStartPolling = false) {
      const container = document.getElementById('ordersTableDiv');
      if (!container) return;

      if (!skipStartPolling) {
        startPolling(() => DashboardUI.renderOrdersTable(true));
      }

      if (!orders.length) {
        container.innerHTML = '<p class="admin-section__empty">لا توجد طلبات حالياً.</p>';
        return;
      }

      const rowsHtml = orders.slice().reverse().map((order) => {
        const identifier = getOrderIdentifier(order) || '-';
        const normalizedStatus = normalizeStatus(order?.status || order?.submission?.status);
        const statusColor = getStatusColor(normalizedStatus);
        const customerType = getCustomerTypeMeta(order);
        const orderItems = getOrderItems(order);
        const itemsSummary = orderItems.length ? orderItems.slice(0, 3).join(' • ') + (orderItems.length > 3 ? ` ...و${orderItems.length - 3}` : '') : '❌ بدون منتجات';
        const statusOptionsHtml = VALID_STATUSES.map((status) => (
          `<option value="${status}" ${status === normalizedStatus ? 'selected' : ''}>${getStatusLabel(status)}</option>`
        )).join('');

        return `
          <tr>
            <td><code>${escapeHtml(identifier)}</code></td>
            <td>${escapeHtml(order?.name || '-')}</td>
            <td><span class="adm-customer-badge ${escapeHtml(customerType.className)}">${escapeHtml(customerType.label)}</span></td>
            <td>${escapeHtml(order?.phone || '-')}</td>
            <td>${escapeHtml(itemsSummary)}</td>
            <td>${escapeHtml(getDisplayAddress(order))}</td>
            <td>${Number(order?.price) || 0} جنيه</td>
            <td>
              <select class="status-select order-status-select" data-order-id="${escapeHtml(identifier)}" data-current-status="${escapeHtml(normalizedStatus)}" style="border-color:${statusColor}">
                ${statusOptionsHtml}
              </select>
            </td>
            <td>${escapeHtml(order?.paymentMethod || 'غير محدد')}</td>
            <td>${escapeHtml(formatDate(order?.submission?.submittedAt || order?.submittedAt || order?.timestamp))}</td>
            <td>
              <button class="adm-btn adm-btn--small js-view-order" data-order-id="${escapeHtml(identifier)}">تفاصيل</button>
              <button class="adm-btn adm-btn--small adm-btn--danger js-delete-order" data-order-id="${escapeHtml(identifier)}">حذف</button>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div class="admin-section__content">
          <div class="admin-actions">
            <button class="adm-btn adm-btn--secondary" id="exportOrdersBtn" type="button">تصدير CSV</button>
            <button class="adm-btn adm-btn--secondary" id="refreshOrdersBtn" type="button">تحديث</button>
          </div>
          <table class="adm-table adm-table--orders">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>نوع العميل</th>
                <th>الهاتف</th>
                <th>المنتجات</th>
                <th>عنوان التوصيل</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
                <th>طريقة الدفع</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;

      const exportBtn = container.querySelector('#exportOrdersBtn');
      if (exportBtn) {
        exportBtn.addEventListener('click', exportOrdersCSV);
      }

      const refreshBtn = container.querySelector('#refreshOrdersBtn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          await getOrders();
          await DashboardUI.renderOrdersTable(true);
        });
      }

      container.querySelectorAll('.order-status-select').forEach((select) => {
        select.addEventListener('change', async (event) => {
          const orderId = event.currentTarget?.dataset?.orderId || '';
          const status = event.currentTarget?.value || 'pending';
          const previousStatus = event.currentTarget?.dataset?.currentStatus || 'pending';
          const ok = await updateOrderStatus(orderId, status);
          if (!ok) {
            event.currentTarget.value = previousStatus;
            return;
          }
          event.currentTarget.dataset.currentStatus = normalizeStatus(status);
          event.currentTarget.style.borderColor = getStatusColor(status);
        });
      });

      container.querySelectorAll('.js-view-order').forEach((button) => {
        button.addEventListener('click', () => {
          const orderId = button.dataset.orderId || '';
          DashboardUI.viewOrderDetails(orderId);
        });
      });

      container.querySelectorAll('.js-delete-order').forEach((button) => {
        button.addEventListener('click', async () => {
          const orderId = button.dataset.orderId || '';
          const ok = await deleteOrder(orderId);
          if (!ok) return;
          await DashboardUI.renderOrdersTable(true);
        });
      });
    },

    viewOrderDetails(orderId) {
      const index = findOrderIndex(orderId);
      if (index === -1) {
        showError('الطلب غير موجود.');
        return;
      }

      const order = orders[index];
      const identifier = getOrderIdentifier(order);
      const customerType = getCustomerTypeMeta(order);
      const orderItems = getOrderItems(order);
      const notes = Array.isArray(order?.notes) ? order.notes : [];

      const itemsHtml = orderItems.length
        ? `<h4>محتويات الطلب</h4><ul>${orderItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '<p>لا توجد عناصر مسجلة داخل هذا الطلب.</p>';

      const notesHtml = notes.length
        ? `<h4>ملاحظات</h4><ul>${notes.map((note) => `<li>[${escapeHtml(formatDate(note?.timestamp))}] ${escapeHtml(note?.text || '')}</li>`).join('')}</ul>`
        : '<p>لا توجد ملاحظات بعد.</p>';

      const statusHistory = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
      const statusHistoryHtml = statusHistory.length
        ? `<h4>سجل الحالة</h4><ul>${statusHistory.map((entry) => {
          const statusText = getStatusLabel(entry?.status || '');
          const when = formatDate(entry?.at || entry?.updatedAt || '');
          const by = String(entry?.by || entry?.actor || '').trim();
          const noteParts = [];
          if (entry?.note) noteParts.push(String(entry.note));
          if (entry?.cancellationReason) noteParts.push(`سبب الإلغاء: ${entry.cancellationReason}`);
          if (entry?.deliveryAgentName) noteParts.push(`المندوب: ${entry.deliveryAgentName}`);
          if (entry?.deliveryAgentPhone) noteParts.push(`رقم المندوب: ${entry.deliveryAgentPhone}`);
          if (by) noteParts.push(`بواسطة: ${by}`);
          const note = noteParts.length ? ` - ${escapeHtml(noteParts.join(' • '))}` : '';
          return `<li>[${escapeHtml(when)}] ${escapeHtml(statusText)}${note}</li>`;
        }).join('')}</ul>`
        : '<p>لا يوجد سجل حالة بعد.</p>';

      const detailsHtml = `
        <div class="order-details">
          <h3>تفاصيل الطلب ${escapeHtml(identifier)}</h3>
          <p><strong>العميل:</strong> ${escapeHtml(order?.name || '-')}</p>
          <p><strong>نوع العميل:</strong> ${escapeHtml(customerType.label)}</p>
          <p><strong>الهاتف:</strong> ${escapeHtml(order?.phone || '-')}</p>
          <p><strong>العنوان:</strong> ${escapeHtml(getDisplayAddress(order))}</p>
          ${order?.customerEmail ? `<p><strong>بريد الحساب:</strong> ${escapeHtml(order.customerEmail)}</p>` : ''}
          <p><strong>الإجمالي:</strong> ${Number(order?.price) || 0} جنيه</p>
          <p><strong>طريقة الدفع:</strong> ${escapeHtml(order?.paymentMethod || 'غير محدد')}</p>
          <p><strong>الحالة:</strong> ${escapeHtml(getStatusLabel(order?.status))}</p>
          ${order?.deliveryAgentName ? `<p><strong>اسم المندوب:</strong> ${escapeHtml(order.deliveryAgentName)}</p>` : ''}
          ${order?.deliveryAgentPhone ? `<p><strong>رقم المندوب:</strong> ${escapeHtml(order.deliveryAgentPhone)}</p>` : ''}
          ${order?.cancellationReason ? `<p><strong>سبب الإلغاء:</strong> ${escapeHtml(order.cancellationReason)}</p>` : ''}
          <p><strong>آخر تحديث للحالة:</strong> ${escapeHtml(formatDate(order?.statusUpdatedAt || order?.submission?.updatedAt || order?.updatedAt || order?.submittedAt || order?.timestamp))}</p>
          <p><strong>التاريخ:</strong> ${escapeHtml(formatDate(order?.submission?.submittedAt || order?.submittedAt || order?.timestamp))}</p>
          ${statusHistoryHtml}
          ${itemsHtml}
          ${notesHtml}
          <input type="text" id="orderNoteInput" placeholder="أضف ملاحظة..." />
          <button id="orderNoteBtn" class="adm-btn adm-btn--secondary" type="button">إضافة ملاحظة</button>
        </div>
      `;

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'تفاصيل الطلب',
          html: detailsHtml,
          icon: 'info',
          showConfirmButton: true,
          didOpen: () => {
            const noteBtn = document.getElementById('orderNoteBtn');
            if (!noteBtn) return;
            noteBtn.addEventListener('click', async () => {
              const input = document.getElementById('orderNoteInput');
              const note = input ? input.value : '';
              const ok = await addOrderNote(identifier, note);
              if (!ok) return;
              DashboardUI.viewOrderDetails(identifier);
            });
          }
        });
      } else {
        alert(`تفاصيل الطلب ${identifier}`);
      }
    }
  };

  function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
      return Swal.fire({ icon: 'success', title: 'تم', text: message, timer: 2000 });
    }
    alert(message);
  }

  function showError(message) {
    if (typeof Swal !== 'undefined') {
      return Swal.fire({ icon: 'error', title: 'خطأ', text: message });
    }
    alert(`خطأ: ${message}`);
  }

  return {
    getOrders,
    updateOrderStatus,
    deleteOrder,
    addOrderNote,
    getStats,
    exportOrdersCSV,
    startPolling,
    stopPolling,
    getStatusLabel,
    DashboardUI
  };
})();

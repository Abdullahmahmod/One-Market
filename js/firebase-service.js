/**
 * Firebase service layer for orders, products, packages, and auth.
 * Exposes a small API that the existing storefront can consume through a bridge.
 */

// Firebase compat/modular bridge helpers - only declare if not already done
if (typeof firebaseDatabaseApi === 'undefined') {
  var firebaseDatabaseApi = (typeof firebase !== 'undefined' && firebase.database) ? firebase.database : null;
}
if (typeof firebaseAuthApi === 'undefined') {
  var firebaseAuthApi = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth : null;
}

function ref(db, path) {
  if (db && typeof db.ref === 'function') {
    return db.ref(path);
  }
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.ref === 'function') {
    return firebaseDatabaseApi.ref(db, path);
  }
  throw new Error('Firebase database ref() is unavailable');
}

function set(targetRef, data) {
  if (targetRef && typeof targetRef.set === 'function') {
    return targetRef.set(data);
  }
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.set === 'function') {
    return firebaseDatabaseApi.set(targetRef, data);
  }
  throw new Error('Firebase database set() is unavailable');
}

function get(targetRef) {
  if (targetRef && typeof targetRef.once === 'function') {
    return targetRef.once('value');
  }
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.get === 'function') {
    return firebaseDatabaseApi.get(targetRef);
  }
  throw new Error('Firebase database get() is unavailable');
}

function update(targetRef, data) {
  if (targetRef && typeof targetRef.update === 'function') {
    return targetRef.update(data);
  }
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.update === 'function') {
    return firebaseDatabaseApi.update(targetRef, data);
  }
  throw new Error('Firebase database update() is unavailable');
}

function remove(targetRef) {
  if (targetRef && typeof targetRef.remove === 'function') {
    return targetRef.remove();
  }
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.remove === 'function') {
    return firebaseDatabaseApi.remove(targetRef);
  }
  throw new Error('Firebase database remove() is unavailable');
}

function push(targetRef) {
  if (targetRef && typeof targetRef.push === 'function') {
    return targetRef.push();
  }
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.push === 'function') {
    return firebaseDatabaseApi.push(targetRef);
  }
  throw new Error('Firebase database push() is unavailable');
}

function query(targetRef, ...constraints) {
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.query === 'function') {
    return firebaseDatabaseApi.query(targetRef, ...constraints);
  }
  return constraints.reduce((currentRef, constraint) => {
    if (typeof constraint === 'function') {
      return constraint(currentRef);
    }
    return currentRef;
  }, targetRef);
}

function orderByChild(path) {
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.orderByChild === 'function') {
    return firebaseDatabaseApi.orderByChild(path);
  }
  return (targetRef) => targetRef.orderByChild(path);
}

function limitToLast(limit) {
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.limitToLast === 'function') {
    return firebaseDatabaseApi.limitToLast(limit);
  }
  return (targetRef) => targetRef.limitToLast(limit);
}

function onValue(targetRef, successCallback, errorCallback) {
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.onValue === 'function') {
    return firebaseDatabaseApi.onValue(targetRef, successCallback, errorCallback);
  }
  return targetRef.on('value', successCallback, errorCallback);
}

function off(targetRef) {
  if (firebaseDatabaseApi && typeof firebaseDatabaseApi.off === 'function') {
    return firebaseDatabaseApi.off(targetRef);
  }
  return targetRef.off('value');
}

function createUserWithEmailAndPassword(auth, email, password) {
  if (firebaseAuthApi && typeof firebaseAuthApi.createUserWithEmailAndPassword === 'function') {
    return firebaseAuthApi.createUserWithEmailAndPassword(auth, email, password);
  }
  if (auth && typeof auth.createUserWithEmailAndPassword === 'function') {
    return auth.createUserWithEmailAndPassword(email, password);
  }
  throw new Error('Firebase auth createUserWithEmailAndPassword() is unavailable');
}

function signInWithEmailAndPassword(auth, email, password) {
  if (firebaseAuthApi && typeof firebaseAuthApi.signInWithEmailAndPassword === 'function') {
    return firebaseAuthApi.signInWithEmailAndPassword(auth, email, password);
  }
  if (auth && typeof auth.signInWithEmailAndPassword === 'function') {
    return auth.signInWithEmailAndPassword(email, password);
  }
  throw new Error('Firebase auth signInWithEmailAndPassword() is unavailable');
}

function signOut(auth) {
  if (firebaseAuthApi && typeof firebaseAuthApi.signOut === 'function') {
    return firebaseAuthApi.signOut(auth);
  }
  if (auth && typeof auth.signOut === 'function') {
    return auth.signOut();
  }
  throw new Error('Firebase auth signOut() is unavailable');
}

function onAuthStateChanged(auth, callback) {
  if (firebaseAuthApi && typeof firebaseAuthApi.onAuthStateChanged === 'function') {
    return firebaseAuthApi.onAuthStateChanged(auth, callback);
  }
  if (auth && typeof auth.onAuthStateChanged === 'function') {
    return auth.onAuthStateChanged(callback);
  }
  throw new Error('Firebase auth onAuthStateChanged() is unavailable');
}

function withTimestamps(data = {}, preserveCreatedAt = false) {
  const now = new Date().toISOString();
  return {
    ...data,
    ...(preserveCreatedAt && data.createdAt ? { createdAt: data.createdAt } : { createdAt: now }),
    updatedAt: now
  };
}

const VALID_ORDER_STATUSES = Object.freeze([
  'pending',
  'preparing',
  'out_for_delivery',
  'completed',
  'cancelled'
]);

function normalizeOrderStatus(status = '') {
  const raw = String(status || '').trim().toLowerCase();
  if (!raw) return 'pending';
  if (raw === 'processing') return 'preparing';
  if (raw === 'delivered') return 'completed';
  return VALID_ORDER_STATUSES.includes(raw) ? raw : 'pending';
}

function buildStatusHistoryEntry(status = 'pending', meta = {}) {
  const normalizedStatus = normalizeOrderStatus(status);
  const timestamp = String(meta?.at || meta?.timestamp || meta?.updatedAt || '').trim() || new Date().toISOString();
  const note = String(meta?.note || '').trim();
  const actor = String(meta?.actor || meta?.by || '').trim() || 'system';
  const entry = {
    status: normalizedStatus,
    at: timestamp,
    by: actor
  };

  if (note) {
    entry.note = note;
  }
  if (meta?.deliveryAgentName) {
    entry.deliveryAgentName = String(meta.deliveryAgentName).trim();
  }
  if (meta?.deliveryAgentPhone) {
    entry.deliveryAgentPhone = String(meta.deliveryAgentPhone).trim();
  }
  if (meta?.cancellationReason) {
    entry.cancellationReason = String(meta.cancellationReason).trim();
  }

  return entry;
}

function mapSnapshotList(snapshot) {
  const rows = [];
  snapshot.forEach((childSnapshot) => {
    rows.push({
      key: childSnapshot.key,
      ...childSnapshot.val()
    });
  });
  return rows;
}

function normalizePhone(value = '') {
  return String(value || '').replace(/\D/g, '');
}

function matchesCustomerOrder(order = {}, customer = {}) {
  const uid = String(customer.uid || customer.customerUid || '').trim();
  const phone = normalizePhone(customer.phone || customer.customerPhone || '');

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

function filterOrdersByCustomer(orders = [], customer = {}) {
  if (!Array.isArray(orders)) return [];
  return orders.filter((order) => matchesCustomerOrder(order, customer));
}

function generateFallbackOrderId(firebaseKey = '') {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const keyPart = String(firebaseKey || '').slice(-6).toUpperCase();
  return `OM-${Date.now()}-${keyPart || randomPart}`;
}

function extractFirebaseErrorCode(error) {
  return String(error?.code || '').trim();
}

function toReadableFirebaseError(error) {
  const code = extractFirebaseErrorCode(error);
  const fallback = error?.message || 'Unknown Firebase error';

  switch (code) {
    case 'auth/configuration-not-found':
      return 'Anonymous authentication is disabled in Firebase project settings';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled in Firebase Authentication settings';
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    default:
      return fallback;
  }
}

const FirebaseService = {
  isAvailable() {
  // Check if Firebase is configured and available
  if (!window.firebaseDB || !window.firebaseAuth) {
    console.warn('⚠️ Firebase not configured or not available');
    return false;
  }
  return true;
  },

  async ensureCustomerSession() {
    try {
      const auth = window.firebaseAuth;
      if (!auth) {
        return { success: false, error: 'Firebase auth is unavailable', skipSession: true };
      }

      // If already logged in, return current user
      if (auth.currentUser) {
        console.log('✅ Using existing Firebase user:', auth.currentUser.uid);
        return { success: true, user: auth.currentUser };
      }

      // Anonymous auth is disabled in Firebase, so we skip it
      console.warn('ℹ️ Anonymous authentication is disabled. Continuing without user session.');
      return { success: false, skipSession: true };
    } catch (error) {
      console.warn('⚠️ Session setup skipped:', error.message);
      return { success: false, skipSession: true };
    }
  },

  async saveOrder(orderData) {
    try {
      const db = window.firebaseDB;
      const ordersRef = ref(db, 'orders');
      const newOrderRef = push(ordersRef);
      
      // Try to get session, but continue even if it fails
      const sessionResult = await this.ensureCustomerSession();
      const userFromSession = sessionResult?.success ? sessionResult.user : null;
      const skipSession = sessionResult?.skipSession === true;
      
      const customerUid = String(orderData?.customerUid || userFromSession?.uid || '').trim();
      const customerPhone = String(orderData?.customerPhone || orderData?.phone || '').trim();
      const customerPhoneNormalized = normalizePhone(customerPhone);
      const customerEmail = String(orderData?.customerEmail || userFromSession?.email || '').trim();
      const customerIsAnonymous = typeof orderData?.customerIsAnonymous === 'boolean'
        ? orderData.customerIsAnonymous
        : (userFromSession ? Boolean(userFromSession?.isAnonymous) : true);
      const customerAccountType = String(
        orderData?.customerAccountType
        || (customerUid && !customerIsAnonymous ? 'registered' : 'guest')
      ).trim().toLowerCase();
      const orderId = orderData.orderId || orderData.id || generateFallbackOrderId(newOrderRef.key);
      const normalizedStatus = normalizeOrderStatus(orderData?.status || 'pending');
      const submittedAt = orderData.submittedAt || new Date().toISOString();
      const existingHistory = Array.isArray(orderData?.statusHistory)
        ? orderData.statusHistory
        : [];
      const statusHistory = existingHistory.length
        ? existingHistory.map((entry = {}) => buildStatusHistoryEntry(entry?.status || normalizedStatus, {
          at: entry?.at || entry?.timestamp || entry?.updatedAt || submittedAt,
          actor: entry?.by || entry?.actor || 'system',
          note: entry?.note || '',
          deliveryAgentName: entry?.deliveryAgentName || '',
          deliveryAgentPhone: entry?.deliveryAgentPhone || '',
          cancellationReason: entry?.cancellationReason || ''
        }))
        : [buildStatusHistoryEntry(normalizedStatus, {
          at: submittedAt,
          actor: 'system',
          note: 'Order received'
        })];
      const statusUpdatedAt = String(orderData?.statusUpdatedAt || '').trim() || statusHistory[statusHistory.length - 1]?.at || submittedAt;
      const deliveryAgentName = String(orderData?.deliveryAgentName || '').trim();
      const deliveryAgentPhone = String(orderData?.deliveryAgentPhone || '').trim();
      const cancellationReason = String(orderData?.cancellationReason || '').trim();
      const statusNote = String(orderData?.statusNote || '').trim();

      const normalized = withTimestamps({
        ...orderData,
        id: orderId,
        orderId,
        status: normalizedStatus,
        submittedAt,
        customerUid: customerUid || null,
        customerPhone: customerPhone || null,
        customerPhoneNormalized: customerPhoneNormalized || null,
        customerEmail: customerEmail || null,
        customerIsAnonymous: customerIsAnonymous,
        customerAccountType: customerAccountType === 'registered' ? 'registered' : 'guest',
        statusHistory,
        statusUpdatedAt,
        deliveryAgentName: deliveryAgentName || null,
        deliveryAgentPhone: deliveryAgentPhone || null,
        cancellationReason: cancellationReason || null,
        statusNote: statusNote || null
      });

      await set(newOrderRef, normalized);

      return {
        success: true,
        orderId,
        firebaseKey: newOrderRef.key,
        data: {
          key: newOrderRef.key,
          ...normalized
        }
      };
    } catch (error) {
      console.error('Firebase saveOrder failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllOrders() {
    try {
      const db = window.firebaseDB;
      const snapshot = await get(ref(db, 'orders'));
      if (!snapshot.exists()) return { success: true, orders: [] };
      return { success: true, orders: mapSnapshotList(snapshot).reverse() };
    } catch (error) {
      console.error('Firebase getAllOrders failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getOrdersByCustomer(customer = {}) {
    try {
      const result = await this.getAllOrders();
      if (!result.success) return result;
      return {
        success: true,
        orders: filterOrdersByCustomer(result.orders || [], customer)
      };
    } catch (error) {
      console.error('Firebase getOrdersByCustomer failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getRecentOrders(limit = 10) {
    try {
      const db = window.firebaseDB;
      const ordersRef = ref(db, 'orders');
      const recentQuery = query(ordersRef, orderByChild('createdAt'), limitToLast(limit));
      const snapshot = await get(recentQuery);
      if (!snapshot.exists()) return { success: true, orders: [] };
      return { success: true, orders: mapSnapshotList(snapshot).reverse() };
    } catch (error) {
      console.error('Firebase getRecentOrders failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getOrderById(orderId) {
    try {
      const db = window.firebaseDB;
      const snapshot = await get(ref(db, `orders/${orderId}`));
      if (snapshot.exists()) {
        return {
          success: true,
          order: {
            key: snapshot.key,
            ...snapshot.val()
          }
        };
      }

      const allOrdersResult = await this.getAllOrders();
      if (!allOrdersResult.success) return allOrdersResult;
      const matchedOrder = (allOrdersResult.orders || []).find((order) => (
        String(order?.id || '') === String(orderId)
        || String(order?.orderId || '') === String(orderId)
      ));
      if (!matchedOrder) return { success: false, error: 'Order not found' };
      return { success: true, order: matchedOrder };
    } catch (error) {
      console.error('Firebase getOrderById failed:', error);
      return { success: false, error: error.message };
    }
  },

  async resolveOrderKey(orderIdentifier) {
    try {
      const id = String(orderIdentifier || '').trim();
      if (!id) return { success: false, error: 'Order identifier is required' };

      const db = window.firebaseDB;
      const directSnapshot = await get(ref(db, `orders/${id}`));
      if (directSnapshot.exists()) {
        return { success: true, key: directSnapshot.key };
      }

      const allOrdersResult = await this.getAllOrders();
      if (!allOrdersResult.success) return allOrdersResult;

      const matchedOrder = (allOrdersResult.orders || []).find((order) => (
        String(order?.key || '') === id
        || String(order?.id || '') === id
        || String(order?.orderId || '') === id
      ));
      if (!matchedOrder?.key) {
        return { success: false, error: 'Order key not found' };
      }

      return { success: true, key: matchedOrder.key };
    } catch (error) {
      console.error('Firebase resolveOrderKey failed:', error);
      return { success: false, error: error.message };
    }
  },

  async updateOrderStatus(orderId, status, statusMeta = {}) {
    try {
      const db = window.firebaseDB;
      const keyResult = await this.resolveOrderKey(orderId);
      if (!keyResult.success || !keyResult.key) {
        return { success: false, error: keyResult.error || 'Order not found' };
      }

      const normalizedStatus = normalizeOrderStatus(status);
      const now = new Date().toISOString();
      const targetRef = ref(db, `orders/${keyResult.key}`);
      const snapshot = await get(targetRef);
      const orderData = snapshot.exists() ? (snapshot.val() || {}) : {};
      const history = Array.isArray(orderData?.statusHistory) ? orderData.statusHistory.slice() : [];
      const normalizedMeta = {
        ...statusMeta,
        deliveryAgentName: String(statusMeta?.deliveryAgentName || '').trim(),
        deliveryAgentPhone: String(statusMeta?.deliveryAgentPhone || '').trim(),
        cancellationReason: String(statusMeta?.cancellationReason || '').trim(),
        note: String(statusMeta?.note || '').trim(),
        actor: String(statusMeta?.actor || 'admin').trim() || 'admin'
      };

      history.push(buildStatusHistoryEntry(normalizedStatus, {
        at: now,
        actor: normalizedMeta.actor,
        note: normalizedMeta.note,
        deliveryAgentName: normalizedMeta.deliveryAgentName,
        deliveryAgentPhone: normalizedMeta.deliveryAgentPhone,
        cancellationReason: normalizedMeta.cancellationReason
      }));

      const payload = {
        status: normalizedStatus,
        statusUpdatedAt: now,
        statusHistory: history,
        'submission/status': normalizedStatus,
        'submission/updatedAt': now,
        updatedAt: now
      };

      if (normalizedStatus === 'out_for_delivery') {
        payload.deliveryAgentName = normalizedMeta.deliveryAgentName || null;
        payload.deliveryAgentPhone = normalizedMeta.deliveryAgentPhone || null;
      }
      if (normalizedStatus !== 'out_for_delivery' && normalizedMeta.deliveryAgentName) {
        payload.deliveryAgentName = normalizedMeta.deliveryAgentName;
      }
      if (normalizedStatus !== 'out_for_delivery' && normalizedMeta.deliveryAgentPhone) {
        payload.deliveryAgentPhone = normalizedMeta.deliveryAgentPhone;
      }

      if (normalizedStatus === 'cancelled') {
        payload.cancellationReason = normalizedMeta.cancellationReason || null;
      } else {
        payload.cancellationReason = null;
      }

      payload.statusNote = normalizedMeta.note || null;

      await update(targetRef, payload);
      return { success: true };
    } catch (error) {
      console.error('Firebase updateOrderStatus failed:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteOrder(orderId) {
    try {
      const db = window.firebaseDB;
      const keyResult = await this.resolveOrderKey(orderId);
      if (!keyResult.success || !keyResult.key) {
        return { success: false, error: keyResult.error || 'Order not found' };
      }

      await remove(ref(db, `orders/${keyResult.key}`));
      return { success: true };
    } catch (error) {
      console.error('Firebase deleteOrder failed:', error);
      return { success: false, error: error.message };
    }
  },

  async saveProduct(productId, productData) {
    try {
      const db = window.firebaseDB;
      await set(ref(db, `products/${productId}`), withTimestamps(productData, true));
      return { success: true };
    } catch (error) {
      console.error('Firebase saveProduct failed:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteProduct(productId) {
    try {
      const db = window.firebaseDB;
      await remove(ref(db, `products/${productId}`));
      return { success: true };
    } catch (error) {
      console.error('Firebase deleteProduct failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllProducts() {
    try {
      const db = window.firebaseDB;
      const snapshot = await get(ref(db, 'products'));
      return {
        success: true,
        products: snapshot.exists() ? snapshot.val() : {}
      };
    } catch (error) {
      console.error('Firebase getAllProducts failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getPriceMap() {
    const result = await this.getAllProducts();
    if (!result.success) return result;

    const prices = {};
    Object.entries(result.products || {}).forEach(([productId, product]) => {
      const numeric = Number(product?.unitPrice ?? product?.price ?? 0);
      const isActive = product?.isActive !== false;
      if (Number.isFinite(numeric) && numeric > 0 && isActive) {
        prices[productId] = numeric;
      }
    });

    return { success: true, source: 'firebase', prices, products: result.products || {} };
  },

  async savePrices(pricesMap = {}) {
    try {
      if (!pricesMap || typeof pricesMap !== 'object') {
        return { success: false, error: 'Invalid prices data' };
      }

      const db = window.firebaseDB;
      if (!db) {
        return { success: false, error: 'Firebase database not initialized' };
      }

      // Get existing products
      const productsResult = await this.getAllProducts();
      if (!productsResult.success) {
        return { success: false, error: 'Failed to fetch existing products' };
      }

      // Update prices for each product and save back to Firebase
      const updates = {};
      Object.entries(pricesMap).forEach(([productId, price]) => {
        const numeric = Number(price);
        if (Number.isFinite(numeric) && numeric >= 0) {
          // Update the unitPrice in the product object
          updates[`products/${productId}/unitPrice`] = numeric;
          updates[`products/${productId}/updatedAt`] = new Date().toISOString();
        }
      });

      if (Object.keys(updates).length === 0) {
        return { success: false, error: 'No valid prices to save' };
      }

      // Use update to atomically update multiple prices at once
      await update(ref(db, '/'), updates);

      return { 
        success: true, 
        message: 'تم حفظ الأسعار في Firebase',
        pricesSaved: Object.keys(updates).length / 2  // Divide by 2 because we have unitPrice and updatedAt
      };
    } catch (error) {
      console.error('Firebase savePrices failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getPackages() {
    try {
      const db = window.firebaseDB;
      const snapshot = await get(ref(db, 'packages'));
      return {
        success: true,
        packages: snapshot.exists() ? snapshot.val() : {}
      };
    } catch (error) {
      console.error('Firebase getPackages failed:', error);
      return { success: false, error: error.message };
    }
  },

  async updatePackage(packageId, packageData) {
    try {
      const db = window.firebaseDB;
      await set(ref(db, `packages/${packageId}`), withTimestamps(packageData, true));
      return { success: true };
    } catch (error) {
      console.error('Firebase updatePackage failed:', error);
      return { success: false, error: error.message };
    }
  },

  async saveCustomerProfile(userId, profileData) {
    try {
      const db = window.firebaseDB;
      await set(ref(db, `customers/${userId}`), withTimestamps(profileData, true));
      return { success: true };
    } catch (error) {
      console.error('Firebase saveCustomerProfile failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getCustomerProfile(userId) {
    try {
      const db = window.firebaseDB;
      const snapshot = await get(ref(db, `customers/${userId}`));
      if (!snapshot.exists()) return { success: false, error: 'Customer not found' };
      return { success: true, profile: snapshot.val() };
    } catch (error) {
      console.error('Firebase getCustomerProfile failed:', error);
      return { success: false, error: error.message };
    }
  },

  async registerCustomer(email, password, profileData = {}) {
    try {
      const auth = window.firebaseAuth;
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await this.saveCustomerProfile(result.user.uid, {
        email,
        role: 'customer',
        ...profileData
      });
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Firebase registerCustomer failed:', error);
      return { success: false, error: toReadableFirebaseError(error), code: extractFirebaseErrorCode(error) };
    }
  },

  async loginCustomer(email, password) {
    try {
      const auth = window.firebaseAuth;
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Firebase loginCustomer failed:', error);
      return { success: false, error: toReadableFirebaseError(error), code: extractFirebaseErrorCode(error) };
    }
  },

  async loginAdmin(email, password) {
    try {
      const auth = window.firebaseAuth;
      const result = await signInWithEmailAndPassword(auth, email, password);
      const profileResult = await this.getCustomerProfile(result.user.uid);
      const role = profileResult?.profile?.role || '';
      if (role !== 'admin') {
        await signOut(auth);
        return { success: false, error: 'This account does not have admin access' };
      }
      return { success: true, user: result.user, profile: profileResult.profile };
    } catch (error) {
      console.error('Firebase loginAdmin failed:', error);
      return { success: false, error: toReadableFirebaseError(error), code: extractFirebaseErrorCode(error) };
    }
  },

  async logout() {
    try {
      const auth = window.firebaseAuth;
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Firebase logout failed:', error);
      return { success: false, error: error.message };
    }
  },

  getCurrentUser() {
    try {
      const auth = window.firebaseAuth;
      return auth.currentUser || null;
    } catch (_) {
      return null;
    }
  },

  onAuthChange(callback) {
    try {
      const auth = window.firebaseAuth;
      return onAuthStateChanged(auth, async (user) => {
        if (!user) {
          callback({ success: true, user: null, profile: null });
          return;
        }
        const profileResult = await this.getCustomerProfile(user.uid);
        callback({
          success: true,
          user,
          profile: profileResult.success ? profileResult.profile : null
        });
      });
    } catch (error) {
      console.error('Firebase onAuthChange failed:', error);
      callback({ success: false, error: error.message });
      return () => {};
    }
  },

  onOrdersChange(callback) {
    try {
      const db = window.firebaseDB;
      const ordersRef = ref(db, 'orders');
      onValue(
        ordersRef,
        (snapshot) => {
          callback({
            success: true,
            orders: snapshot.exists() ? mapSnapshotList(snapshot).reverse() : []
          });
        },
        (error) => callback({ success: false, error: error.message })
      );
      return () => off(ordersRef);
    } catch (error) {
      console.error('Firebase onOrdersChange failed:', error);
      return () => {};
    }
  },

  onOrdersChangeByCustomer(customer = {}, callback) {
    return this.onOrdersChange((result) => {
      if (!result?.success) {
        callback(result);
        return;
      }
      callback({
        success: true,
        orders: filterOrdersByCustomer(result.orders || [], customer)
      });
    });
  },

  onProductsChange(callback) {
    try {
      const db = window.firebaseDB;
      const productsRef = ref(db, 'products');
      onValue(
        productsRef,
        (snapshot) => {
          callback({
            success: true,
            products: snapshot.exists() ? snapshot.val() : {}
          });
        },
        (error) => callback({ success: false, error: error.message })
      );
      return () => off(productsRef);
    } catch (error) {
      console.error('Firebase onProductsChange failed:', error);
      return () => {};
    }
  },

  async getDashboardStats() {
    try {
      const result = await this.getAllOrders();
      if (!result.success) return result;

      const orders = result.orders;
      const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);
      const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

      return {
        success: true,
        stats: {
          totalOrders: orders.length,
          totalRevenue,
          avgOrderValue,
          completedOrders: orders.filter((order) => order.status === 'completed').length,
          recurringOrders: orders.filter((order) => Boolean(order.isRecurring)).length,
          pendingOrders: orders.filter((order) => order.status === 'pending').length
        }
      };
    } catch (error) {
      console.error('Firebase getDashboardStats failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload product image to Firebase Storage
   * رفع صورة المنتج إلى Firebase Storage
   */
  async uploadProductImage(productId, file) {
    try {
      if (!window.firebaseStorage) {
        return { success: false, error: 'Firebase Storage not initialized' };
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = window.firebaseStorage.ref(`products/${productId}/${fileName}`);
      
      // Upload file
      const snapshot = await storageRef.put(file);
      
      // Get download URL
      const downloadUrl = await snapshot.ref.getDownloadURL();
      
      return {
        success: true,
        url: downloadUrl,
        path: `products/${productId}/${fileName}`,
        fileName: fileName
      };
    } catch (error) {
      console.error('Firebase uploadProductImage failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete product image from Firebase Storage
   * حذف صورة المنتج من Firebase Storage
   */
  async deleteProductImage(imagePath) {
    try {
      if (!window.firebaseStorage) {
        return { success: false, error: 'Firebase Storage not initialized' };
      }

      const storageRef = window.firebaseStorage.ref(imagePath);
      await storageRef.delete();
      
      return { success: true };
    } catch (error) {
      console.error('Firebase deleteProductImage failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update product with image URL
   * تحديث المنتج برابط الصورة
   */
  async updateProductImage(productId, imageUrl, imagePath = null) {
    try {
      const updates = {
        imageUrl: imageUrl,
        updatedAt: Date.now()
      };
      
      if (imagePath) {
        updates.imagePath = imagePath;
      }

      const result = await this.updateProduct(productId, updates);
      return result;
    } catch (error) {
      console.error('Firebase updateProductImage failed:', error);
      return { success: false, error: error.message };
    }
  }
};

FirebaseService.Orders = {
  add(orderData) {
    return FirebaseService.saveOrder(orderData);
  },
  getAll() {
    return FirebaseService.getAllOrders();
  },
  getByCustomer(customer = {}) {
    return FirebaseService.getOrdersByCustomer(customer);
  },
  getRecent(limit = 10) {
    return FirebaseService.getRecentOrders(limit);
  },
  get(orderId) {
    return FirebaseService.getOrderById(orderId);
  },
  updateStatus(orderId, status, statusMeta = {}) {
    return FirebaseService.updateOrderStatus(orderId, status, statusMeta);
  },
  delete(orderId) {
    return FirebaseService.deleteOrder(orderId);
  },
  subscribe(callback) {
    return FirebaseService.onOrdersChange(callback);
  },
  subscribeByCustomer(customer = {}, callback) {
    return FirebaseService.onOrdersChangeByCustomer(customer, callback);
  }
};

if (typeof window !== 'undefined') {
  window.FirebaseService = FirebaseService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseService;
}

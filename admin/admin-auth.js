/**
 * Firebase Admin Authentication
 * ================================
 * تأمين لوحة التحكم والإدارة بمصادقة Firebase Auth القوية
 * 
 * فقط المسؤولون المسجلون يمكنهم الوصول إلى:
 * - Dashboard (لوحة التحكم)
 * - Price Manager (مدير التسعير)
 * - Admin Functions (الوظائف الإدارية)
 */

class AdminAuth {
  constructor() {
    this.user = null;
    this.isAdmin = null; // IMPORTANT: null = still checking, false = checked and NOT admin, true = admin
    this.adminCache = new Map();
    this.adminCheckPromise = null;
    this.adminCheckResolver = null;
    console.log('🔐 AdminAuth class instantiated');
    this.initializeAuth();
  }

  /**
   * Initialize Firebase Authentication
   */
  initializeAuth() {
    // Ensure Firebase is available and an app is initialized
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK not loaded. Please include firebase-config.js first');
      return;
    }

    // If no Firebase app initialized yet, wait for bridge event and retry
    try {
      if (!Array.isArray(firebase.apps) || firebase.apps.length === 0) {
        console.warn('⚠️ Firebase app not initialized yet — deferring auth init');
        document.addEventListener('firebase:ready', () => setTimeout(() => this.initializeAuth(), 50));
        return;
      }
    } catch (err) {
      console.warn('⚠️ Unable to detect firebase.apps, deferring auth init', err);
      document.addEventListener('firebase:ready', () => setTimeout(() => this.initializeAuth(), 50));
      return;
    }

    // Listen to auth state changes (guard with try/catch to avoid SDK errors)
    try {
      firebase.auth().onAuthStateChanged(
        (user) => this.handleAuthStateChange(user),
        (error) => this.handleAuthError(error)
      );
    } catch (err) {
      console.error('❌ Failed to initialize Firebase Auth:', err);
    }
  }

  /**
   * Handle auth state changes
   */
  handleAuthStateChange(user) {
    console.log(`🔄 Auth state changed: user=${user?.email || 'none'}`);
    this.user = user;
    
    if (user) {
      console.log('✅ User authenticated:', user.email);
      // Create a new promise for this admin check
      this.adminCheckPromise = new Promise((resolve) => {
        this.adminCheckResolver = resolve;
      });
      console.log('⏳ Starting admin claims check...');
      this.checkAdminStatus(user);
    } else {
      console.log('⚠️ User not authenticated');
      this.isAdmin = false; // User logged out
      if (this.adminCheckResolver) {
        this.adminCheckResolver(false);
      }
      this.redirectToLogin();
    }
  }

  /**
   * Handle auth errors
   */
  handleAuthError(error) {
    console.error('❌ Auth error:', error);
  }

  /**
   * Check if user is admin in Firebase
   */
  async checkAdminStatus(user) {
    console.log(`🔍 Checking admin claims for ${user.email}...`);
    try {
      // Check custom claims with force refresh to get latest claims
      const idTokenResult = await user.getIdTokenResult(true); // true = force refresh
      const isAdmin = idTokenResult.claims.admin === true;
      
      console.log(`📋 ID Token claims received:`, { 
        hasAdminClaim: isAdmin, 
        admin: idTokenResult.claims.admin,
        allClaims: Object.keys(idTokenResult.claims)
      });
      
      if (isAdmin) {
        this.isAdmin = true;
        console.log('✅ Admin access granted for:', user.email);
        
        // Write admin status to Realtime Database for Security Rules to check
        try {
          if (typeof firebase !== 'undefined' && firebase.database) {
            const db = firebase.database();
            const userAdminRef = db.ref(`users/${user.uid}/isAdmin`);
            await userAdminRef.set(true);
            console.log('✅ Admin status written to database');
          }
        } catch (dbError) {
          console.warn('⚠️ Could not write admin status to database:', dbError);
        }
        
        this.broadcastAdminStatus();
      } else {
        console.warn('⚠️ User authenticated but NOT an admin:', user.email);
        console.warn('   Claims object:', idTokenResult.claims);
        this.isAdmin = false;
        // Show login form to allow re-login or logout
        this.showLoginForm();
      }
      
      // Resolve the admin check promise
      if (this.adminCheckResolver) {
        console.log(`✔️ Resolving adminCheckPromise with: ${this.isAdmin}`);
        this.adminCheckResolver(this.isAdmin);
        this.adminCheckResolver = null;
      }
    } catch (error) {
      console.error('❌ Error checking admin status:', error.message);
      this.isAdmin = false;
      // Show login form on error
      this.showLoginForm();
      
      // Resolve the promise with false
      if (this.adminCheckResolver) {
        console.log(`✔️ Resolving adminCheckPromise with false (error)`);
        this.adminCheckResolver(false);
        this.adminCheckResolver = null;
      }
    }
  }

  /**
   * Broadcast admin status to listeners
   */
  broadcastAdminStatus() {
    // Close login modal if it exists
    this.closeLoginForm();
    
    window.dispatchEvent(new CustomEvent('adminAuthStatusChanged', {
      detail: { isAdmin: this.isAdmin, user: this.user?.email }
    }));
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      console.log('✅ Login successful:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await firebase.auth().signOut();
      console.log('✅ Logged out');
      this.isAdmin = false;
      window.location.href = '../index.html';
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  /**
   * Redirect to login if not admin
   */
  redirectToLogin() {
    // Show login form but don't redirect away
    this.showLoginForm();
  }

  /**
   * Show login form modal
   */
  showLoginForm() {
    // Check if login form already exists
    if (document.getElementById('adminLoginModal')) {
      return; // Already showing
    }

    const modal = document.createElement('div');
    modal.id = 'adminLoginModal';
    modal.className = 'admin-login-modal';
    modal.innerHTML = `
      <div class="admin-login-container">
        <div class="admin-login-box">
          <h2>دخول المسؤول</h2>
          <p>يرجى إدخال بيانات الدخول الخاصة بك</p>
          
          <form id="adminLoginForm" class="admin-login-form">
            <div class="form-group">
              <label for="adminEmail">البريد الإلكتروني:</label>
              <input 
                type="email" 
                id="adminEmail" 
                required 
                placeholder="admin@example.com"
              />
            </div>
            
            <div class="form-group">
              <label for="adminPassword">كلمة المرور:</label>
              <input 
                type="password" 
                id="adminPassword" 
                required 
                placeholder="••••••••"
              />
            </div>
            
            <div id="loginError" class="login-error" style="display: none;"></div>
            
            <button type="submit" class="btn-login">دخول</button>
          </form>
        </div>
      </div>
      
      <style>
        .admin-login-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          direction: rtl;
        }
        
        .admin-login-container {
          width: 100%;
          max-width: 400px;
          padding: 20px;
        }
        
        .admin-login-box {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        
        .admin-login-box h2 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 24px;
        }
        
        .admin-login-box p {
          margin: 0 0 30px 0;
          color: #666;
          font-size: 14px;
        }
        
        .admin-login-form {
          text-align: right;
        }
        
        .form-group {
          margin-bottom: 20px;
          text-align: right;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
          font-size: 14px;
        }
        
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #0a7bdc;
          box-shadow: 0 0 5px rgba(10, 123, 220, 0.3);
        }
        
        .login-error {
          background: #fee;
          color: #c33;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        
        .btn-login {
          width: 100%;
          padding: 12px;
          background: #0a7bdc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .btn-login:hover {
          background: #0560aa;
        }
        
        .btn-login:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      </style>
    `;

    document.body.appendChild(modal);

    const form = document.getElementById('adminLoginForm');
    form.addEventListener('submit', (e) => this.handleLoginSubmit(e));
  }

  /**
   * Handle login form submission
   */
  async handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Clear previous error
    errorEl.style.display = 'none';
    submitBtn.disabled = true;

    const result = await this.login(email, password);

    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
    }
    // If successful, page will reload due to auth state change
  }

  /**
   * Get user-friendly error messages
   */
  getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'المستخدم غير موجود',
      'auth/wrong-password': 'كلمة المرور غير صحيحة',
      'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
      'auth/user-disabled': 'الحساب معطل',
      'auth/too-many-requests': 'حاول لاحقا، عدد محاولات كثير',
      'auth/network-request-failed': 'خطأ في الاتصال',
      'auth/operation-not-allowed': 'العملية غير مسموحة'
    };
    return messages[code] || 'خطأ في الدخول';
  }

  /**
   * Close login form modal
   */
  closeLoginForm() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Ensure admin access - call this at the beginning of admin pages
   * Waits properly for authentication check to complete
   */
  async ensureAdminAccess(timeout = 15000) {
    console.log('🔐 ensureAdminAccess() called');
    console.log(`   Current state: isAdmin=${this.isAdmin}, user=${this.user?.email || 'none'}`);
    
    // If already verified as admin - resolve immediately
    if (this.isAdmin === true) {
      console.log('✅ Already verified as admin - returning true immediately');
      return true;
    }
    
    // If already verified as NOT admin - resolve immediately
    if (this.isAdmin === false) {
      console.log('❌ Already verified as NOT admin - returning false immediately');
      return false;
    }
    
    // Still checking (isAdmin === null) - wait for it
    console.log('⏳ Admin status still being checked (isAdmin=null) - waiting...');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const maxWaitTime = timeout;
      let lastLogTime = 0;
      
      const check = () => {
        const elapsed = Date.now() - startTime;
        
        // Log progress every 500ms to avoid spam
        if (elapsed - lastLogTime > 500) {
          console.log(`   ⏳ Still waiting: ${elapsed}ms | isAdmin=${this.isAdmin}`);
          lastLogTime = elapsed;
        }
        
        // User verified as admin
        if (this.isAdmin === true) {
          console.log(`✅ Admin verified after ${elapsed}ms!`);
          resolve(true);
          return;
        }
        
        // User verified as NOT admin
        if (this.isAdmin === false) {
          console.log(`❌ User NOT admin after ${elapsed}ms`);
          resolve(false);
          return;
        }
        
        // Timeout reached with no result
        if (elapsed > maxWaitTime) {
          console.warn(`⚠️ Admin check timeout after ${maxWaitTime}ms - isAdmin is still ${this.isAdmin}`);
          resolve(false);
          return;
        }
        
        // Keep checking
        setTimeout(check, 100);
      };
      
      check();
    });
  }

  /**
   * Get current admin user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get current admin status
   */
  isCurrentUserAdmin() {
    return this.isAdmin;
  }
}

// Initialize on script load
const adminAuth = new AdminAuth();

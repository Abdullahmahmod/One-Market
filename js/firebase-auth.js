/**
 * Firebase Authentication Service
 * ===============================
 * نظام المصادقة والتحقق من الهويات
 * 
 * يوفر:
 * - تسجيل حساب جديد
 * - تسجيل دخول
 * - تسجيل خروج
 * - إدارة الجلسات
 */

const FirebaseAuth = (() => {
  'use strict';

  const CONFIG = {
    sessionKey: 'firebaseUserSession',
    sessionDurationMs: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  /**
   * User Management
   * إدارة المستخدمين
   */
  const User = {
    /**
     * Register new user (Email/Password)
     * تسجيل مستخدم جديد
     */
    async register(email, password, displayName) {
      if (!window.firebaseAuth) {
        console.error('❌ Firebase Auth not initialized');
        return { success: false, error: 'Firebase not initialized' };
      }

      try {
        // Create user with email and password
        const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = result.user;

        // Set display name
        if (displayName) {
          await user.updateProfile({ displayName });
        }

        console.log('✅ User registered:', user.uid);
        return { success: true, user: { uid: user.uid, email, displayName } };
      } catch (error) {
        console.error('❌ Registration error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Login with email and password
     * تسجيل الدخول
     */
    async login(email, password) {
      if (!window.firebaseAuth) {
        console.error('❌ Firebase Auth not initialized');
        return { success: false, error: 'Firebase not initialized' };
      }

      try {
        const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = result.user;

        // Save session
        User.saveSession(user);

        console.log('✅ User logged in:', user.uid);
        return { success: true, user: { uid: user.uid, email: user.email, displayName: user.displayName } };
      } catch (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Login with phone number (Anonymous)
     * تسجيل دخول بدون كلمة مرور
     */
    async loginAnonymous() {
      if (!window.firebaseAuth) {
        console.error('❌ Firebase Auth not initialized');
        return { success: false, error: 'Firebase not initialized' };
      }

      try {
        const result = await window.firebaseAuth.signInAnonymously();
        const user = result.user;

        // Save session
        User.saveSession(user);

        console.log('✅ Anonymous user logged in:', user.uid);
        return { success: true, user: { uid: user.uid, isAnonymous: true } };
      } catch (error) {
        console.error('❌ Anonymous login error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Logout
     * تسجيل الخروج
     */
    async logout() {
      if (!window.firebaseAuth) {
        console.error('❌ Firebase Auth not initialized');
        return { success: false, error: 'Firebase not initialized' };
      }

      try {
        await window.firebaseAuth.signOut();
        localStorage.removeItem(CONFIG.sessionKey);
        console.log('✅ User logged out');
        return { success: true };
      } catch (error) {
        console.error('❌ Logout error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get current user
     * الحصول على المستخدم الحالي
     */
    getCurrentUser() {
      if (!window.firebaseAuth) return null;
      return window.firebaseAuth.currentUser;
    },

    /**
     * Check if user is logged in
     * التحقق من تسجيل الدخول
     */
    isLoggedIn() {
      return User.getCurrentUser() !== null;
    },

    /**
     * Save session to local storage
     * حفظ الجلسة
     */
    saveSession(user) {
      if (!user) return;

      const sessionData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous,
        expiresAt: Date.now() + CONFIG.sessionDurationMs
      };

      localStorage.setItem(CONFIG.sessionKey, JSON.stringify(sessionData));
    },

    /**
     * Get session
     * استرجاع الجلسة
     */
    getSession() {
      const sessionStr = localStorage.getItem(CONFIG.sessionKey);
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);
      
      // Check if session expired
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(CONFIG.sessionKey);
        return null;
      }

      return session;
    },

    /**
     * Reset password
     * إعادة تعيين كلمة المرور
     */
    async resetPassword(email) {
      if (!window.firebaseAuth) {
        console.error('❌ Firebase Auth not initialized');
        return { success: false, error: 'Firebase not initialized' };
      }

      try {
        await window.firebaseAuth.sendPasswordResetEmail(email);
        console.log('✅ Password reset email sent');
        return { success: true };
      } catch (error) {
        console.error('❌ Reset password error:', error);
        return { success: false, error: error.message };
      }
    }
  };

  /**
   * Session Management
   * إدارة الجلسات
   */
  const Session = {
    /**
     * Check session validity
     * التحقق من صحة الجلسة
     */
    isValid() {
      const session = User.getSession();
      if (!session) return false;

      const isLoggedIn = User.isLoggedIn();
      return isLoggedIn && session.expiresAt > Date.now();
    },

    /**
     * Auto-login from stored session
     * تسجيل دخول تلقائي من الجلسة المحفوظة
     */
    async restoreSession() {
      const session = User.getSession();
      if (!session) return { success: false };

      // If already logged in, session is valid
      if (User.isLoggedIn()) {
        console.log('✅ Session restored');
        return { success: true, user: session };
      }

      return { success: false };
    },

    /**
     * Refresh session
     * تحديث الجلسة
     */
    refreshSession() {
      const user = User.getCurrentUser();
      if (user) {
        User.saveSession(user);
        console.log('✅ Session refreshed');
        return true;
      }
      return false;
    },

    /**
     * Destroy session
     * حذف الجلسة
     */
    destroy() {
      localStorage.removeItem(CONFIG.sessionKey);
      console.log('✅ Session destroyed');
    }
  };

  /**
   * State Observer
   * مراقب الحالة
   */
  const Observer = {
    listeners: [],

    /**
     * Subscribe to auth state changes
     * الاستماع لتغييرات حالة المصادقة
     */
    onAuthStateChanged(callback) {
      if (!window.firebaseAuth) return;

      return window.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          User.saveSession(user);
          callback({ loggedIn: true, user });
        } else {
          Session.destroy();
          callback({ loggedIn: false, user: null });
        }
      });
    }
  };

  // Public API
  return {
    User,
    Session,
    Observer,

    /**
     * Initialize auth service
     * تهيئة خدمة المصادقة
     */
    init() {
      if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded');
        return false;
      }

      // Restore session if exists
      Session.restoreSession();

      console.log('✅ Firebase Auth Service initialized');
      return true;
    }
  };
})();

// Expose to global scope
window.FirebaseAuth = FirebaseAuth;

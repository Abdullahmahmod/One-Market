const FirebaseBridge = {
  enabled: false,
  service: null,
  ready: false,
  error: null,

  isEnabled() {
    return Boolean(this.enabled && this.service);
  }
};

function detectFirebaseConfiguration() {
  try {
    if (typeof window.isFirebaseConfigured === 'function') {
      return window.isFirebaseConfigured();
    }

    const config = window.FIREBASE_CONFIG || {};
    const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
    return requiredFields.every((field) => {
      const value = String(config[field] || '').trim();
      return value && !value.includes('YOUR_');
    });
  } catch (_) {
    return false;
  }
}

function publishBridgeEvent() {
  if (FirebaseBridge.enabled) {
    document.dispatchEvent(new CustomEvent('firebase:ready', { detail: FirebaseBridge }));
  } else {
    document.dispatchEvent(new CustomEvent('firebase:error', {
      detail: { error: FirebaseBridge.error || new Error('Firebase is unavailable') }
    }));
  }
}

function syncFirebaseBridge() {
  try {
    const service = window.FirebaseService || null;
    const configured = detectFirebaseConfiguration();

    FirebaseBridge.enabled = Boolean(configured && service);
    FirebaseBridge.service = FirebaseBridge.enabled ? service : null;
    FirebaseBridge.error = FirebaseBridge.enabled ? null : (configured ? new Error('Firebase service is unavailable') : null);
    FirebaseBridge.ready = true;
    window.FirebaseBridge = FirebaseBridge;
    publishBridgeEvent();
  } catch (error) {
    FirebaseBridge.enabled = false;
    FirebaseBridge.service = null;
    FirebaseBridge.error = error;
    FirebaseBridge.ready = true;
    window.FirebaseBridge = FirebaseBridge;
    document.dispatchEvent(new CustomEvent('firebase:error', { detail: { error } }));
    console.error('Firebase bridge sync failed:', error);
  }
}

window.FirebaseBridge = FirebaseBridge;
syncFirebaseBridge();
document.addEventListener('DOMContentLoaded', syncFirebaseBridge);

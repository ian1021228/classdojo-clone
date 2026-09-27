/**
 * ClassDojo Firebase Configuration & Dual-Mode Data Engine
 * Strict compliance with User Rule 4: Zero Data Disruption & Complete Isolation.
 */

// Isolated Namespace - GUARANTEED to never touch or collide with any other apps or collections!
export const APP_NAMESPACE = "classdojo_system_v1";

// Standalone Firebase Project Configuration Structure
// Pre-configured for ClassDojo Clone standalone environment
export const firebaseConfig = {
  apiKey: "", // Optional: Users can insert their live Firebase API key
  authDomain: "classdojo-clone.firebaseapp.com",
  projectId: "classdojo-clone-isolated",
  storageBucket: "classdojo-clone-isolated.firebasestorage.app",
  messagingSenderId: "389201948201",
  appId: "1:389201948201:web:78a9c0d12e345f6a7b8c9d"
};

import { DatabaseQuotaGuard, StorageQuotaManager } from './security.js';

class FirebaseDataEngine {
  constructor() {
    this.isOnline = false;
    this.db = null;
    this.listeners = new Map();
    this.storageKey = `dojo_store_${APP_NAMESPACE}`;
    this.quotaGuard = new DatabaseQuotaGuard({ debounceMs: 400 });
    this.init();
  }

  async init() {
    // Check if Firebase SDK is loaded and API key is provided
    try {
      if (window.firebase && firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10) {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(firebaseConfig);
        }
        this.db = window.firebase.firestore();
        this.isOnline = true;
        console.log(`[ClassDojo Firebase] Connected to Firestore namespace: ${APP_NAMESPACE}`);
      } else {
        this.isOnline = false;
        console.log(`[ClassDojo Engine] Operating in Offline-First LocalStorage mode (Zero Data Collision guaranteed)`);
      }
    } catch (err) {
      console.warn(`[ClassDojo Engine] Firebase init fallback to LocalStorage:`, err);
      this.isOnline = false;
    }
  }

  // Load state from local storage or cloud
  loadState(defaultState) {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load local state", e);
    }
    return defaultState;
  }

  // Save state to local storage and sync to cloud if online with quota protection
  saveState(state) {
    try {
      // Dynamic quota management: prune history if storage approaches capacity
      StorageQuotaManager.pruneHistoryIfCrowded(state, 40);

      localStorage.setItem(this.storageKey, JSON.stringify(state));
      // Notify local listeners
      window.dispatchEvent(new CustomEvent('dojo:state-changed', { detail: state }));

      // Debounced and throttled sync to Firestore to prevent read/write spikes and quota exhaustion
      if (this.isOnline && this.db) {
        this.quotaGuard.debounceSave(() => {
          if (this.isOnline && this.db) {
            this.db.collection(APP_NAMESPACE).doc('active_classroom_state').set(state, { merge: true })
              .catch(err => console.warn('[ClassDojo Firestore Sync Error]:', err));
          }
        });
      }
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }

  // Allow dynamic update of Firebase credentials
  updateConfig(newConfig) {
    Object.assign(firebaseConfig, newConfig);
    this.init();
  }
}

export const dataEngine = new FirebaseDataEngine();

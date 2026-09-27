/**
 * Security & Database Quota Guardian Module
 * 
 * Provides:
 * 1. Web Crypto API-based Salted Password Hashing & Sensitive Masking
 * 2. Database Write Debouncing, Throttling & Spike Protection (Coalescing writes)
 * 3. LocalStorage & Cloud Quota Usage Monitoring & Adaptive Auto-Pruning
 * 4. Universal XSS HTML Sanitization
 */

// 1. Universal HTML Sanitization (Anti-XSS)
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 2. Web Crypto API Salted Password Hashing
export async function hashPassword(password, salt = 'crew_salt_2026') {
  if (!password) return '';
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback simple hash for non-secure / mock environments
    let hash = 0;
    const combined = `${salt}:${password}`;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash |= 0;
    }
    return `mock_${Math.abs(hash).toString(16)}`;
  }

  const enc = new TextEncoder();
  const keyMaterial = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, storedHash, salt = 'crew_salt_2026') {
  const computed = await hashPassword(password, salt);
  return computed === storedHash;
}

// 3. Sensitive Data Masking (Parent codes, credentials)
export function maskSensitiveCode(code) {
  if (!code || typeof code !== 'string') return '';
  if (code.length <= 4) return '****';
  return `${code.slice(0, 2)}****${code.slice(-2)}`;
}

// 4. Database Spike Protection & Write Throttler (Debounced buffer)
export class DatabaseQuotaGuard {
  constructor(options = {}) {
    this.debounceMs = options.debounceMs || 250;
    this.maxSpikeRate = options.maxSpikeRate || 25; // max calls per 5-sec window before warning
    this.spikeWindowMs = options.spikeWindowMs || 5000;
    this.recentWrites = [];
    this.pendingTimer = null;
    this.lastSavedTimestamp = 0;
  }

  recordWriteAttempt() {
    const now = Date.now();
    this.recentWrites = this.recentWrites.filter(t => now - t < this.spikeWindowMs);
    this.recentWrites.push(now);

    if (this.recentWrites.length > this.maxSpikeRate) {
      console.warn(`[Security Quota Guard] High-frequency DB write spike detected (${this.recentWrites.length} ops/${this.spikeWindowMs}ms). Coalescing writes.`);
      return true; // isSpiking
    }
    return false;
  }

  debounceSave(saveFn) {
    this.recordWriteAttempt();
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
    }
    return new Promise((resolve) => {
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        this.lastSavedTimestamp = Date.now();
        const res = saveFn();
        resolve(res);
      }, this.debounceMs);
    });
  }
}

// 5. Storage Quota Monitor & Allocation Manager
export const StorageQuotaManager = {
  getUsage() {
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2; // UTF-16 approx
      }
    } catch (e) {
      console.error('[StorageQuota] Error reading usage:', e);
    }

    const maxEstimate = 5 * 1024 * 1024; // 5MB standard browser limit
    const percentage = Math.min(100, Math.round((totalBytes / maxEstimate) * 100));
    return {
      usedBytes: totalBytes,
      usedKB: (totalBytes / 1024).toFixed(1),
      maxKB: (maxEstimate / 1024).toFixed(0),
      percentage,
      isWarning: percentage > 75,
      isCritical: percentage > 90
    };
  },

  // Compress SVG/Drawing strings by stripping whitespace and redundant decimals
  compressSvgData(svgString) {
    if (!svgString || typeof svgString !== 'string') return svgString;
    return svgString
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .trim();
  },

  // Safe auto-pruning to protect against QuotaExceededError without deleting active students or classes
  pruneHistoryIfCrowded(state, maxHistoryPerStudent = 30) {
    if (!state || !state.classes) return false;
    let pruned = false;

    state.classes.forEach(cls => {
      if (!cls.students) return;
      cls.students.forEach(student => {
        if (student.history && student.history.length > maxHistoryPerStudent) {
          student.history = student.history.slice(0, maxHistoryPerStudent);
          pruned = true;
        }
      });
    });

    if (pruned) {
      console.info('[Security Quota Guard] Auto-pruned old point history to preserve database headroom.');
    }
    return pruned;
  }
};

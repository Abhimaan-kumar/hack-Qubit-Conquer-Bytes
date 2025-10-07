/**
 * Storage Service for TaxEase Extension
 * Handles persistent storage of overlay state, position, and chat messages
 */

const STORAGE_KEYS = {
  OVERLAY_POSITION: 'taxease_overlay_position',
  OVERLAY_SIZE: 'taxease_overlay_size',
  IS_OPEN: 'taxease_is_open',
  IS_MINIMIZED: 'taxease_is_minimized',
  MESSAGES: 'taxease_messages',
  DARK_MODE: 'taxease_dark_mode',
  CHAT_SESSION_ID: 'taxease_session_id',
};

class StorageService {
  constructor() {
    this.isExtension = typeof chrome !== 'undefined' && chrome.storage;
  }

  /**
   * Save data to storage (chrome.storage.local or localStorage)
   */
  async save(key, value) {
    try {
      if (this.isExtension) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Get data from storage
   */
  async get(key, defaultValue = null) {
    try {
      if (this.isExtension) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result[key] !== undefined ? result[key] : defaultValue);
            }
          });
        });
      } else {
        const item = localStorage.getItem(key);
        return Promise.resolve(item ? JSON.parse(item) : defaultValue);
      }
    } catch (error) {
      console.error('Error getting from storage:', error);
      return Promise.resolve(defaultValue);
    }
  }

  /**
   * Remove data from storage
   */
  async remove(key) {
    try {
      if (this.isExtension) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.remove([key], () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      } else {
        localStorage.removeItem(key);
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Clear all TaxEase data from storage
   */
  async clearAll() {
    try {
      const promises = Object.values(STORAGE_KEYS).map(key => this.remove(key));
      await Promise.all(promises);
      return Promise.resolve();
    } catch (error) {
      console.error('Error clearing storage:', error);
      return Promise.reject(error);
    }
  }

  // Convenience methods for specific data
  async saveOverlayPosition(position) {
    return this.save(STORAGE_KEYS.OVERLAY_POSITION, position);
  }

  async getOverlayPosition(defaultPosition) {
    return this.get(STORAGE_KEYS.OVERLAY_POSITION, defaultPosition);
  }

  async saveOverlaySize(size) {
    return this.save(STORAGE_KEYS.OVERLAY_SIZE, size);
  }

  async getOverlaySize(defaultSize) {
    return this.get(STORAGE_KEYS.OVERLAY_SIZE, defaultSize);
  }

  async saveIsOpen(isOpen) {
    return this.save(STORAGE_KEYS.IS_OPEN, isOpen);
  }

  async getIsOpen(defaultValue = false) {
    return this.get(STORAGE_KEYS.IS_OPEN, defaultValue);
  }

  async saveIsMinimized(isMinimized) {
    return this.save(STORAGE_KEYS.IS_MINIMIZED, isMinimized);
  }

  async getIsMinimized(defaultValue = false) {
    return this.get(STORAGE_KEYS.IS_MINIMIZED, defaultValue);
  }

  async saveMessages(messages) {
    return this.save(STORAGE_KEYS.MESSAGES, messages);
  }

  async getMessages(defaultMessages = []) {
    return this.get(STORAGE_KEYS.MESSAGES, defaultMessages);
  }

  async saveDarkMode(darkMode) {
    return this.save(STORAGE_KEYS.DARK_MODE, darkMode);
  }

  async getDarkMode(defaultValue = false) {
    return this.get(STORAGE_KEYS.DARK_MODE, defaultValue);
  }

  async saveSessionId(sessionId) {
    return this.save(STORAGE_KEYS.CHAT_SESSION_ID, sessionId);
  }

  async getSessionId() {
    return this.get(STORAGE_KEYS.CHAT_SESSION_ID, null);
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;

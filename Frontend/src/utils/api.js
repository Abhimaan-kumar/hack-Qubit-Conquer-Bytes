// API Configuration and utilities
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api' 
  : `${window.location.protocol}//${window.location.hostname}:5001/api`;

// API client with error handling
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication APIs
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Tax Calculation APIs
  async createTaxCalculation(calculationData) {
    return this.request('/tax-calculations', {
      method: 'POST',
      body: JSON.stringify(calculationData),
    });
  }

  async getTaxCalculations() {
    return this.request('/tax-calculations');
  }

  async compareTaxRegimes(comparisonData) {
    return this.request('/tax-calculations/compare', {
      method: 'POST',
      body: JSON.stringify(comparisonData),
    });
  }

  async getTaxStats() {
    return this.request('/tax-calculations/stats/summary');
  }

  // Document APIs
  async uploadDocument(formData) {
    const url = `${this.baseURL}/documents/upload`;
    const headers = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async processDocument(documentId) {
    return this.request(`/documents/${documentId}/process`, {
      method: 'POST',
    });
  }

  async getDocuments() {
    return this.request('/documents');
  }

  async downloadDocument(documentId) {
    const url = `${this.baseURL}/documents/${documentId}/download`;
    const headers = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return fetch(url, { headers });
  }

  // AI Assistant APIs
  async sendAIQuery(queryData) {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify(queryData),
    });
  }

  async getAIHistory() {
    return this.request('/ai/history');
  }

  async submitAIFeedback(queryId, feedback) {
    return this.request(`/ai/query/${queryId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getAIMetrics() {
    return this.request('/ai/metrics');
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export for use in components
export default apiClient;

// Export individual methods for convenience
export const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  createTaxCalculation,
  getTaxCalculations,
  compareTaxRegimes,
  getTaxStats,
  uploadDocument,
  processDocument,
  getDocuments,
  downloadDocument,
  sendAIQuery,
  getAIHistory,
  submitAIFeedback,
  getAIMetrics,
  checkHealth,
  setAuthToken,
} = apiClient;
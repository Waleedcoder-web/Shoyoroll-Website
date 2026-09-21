/**
 * Blueneedle API Client
 * Configurable helper for communicating with the Express backend
 */
const API_BASE_URL =
  window.API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (window.location.port === '5000' ? '/api' : 'http://localhost:5000/api')
    : '/api');

const api = {
  /**
   * Health check for API and Database connectivity
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await res.json();
    } catch (error) {
      console.error('API health check error:', error);
      return { status: 'error', message: error.message };
    }
  },

  /**
   * Products endpoints
   */
  products: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/products${query ? `?${query}` : ''}`);
      return await res.json();
    },

    async getById(id) {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      return await res.json();
    },

    async create(productData) {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      return await res.json();
    },
  },

  /**
   * Inquiries / Quote requests
   */
  inquiries: {
    async submit(inquiryData) {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData),
      });
      return await res.json();
    },

    async getAll() {
      const res = await fetch(`${API_BASE_URL}/inquiries`);
      return await res.json();
    },
  },
};

window.blueneedleApi = api;

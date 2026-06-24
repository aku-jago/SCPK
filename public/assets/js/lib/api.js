/**
 * API Client
 * Fetch wrapper with JWT token injection and error handling
 */
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('scpk-token');
  },

  setToken(token) {
    localStorage.setItem('scpk-token', token);
  },

  removeToken() {
    localStorage.removeItem('scpk-token');
    localStorage.removeItem('scpk-user');
  },

  getUser() {
    const user = localStorage.getItem('scpk-user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    localStorage.setItem('scpk-user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          if (!window.location.pathname.includes('login')) {
            window.location.href = '/login.html';
          }
        }
        throw { status: response.status, ...data };
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw { success: false, message: 'Koneksi gagal. Periksa jaringan Anda.' };
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

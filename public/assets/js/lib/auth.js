/**
 * Auth Guard & State Management
 * Client-side authentication state and route protection
 */
const Auth = {
  isAuthenticated() {
    return !!API.getToken();
  },

  getUser() {
    return API.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  },

  /**
   * Redirect based on auth status and role
   * Call this at the top of protected pages
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    if (!this.isAdmin()) {
      window.location.href = '/dashboard/';
      return false;
    }
    return true;
  },

  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      const user = this.getUser();
      if (user && user.role === 'ADMIN') {
        window.location.href = '/admin/';
      } else {
        window.location.href = '/dashboard/';
      }
      return true;
    }
    return false;
  },

  async login(email, password) {
    const data = await API.post('/auth/login', { email, password });
    API.setToken(data.data.token);
    API.setUser(data.data.user);
    return data.data;
  },

  async register(formData) {
    const data = await API.post('/auth/register', formData);
    API.setToken(data.data.token);
    API.setUser(data.data.user);
    return data.data;
  },

  logout() {
    API.removeToken();
    window.location.href = '/login.html';
  },

  /**
   * Update navbar based on auth state
   */
  updateNavbar() {
    const loginBtn = document.getElementById('btn-login');
    const registerBtn = document.getElementById('btn-register');

    if (this.isAuthenticated()) {
      const user = this.getUser();
      if (loginBtn) {
        loginBtn.textContent = 'Dashboard';
        loginBtn.href = user?.role === 'ADMIN' ? '/admin/' : '/dashboard/';
        loginBtn.className = 'btn btn-primary';
      }
      if (registerBtn) {
        registerBtn.style.display = 'none';
      }
    }
  },
};

// Auto-update navbar on landing page
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbar();
});

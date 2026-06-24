/**
 * Route Guard
 * Client-side route protection for dashboard and admin pages
 */
const Router = {
  /**
   * Initialize route guard based on current page path
   */
  init() {
    const path = window.location.pathname;

    // Dashboard pages require auth
    if (path.startsWith('/dashboard')) {
      if (!Auth.requireAuth()) return false;
    }

    // Admin pages require admin role
    if (path.startsWith('/admin')) {
      if (!Auth.requireAdmin()) return false;
    }

    // Populate sidebar user info if present
    this.populateSidebarUser();

    return true;
  },

  /**
   * Populate sidebar user info from stored user data
   */
  populateSidebarUser() {
    const user = Auth.getUser();
    if (!user) return;

    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');

    if (nameEl) nameEl.textContent = user.name || 'User';
    if (roleEl) roleEl.textContent = user.role === 'ADMIN' ? 'Administrator' : 'Pengguna';
    if (avatarEl) {
      const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      avatarEl.textContent = initials;
    }
  },

  /**
   * Set active sidebar link based on current path
   */
  setActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === path) {
        link.classList.add('active');
      }
    });
  },

  /**
   * Setup mobile sidebar toggle
   */
  initMobileSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay?.classList.toggle('active');
      });

      overlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },

  /**
   * Setup logout button
   */
  initLogout() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
      });
    }
  },
};

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (Router.init()) {
    Router.setActiveLink();
    Router.initMobileSidebar();
    Router.initLogout();
  }
});

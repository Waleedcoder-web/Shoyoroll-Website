/**
 * BLUENEEDLE Admin Authentication & Route Guard
 * Enforces JWT session validation on all admin pages.
 */

(function () {
  const TOKEN_KEY = 'blueneedle_admin_token';
  const USER_KEY = 'blueneedle_admin_user';

  const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/login');
  const isAdminArea = window.location.pathname.includes('/admin');

  // Helper: Retrieve stored token
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Helper: Retrieve stored user
  function getUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  // Helper: Sign out
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace('/admin/login.html');
  }

  // Expose global auth helpers
  window.blueneedleAuth = {
    getToken,
    getUser,
    logout,
  };

  // Immediate Route Guard:
  if (isAdminArea) {
    const token = getToken();

    if (isLoginPage) {
      // On login page: if already has valid token, redirect to overview
      if (token) {
        fetch('/api/auth/verify', {
          headers: { Authorization: 'Bearer ' + token },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              window.location.replace('/admin/index.html');
            } else {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
            }
          })
          .catch(() => {});
      }
    } else {
      // On protected admin pages: MUST have token, or redirect immediately
      if (!token) {
        window.location.replace('/admin/login.html');
        return;
      }

      // Verify token with backend in background
      fetch('/api/auth/verify', {
        headers: { Authorization: 'Bearer ' + token },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.success) {
            console.warn('Session expired or invalid. Redirecting to login.');
            logout();
          }
        })
        .catch((err) => {
          console.warn('Unable to verify token with server:', err);
        });
    }
  }

  // DOM Loaded: Setup logout handlers & inject user profile into sidebar
  document.addEventListener('DOMContentLoaded', () => {
    if (isLoginPage) return;

    const user = getUser();
    const username = user ? user.username : 'Waleed';

    // Update any elements with [data-admin-username]
    document.querySelectorAll('[data-admin-username]').forEach((el) => {
      el.textContent = username;
    });

    // Attach click listeners to ALL logout buttons on the page
    document.querySelectorAll('[data-action-logout], [data-logout], .logout-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });

    // Inject logout card into desktop sidebar if not already present
    const desktopSidebar = document.querySelector('aside.bg-navy-deep');
    if (desktopSidebar && !desktopSidebar.querySelector('#admin-user-card')) {
      const userCard = document.createElement('div');
      userCard.id = 'admin-user-card';
      userCard.className = 'mt-auto border-t border-white/10 pt-4 flex flex-col gap-2';
      userCard.innerHTML = `
        <div class="flex items-center justify-between px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="h-7 w-7 rounded-full bg-electric text-electric-foreground flex items-center justify-center font-bold text-xs">
              ${username.charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-white truncate">${username}</p>
              <p class="text-[10px] text-white/50 uppercase tracking-wider">Admin</p>
            </div>
          </div>
          <button
            type="button"
            data-action-logout
            title="Log Out"
            class="inline-flex items-center gap-1 rounded bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white px-2 py-1 text-xs font-medium transition-colors"
          >
            <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Logout
          </button>
        </div>
      `;
      desktopSidebar.appendChild(userCard);

      userCard.querySelector('[data-action-logout]').addEventListener('click', logout);
    }

    // Inject logout into mobile drawer if not present
    const mobileDrawer = document.querySelector('[data-admin-mobile-nav]');
    if (mobileDrawer && !mobileDrawer.querySelector('#mobile-logout-btn')) {
      const mobileLogoutBtn = document.createElement('button');
      mobileLogoutBtn.id = 'mobile-logout-btn';
      mobileLogoutBtn.type = 'button';
      mobileLogoutBtn.className =
        'mt-3 flex w-full items-center justify-between rounded-md bg-red-500/20 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500 hover:text-white transition-colors';
      mobileLogoutBtn.innerHTML = `
        <span class="flex items-center gap-2">
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Sign Out (${username})
        </span>
        <span class="text-xs">&rarr;</span>
      `;
      mobileLogoutBtn.addEventListener('click', logout);
      mobileDrawer.querySelector('nav')?.appendChild(mobileLogoutBtn);
    }
  });
})();

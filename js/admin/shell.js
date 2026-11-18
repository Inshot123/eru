'use strict';
/* =====================================================================
   ADMIN SHELL  - startup, login/logout, sidebar tabs, clock, auto-refresh
   This file loads LAST on admin.html.
   ===================================================================== */
const Admin = {
  /* Reload data from the database and redraw every tab */
  async refresh() {
    try {
      await ERU.load();
    } catch (e) {
      if (e.status === 401) { Admin.checkSession(); return; }   // session expired
    }
    Requests.render();
    Responders.render();
    Reports.renderMonth();
    Reports.renderYear();
  },

  /* Show the login screen or the dashboard */
  async checkSession() {
    const loggedIn = await AUTH.ok();
    $('#loginView').classList.toggle('hide', loggedIn);
    $('#app').classList.toggle('hide', !loggedIn);
    if (loggedIn) await Admin.refresh();
  },

  initLogin() {
    $('#lf').onsubmit = async (e) => {
      e.preventDefault();
      const error = await AUTH.login($('#u').value.trim(), $('#p').value);
      $('#p').value = '';
      if (error) $('#lerr').innerHTML = `<div class="msg err">${E(error)}</div>`;
      else Admin.checkSession();
    };
    $('#out').onclick = async () => { await AUTH.logout(); Admin.checkSession(); };
  },

  initSidebar() {
    initTabs((btn) => {
      $('#pageTitle').textContent = btn.dataset.title;
      Admin.refresh();
    });
  },

  initClock() {
    const tick = () => $('#clock').textContent =
      new Date().toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'short' });
    tick();
    setInterval(tick, 30000);
  },

  // New reports appear by themselves (paused while the assign panel is open)
  initAutoRefresh() {
    setInterval(() => {
      if (!$('#app').classList.contains('hide') && !$('#asg').innerHTML) Admin.refresh();
    }, 20000);
  },

  // Print buttons (inline onclick is blocked by the security policy, so we listen here)
  initPrint() {
    document.addEventListener('click', (e) => { if (e.target.closest('[data-print]')) window.print(); });
  },

  start() {
    this.initLogin();
    this.initSidebar();
    this.initClock();
    this.initPrint();
    this.initAutoRefresh();
    this.checkSession();
  },
};

Admin.start();

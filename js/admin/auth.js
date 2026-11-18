'use strict';
/* =====================================================================
   ADMIN LOGIN  - handled by the server (PHP session + hashed password)
   To change the admin password, see README.md
   ===================================================================== */
const AUTH = {
  async ok() {                                  // is the admin logged in?
    try { return (await ERU.api('admin', { a: 'me' })).ok === true; } catch { return false; }
  },
  async login(user, pass) {                     // returns null on success, or an error message
    try { await ERU.api('admin', { a: 'login', u: user, p: pass }); return null; }
    catch (e) { return e.message; }
  },
  async logout() {
    try { await ERU.api('admin', { a: 'logout' }); } catch {}
  },
};

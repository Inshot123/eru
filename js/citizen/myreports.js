'use strict';
/* =====================================================================
   CITIZEN PAGE - "MY REPORTS" TAB
   Reference numbers are remembered on this device only
   ===================================================================== */
const MyReports = {
  KEY: 'eru_refs',

  saved() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; }
  },

  remember(ref) {                                  // keep the last 20 references
    const refs = this.saved();
    refs.push(ref);
    localStorage.setItem(this.KEY, JSON.stringify(refs.slice(-20)));
  },

  async render() {
    const refs = this.saved();
    let items = [];
    if (refs.length) {
      try { items = (await ERU.api('report', { a: 'track', refs })).items; } catch {}
    }
    $('#mineBody').innerHTML = items.length
      ? `<table>
          <tr><th>Ref</th><th>Type</th><th>Date</th><th>Status</th></tr>
          ${items.map((i) => `<tr>
            <td>${E(i.ref)}</td><td>${E(TYPES[i.type])}</td>
            <td>${ERU.fmtDate(i.ts)} ${ERU.fmtTime(i.ts)}</td>
            <td><span class="pill ${E(i.status)}">${E(i.status)}</span></td>
          </tr>`).join('')}
        </table>`
      : '<p class="mut">No reports from this device yet.</p>';
  },
};

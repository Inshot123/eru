'use strict';
/* =====================================================================
   ADMIN > MONTHLY REPORT and YEARLY SCALE TABS (both printable)
   All numbers are counted from the incidents saved in the database.
   ===================================================================== */
const Reports = {
  monthValue: null,   // selected month "YYYY-MM"  (null = current month)
  yearValue:  null,   // selected year             (null = current year)

  /* ---------- Monthly report ---------- */
  renderMonth() {
    const value  = this.monthValue || new Date().toISOString().slice(0, 7);
    const [y, m] = value.split('-').map(Number);
    const label  = new Date(y, m - 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

    const list = ERU.incidents()
      .filter((i) => { const d = new Date(i.ts); return d.getFullYear() === y && d.getMonth() + 1 === m; })
      .sort((a, b) => a.ts - b.ts);
    const counts = Ui.countByType(list);

    $('#month').innerHTML = `<div class="sec printing">
      ${Ui.printHeader('Monthly Incident Report — ' + label)}
      <div class="card">
        ${Ui.toolbar(`<label>Month</label><input type="month" id="mv" value="${value}">`)}
        <h2 style="margin-top:18px">Monthly Report — ${label}</h2>
        ${Ui.stats([[list.length, 'Total incidents']])}
        <h3>Cases by type</h3>
        ${Ui.typeBars(counts, Math.max(...counts.map((c) => c.n), 0))}
        <h3 style="margin-top:18px">Incident log</h3>
        <div class="tbl">${list.length ? this.logTable(list) : '<p class="mut">No incidents this month.</p>'}</div>
      </div>
    </div>`;

    $('#mv').onchange = (e) => { if (e.target.value) { this.monthValue = e.target.value; this.renderMonth(); } };
  },

  logTable(list) {
    return `<table>
      <tr><th>#</th><th>Date</th><th>Time</th><th>Type</th><th>Location</th><th>Status</th></tr>
      ${list.map((i, n) => `<tr>
        <td>${n + 1}</td><td>${ERU.fmtDate(i.ts)}</td><td>${ERU.fmtTime(i.ts)}</td>
        <td>${E(TYPES[i.type])}</td><td>${Ui.location(i)}</td><td>${E(i.status)}</td>
      </tr>`).join('')}
    </table>`;
  },

  /* ---------- Yearly scale (highest / lowest) ---------- */
  renderYear() {
    const y    = +(this.yearValue || new Date().getFullYear());
    const list = ERU.incidents().filter((i) => new Date(i.ts).getFullYear() === y);

    const counts  = Ui.countByType(list);
    const ranked  = counts.filter((c) => c.n > 0).sort((a, b) => b.n - a.n);   // only types that happened
    const highest = ranked[0];
    const lowest  = ranked.at(-1);

    const months = Array.from({ length: 12 }, (_, k) => ({
      k, n: list.filter((i) => new Date(i.ts).getMonth() === k).length,
    }));
    const maxMonth = Math.max(...months.map((x) => x.n), 0);

    $('#year').innerHTML = `<div class="sec printing">
      ${Ui.printHeader('Yearly Incident Scale — ' + y)}
      <div class="card">
        ${Ui.toolbar(`<label>Year</label><input type="number" id="yv" min="2000" max="2100" value="${y}">`)}
        <h2 style="margin-top:18px">Yearly Scale — ${y}</h2>
        ${Ui.stats([
          [list.length, 'Total reports'],
          [highest ? E(TYPES[highest.key]) : '—', `Highest (${highest?.n || 0})`],
          [lowest  ? E(TYPES[lowest.key])  : '—', `Lowest (${lowest?.n || 0})`],
        ])}
        <h3>Incidents by type</h3>
        ${Ui.typeBars(counts, highest?.n || 0)}
        <h3 style="margin-top:18px">By month</h3>
        ${months.map((x) => Ui.bar(
          new Date(y, x.k).toLocaleDateString('en', { month: 'long' }), x.n, maxMonth)).join('')}
      </div>
    </div>`;

    $('#yv').onchange = (e) => { if (e.target.value) { this.yearValue = e.target.value; this.renderYear(); } };
  },
};

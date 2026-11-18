'use strict';
/* =====================================================================
   ADMIN UI HELPERS  - small HTML pieces reused by several tabs
   ===================================================================== */
const Ui = {
  // "Address / landmark, lat, lng, city" cell used in tables
  location(i) {
    return `${E(i.addr || 'Pinned location')}<br>
            <small>${i.lat.toFixed(4)}, ${i.lng.toFixed(4)} · ${E(i.city)}</small>`;
  },

  // Row of stat cards.  list = [[value, 'Label'], ...]   (value must already be safe text)
  stats(list) {
    return `<div class="stats">${list.map(([value, label]) =>
      `<div class="stat"><b>${value}</b>${label}</div>`).join('')}</div>`;
  },

  // One horizontal progress bar row
  bar(label, count, max) {
    const width = max ? (count / max) * 100 : 0;
    return `<div class="brow">
              <span>${label}</span>
              <div class="bar"><i style="width:${width}%"></i></div>
              <b>${count}</b>
            </div>`;
  },

  // [{key, n}] - number of incidents for every incident type
  countByType(list) {
    return Object.keys(TYPES).map((key) => ({ key, n: list.filter((i) => i.type === key).length }));
  },

  // Bars for incidents-by-type
  typeBars(counts, max) {
    return counts.map((c) => this.bar(E(TYPES[c.key]), c.n, max)).join('');
  },

  // Heading that only appears on the printed page
  printHeader(subtitle) {
    return `<div class="print-head"><img src="img/logo.png" alt="" style="height:80px"><h2>Emergency Response Unit</h2><p>${subtitle}</p></div>`;
  },

  // Month/Year picker + Print button
  toolbar(pickerHtml) {
    return `<div class="row noprint"><div>${pickerHtml}</div>
            <button class="btn" data-print>🖨️ Print</button></div>`;
  },
};

'use strict';
/* =====================================================================
   ADMIN > REQUESTS TAB
   Lists every report, lets the admin assign units and resolve incidents
   ===================================================================== */
const Requests = {
  /* ---------- Draw the tab ---------- */
  render() {
    const list  = ERU.incidents().slice().sort((a, b) => b.ts - a.ts);
    const count = (status) => list.filter((i) => i.status === status).length;

    $('#reqs').innerHTML = `
      ${Ui.stats([
        [list.length, 'Total'],
        [count('pending'), 'Pending'],
        [count('assigned'), 'Assigned'],
        [count('resolved'), 'Resolved'],
      ])}
      <div class="card tbl">
        <h2>Incident Requests</h2>
        ${list.length ? this.table(list) : '<p class="mut">No requests yet.</p>'}
      </div>
      <div id="asg"></div>`;

    $$('[data-a]').forEach((b) => b.onclick = () => this.openAssignPanel(b.dataset.a));
    $$('[data-r]').forEach((b) => b.onclick = () => this.resolve(b.dataset.r));
  },

  table(list) {
    return `<table>
      <tr><th>Ref / Time</th><th>Reporter</th><th>Type</th><th>Location</th><th>Status</th><th>Action</th></tr>
      ${list.map((i) => this.row(i)).join('')}
    </table>`;
  },

  row(i) {
    const units = i.assigned.map((a) => `<span class="chip">${E(a.label)}</span>`).join('');
    return `<tr>
      <td>${E(i.ref)}<br><small>${ERU.fmtDate(i.ts)} ${ERU.fmtTime(i.ts)}</small></td>
      <td>${E(i.name)}<br><small>${E(i.phone)}</small></td>
      <td>${E(TYPES[i.type])}<br><small>${E(i.desc)}</small></td>
      <td>${Ui.location(i)}</td>
      <td><span class="pill ${E(i.status)}">${E(i.status)}</span><br>${units}</td>
      <td>${this.actions(i)}</td>
    </tr>`;
  },

  actions(i) {
    if (i.status === 'resolved') return '—';
    const resolveBtn = i.status === 'assigned'
      ? ` <button class="btn ok sm" data-r="${E(i.id)}">Resolve</button>` : '';
    return `<button class="btn sm" data-a="${E(i.id)}">Assign</button>${resolveBtn}`;
  },

  /* ---------- Assign panel: only suitable + available units, nearest first ---------- */
  openAssignPanel(id) {
    const incident = ERU.incidents().find((x) => x.id === id);
    const needed   = REQUIRED[incident.type];

    const options = ERU.stations()
      .map((station) => ({ station, km: ERU.dist(incident.lat, incident.lng, station.lat, station.lng) }))
      .sort((a, b) => a.km - b.km)
      .flatMap(({ station, km }) => station.units
        .filter((u) => u.status === 'available' && needed.includes(u.type))
        .map((unit) => ({ station, unit, km })));

    const rows = options.map((o, n) => `<tr>
        <td>${E(o.station.name)}</td><td>${E(o.unit.name)}</td><td>${o.km.toFixed(1)} km</td>
        <td><button class="btn sm" data-u="${n}">Dispatch</button></td></tr>`).join('');

    $('#asg').innerHTML = `
      <div class="card" style="margin-top:18px">
        <h2>Assign responders · ${E(incident.ref)} (${E(TYPES[incident.type])})</h2>
        <p class="mut">Filtered to required units: ${needed.map((t) => E(UNIT_LABEL[t])).join(', ')} — sorted by distance.</p>
        <div class="tbl"><table>
          <tr><th>Station</th><th>Unit</th><th>Distance</th><th></th></tr>
          ${rows || '<tr><td colspan="4">No available units.</td></tr>'}
        </table></div>
      </div>`;

    $$('[data-u]').forEach((b) => b.onclick = async () => {
      const unit = options[+b.dataset.u].unit;
      await this.send({ a: 'assign', incident: id, unit: unit.id });
    });
    $('#asg').scrollIntoView({ behavior: 'smooth' });
  },

  resolve(id) { return this.send({ a: 'resolve', incident: id }); },

  // Send an action to the server, then reload everything
  async send(body) {
    try { await ERU.api('admin', body); } catch (e) { alert(e.message); }
    Admin.refresh();
  },
};

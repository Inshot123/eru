'use strict';
/* =====================================================================
   ADMIN > RESPONDERS TAB
   Station cards with availability ring and unit tiles
   ===================================================================== */
const Responders = {
  ICONS: { fire: '🔥', police: '👮', medical: '🚑', drrmo: '🛟' },

  render() {
    const stations  = ERU.stations();
    const units     = stations.flatMap((s) => s.units);
    const available = units.filter((u) => u.status === 'available').length;

    // unit id -> the incident it is currently handling
    const incidentOfUnit = {};
    ERU.incidents().forEach((i) => {
      if (i.status === 'assigned') i.assigned.forEach((a) => incidentOfUnit[a.unitId] = i);
    });

    $('#resp').innerHTML = `
      ${Ui.stats([
        [stations.length, 'Stations'],
        [units.length, 'Total units'],
        [available, 'Available now'],
        [units.length - available, 'Dispatched'],
      ])}
      <div class="units">
        ${stations.map((s) => this.stationCard(s, incidentOfUnit)).join('')}
      </div>`;
  },

  stationCard(station, incidentOfUnit) {
    const free  = station.units.filter((u) => u.status === 'available').length;
    const pct   = station.units.length ? Math.round(free / station.units.length * 100) : 0;
    const color = pct > 60 ? 'var(--ok)' : pct > 25 ? 'var(--warn)' : 'var(--acc)';   // ring color
    const groups = Object.keys(UNIT_LABEL)
      .map((type) => this.unitGroup(type, station.units.filter((u) => u.type === type), incidentOfUnit))
      .join('');

    return `<div class="card st">
      <div class="sth">
        <div class="ring" style="--p:${pct};--c:${color}"><b>${pct}%</b></div>
        <div>
          <h3>${E(station.name)}</h3>
          <small>📍 ${E(station.city)} · ${free}/${station.units.length} available</small>
        </div>
      </div>
      ${groups}
    </div>`;
  },

  unitGroup(type, units, incidentOfUnit) {
    if (!units.length) return '';
    return `<div class="ugrp">
      <div class="ut">${this.ICONS[type]} ${E(UNIT_LABEL[type])}</div>
      <div class="ulist">${units.map((u) => this.unitTile(u, incidentOfUnit)).join('')}</div>
    </div>`;
  },

  unitTile(unit, incidentOfUnit) {
    const incident = incidentOfUnit[unit.id];
    const status   = unit.status === 'available'
      ? 'Ready'
      : 'On duty' + (incident ? ' · ' + E(incident.ref) : '');
    return `<div class="unit ${E(unit.status)}">
      <span class="ud"></span>
      <div><b>${E(unit.name.replace(/^.*Unit/, 'Unit'))}</b><small>${status}</small></div>
    </div>`;
  },
};

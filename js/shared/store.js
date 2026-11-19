'use strict';
/* =====================================================================
   SHARED HELPERS  (Online Supabase + Offline Outbox + Centered Modal)
   ===================================================================== */
const SUPABASE_URL = 'https://xyufphigdtpupksijwww.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dWZwaGlnZHRwdXBrc2lqd3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwMjgwOTYsImV4cCI6MjExMDYwNDA5Nn0.cvMlGQTf6g2lNcczd2mAVTmmbpz-ihAD5wNycmLkomo';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $  = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function httpErr(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

/* Fallback stations so nearest-station detection works even when offline */
const DEFAULT_STATIONS = [
  { id: 'mnd', city: 'Mandaue City', name: 'Mandaue Central Response Station', lat: 10.323600, lng: 123.922300 },
  { id: 'lil', city: 'Liloan', name: 'Liloan Response Station', lat: 10.399200, lng: 123.998300 },
  { id: 'con', city: 'Consolacion', name: 'Consolacion Response Station', lat: 10.376700, lng: 123.956400 },
];

const OUTBOX_KEY = 'eru_offline_outbox';
const ADMIN_CACHE_KEY = 'eru_admin_cache';

const ERU = {
  cache: { inc: [], st: [] },

  nearestCity(lat, lng, stations = DEFAULT_STATIONS) {
    let best = 'Unknown';
    let bd = 1e9;
    (stations || DEFAULT_STATIONS).forEach((st) => {
      const km = this.dist(lat, lng, Number(st.lat), Number(st.lng));
      if (km < bd) { bd = km; best = st.city; }
    });
    return best;
  },

  genRef() {
    const bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return 'ERU-' + hex;
  },

  getOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; }
  },

  saveOutbox(list) {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
  },

  /* Sync queued offline reports automatically when internet returns */
  async syncOutbox() {
    if (!navigator.onLine) return;
    const queue = this.getOutbox();
    if (!queue.length) return;

    const remaining = [];
    for (const item of queue) {
      try {
        const { error } = await sb.from('incidents').insert([item.row]);
        if (error) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    this.saveOutbox(remaining);
    if (remaining.length < queue.length && typeof MyReports !== 'undefined') {
      MyReports.render();
    }
  },

  /* ---------- Backend (Supabase + Offline Fallback) ---------- */
  async api(file, body = {}) {
    const a = body.a || '';

    /* ================= PUBLIC / CITIZEN ACTIONS ================= */
    if (file === 'report') {
      if (a === 'stations') {
        try {
          const { data, error } = await sb.from('stations').select('name,city,lat,lng');
          if (error) throw error;
          const items = (data || []).map((r) => ({
            name: r.name, city: r.city, lat: Number(r.lat), lng: Number(r.lng),
          }));
          localStorage.setItem('eru_stations_cache', JSON.stringify(items));
          return { items };
        } catch {
          try {
            const cached = JSON.parse(localStorage.getItem('eru_stations_cache') || 'null');
            return { items: cached || DEFAULT_STATIONS };
          } catch {
            return { items: DEFAULT_STATIONS };
          }
        }
      }

      if (a === 'submit') {
        const name  = this.clean(body.name, 60);
        const phone = String(body.phone || '');
        const type  = String(body.type || '');
        const lat   = Number(body.lat);
        const lng   = Number(body.lng);

        if (name.length < 2) throw httpErr('Please enter the reporter name.', 422);
        if (!/^\d{11}$/.test(phone)) throw httpErr('Mobile number must be exactly 11 digits.', 422);
        if (!TYPES[type]) throw httpErr('Invalid incident type.', 422);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          throw httpErr('Invalid location.', 422);
        }

        const ref = this.genRef();
        const best = this.nearestCity(lat, lng);
        const row = {
          ref,
          name,
          phone,
          type,
          description: this.clean(body.desc, 300),
          address: this.clean(body.addr, 120),
          lat,
          lng,
          accuracy: body.acc != null && Number.isFinite(Number(body.acc)) ? Number(body.acc) : null,
          city: best,
        };

        if (!navigator.onLine) {
          const q = this.getOutbox();
          q.push({ row, ts: Date.now() });
          this.saveOutbox(q);
          return { ok: true, ref, city: `${best} (Saved offline — will auto-send when back online)` };
        }

        try {
          const { error: insErr } = await sb.from('incidents').insert([row]);
          if (insErr) throw insErr;
          return { ok: true, ref, city: best };
        } catch {
          const q = this.getOutbox();
          q.push({ row, ts: Date.now() });
          this.saveOutbox(q);
          return { ok: true, ref, city: `${best} (Saved offline — will auto-send when back online)` };
        }
      }

      if (a === 'track') {
        const refs = (Array.isArray(body.refs) ? body.refs : [])
          .slice(0, 20)
          .filter((r) => typeof r === 'string' && /^ERU-[A-F0-9]{6}$/.test(r));
        if (!refs.length) return { items: [] };

        const offlineItems = this.getOutbox()
          .filter((q) => refs.includes(q.row.ref))
          .map((q) => ({
            ref: q.row.ref,
            type: q.row.type,
            status: 'pending',
            ts: q.ts,
          }));

        try {
          const { data, error } = await sb
            .from('incidents')
            .select('ref,type,status,created_at')
            .in('ref', refs)
            .order('created_at', { ascending: false });
          if (error) throw error;

          const onlineItems = (data || []).map((r) => ({
            ref: r.ref,
            type: r.type,
            status: r.status,
            ts: new Date(r.created_at).getTime(),
          }));
          const seen = new Set(onlineItems.map((x) => x.ref));
          const merged = [...offlineItems.filter((x) => !seen.has(x.ref)), ...onlineItems];
          localStorage.setItem('eru_myreports_cache', JSON.stringify(merged));
          return { items: merged };
        } catch {
          try {
            const cached = JSON.parse(localStorage.getItem('eru_myreports_cache') || '[]');
            const seen = new Set(cached.map((x) => x.ref));
            return { items: [...offlineItems.filter((x) => !seen.has(x.ref)), ...cached] };
          } catch {
            return { items: offlineItems };
          }
        }
      }
    }

    /* ================= ADMIN ACTIONS ================= */
    if (file === 'admin') {
      if (a === 'login') {
        if (!navigator.onLine) throw httpErr('You are offline. Connect to the internet to sign in.', 503);
        const rawUser = String(body.u || '').trim();
        const email = rawUser.includes('@') ? rawUser : `${rawUser.toLowerCase()}@eru.local`;
        const { error } = await sb.auth.signInWithPassword({
          email,
          password: String(body.p || ''),
        });
        if (error) throw httpErr(error.message, 401);
        return { ok: true };
      }

      if (a === 'me') {
        const { data } = await sb.auth.getSession();
        return { ok: Boolean(data?.session) };
      }

      if (a === 'logout') {
        await sb.auth.signOut();
        return { ok: true };
      }

      const { data: sessData } = await sb.auth.getSession();
      if (!sessData?.session) throw httpErr('Session expired. Please log in.', 401);

      if (a === 'data') {
        if (!navigator.onLine) {
          const cached = localStorage.getItem(ADMIN_CACHE_KEY);
          if (cached) return JSON.parse(cached);
        }

        const [stRes, unRes, incRes, asgRes] = await Promise.all([
          sb.from('stations').select('id,city,name,lat,lng').order('id'),
          sb.from('units').select('id,station_id,type,name,status').order('id'),
          sb.from('incidents').select('*').order('created_at'),
          sb.from('assignments').select('incident_id,unit_id'),
        ]);
        if (stRes.error || unRes.error || incRes.error || asgRes.error) {
          const cached = localStorage.getItem(ADMIN_CACHE_KEY);
          if (cached) return JSON.parse(cached);
          throw httpErr('Failed to load dashboard data.', 500);
        }

        const stMap = {};
        stRes.data.forEach((r) => {
          stMap[r.id] = {
            id: r.id, city: r.city, name: r.name, lat: Number(r.lat), lng: Number(r.lng), units: [],
          };
        });

        const unitLookup = {};
        unRes.data.forEach((u) => {
          unitLookup[u.id] = u;
          if (stMap[u.station_id]) {
            stMap[u.station_id].units.push({ id: u.id, type: u.type, name: u.name, status: u.status });
          }
        });

        const incMap = {};
        incRes.data.forEach((r) => {
          incMap[r.id] = {
            id: String(r.id),
            ref: r.ref,
            name: r.name,
            phone: r.phone,
            type: r.type,
            desc: r.description,
            addr: r.address,
            lat: Number(r.lat),
            lng: Number(r.lng),
            city: r.city,
            status: r.status,
            ts: new Date(r.created_at).getTime(),
            assigned: [],
          };
        });

        asgRes.data.forEach((asg) => {
          const inc = incMap[asg.incident_id];
          const u = unitLookup[asg.unit_id];
          const st = u ? stMap[u.station_id] : null;
          if (inc && u && st) {
            inc.assigned.push({ unitId: u.id, stId: st.id, label: `${st.city}: ${u.name}` });
          }
        });

        const payload = { inc: Object.values(incMap), st: Object.values(stMap) };
        localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(payload));
        return payload;
      }

      if (a === 'assign') {
        if (!navigator.onLine) throw httpErr('Cannot dispatch units while offline.', 503);
        const incId = Number(body.incident || 0);
        const unitId = String(body.unit || '');

        const { data: inc } = await sb.from('incidents').select('type,status').eq('id', incId).single();
        if (!inc) throw httpErr('Incident not found', 404);
        if (inc.status === 'resolved') throw httpErr('Incident already resolved', 409);

        const { data: unit } = await sb.from('units').select('type,status').eq('id', unitId).single();
        if (!unit || unit.status !== 'available' || !(REQUIRED[inc.type] || []).includes(unit.type)) {
          throw httpErr('Unit is not available or not suitable for this incident.', 422);
        }

        const { error: uErr } = await sb.from('units').update({ status: 'dispatched' }).eq('id', unitId);
        if (uErr) throw httpErr(uErr.message, 500);

        const { error: aErr } = await sb.from('assignments').insert([{ incident_id: incId, unit_id: unitId }]);
        if (aErr) throw httpErr(aErr.message, 500);

        const { error: iErr } = await sb.from('incidents').update({ status: 'assigned' }).eq('id', incId);
        if (iErr) throw httpErr(iErr.message, 500);

        return { ok: true };
      }

      if (a === 'resolve') {
        if (!navigator.onLine) throw httpErr('Cannot resolve incidents while offline.', 503);
        const incId = Number(body.incident || 0);
        const { data: inc } = await sb.from('incidents').select('status').eq('id', incId).single();
        if (!inc) throw httpErr('Incident not found', 404);
        if (inc.status !== 'assigned') throw httpErr('Only assigned incidents can be resolved.', 409);

        const { data: asgs } = await sb.from('assignments').select('unit_id').eq('incident_id', incId);
        const unitIds = (asgs || []).map((x) => x.unit_id);

        if (unitIds.length) {
          const { error: uErr } = await sb.from('units').update({ status: 'available' }).in('id', unitIds);
          if (uErr) throw httpErr(uErr.message, 500);
        }

        const { error: iErr } = await sb.from('incidents').update({ status: 'resolved' }).eq('id', incId);
        if (iErr) throw httpErr(iErr.message, 500);

        return { ok: true };
      }
    }

    throw httpErr('Unknown action', 400);
  },

  async load()     { this.cache = await this.api('admin', { a: 'data' }); },
  incidents()      { return this.cache.inc; },
  stations()       { return this.cache.st; },

  esc(s) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s ?? '').replace(/[&<>"']/g, (c) => map[c]);
  },
  clean(s, max) {
    return String(s || '').replace(/[<>]/g, '').trim().slice(0, max);
  },

  dist(lat1, lng1, lat2, lng2) {
    const rad = (x) => x * Math.PI / 180;
    const h = Math.sin(rad(lat2 - lat1) / 2) ** 2
            + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  },

  fmtDate(t) { return new Date(t).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' }); },
  fmtTime(t) { return new Date(t).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }); },
};

const E = ERU.esc;

function initTabs(onSelect) {
  const ids = [...$$('.tab')].map((t) => t.dataset.t);
  $$('.tab').forEach((btn) => btn.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('on', t === btn));
    [...$$('.sec')].filter((s) => ids.includes(s.id))
      .forEach((s) => s.classList.toggle('hide', s.id !== btn.dataset.t));
    onSelect(btn);
  }));
}

/* Register Service Worker + Live Online/Offline Status Sync */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  $$('.sos .badge').forEach((b) => {
    if (b.textContent.includes('Dispatch')) {
      b.innerHTML = online
        ? '<i class="dot"></i> Dispatch online'
        : '<i class="dot" style="background:#f59e0b"></i> Offline mode (auto-sync)';
    }
  });
  if (online) ERU.syncOutbox();
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
window.addEventListener('DOMContentLoaded', updateNetworkStatus);

/* ===== CENTERED CUSTOM ALERT MODAL ===== */
ERU.alert = function (message, title = 'Dispatch Notice', icon = '⚠️') {
  return new Promise((resolve) => {
    const existing = document.querySelector('.eru-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'eru-modal-backdrop';
    backdrop.innerHTML = `
      <div class="eru-modal" role="alertdialog" aria-modal="true">
        <div class="eru-modal-icon">${icon}</div>
        <h3>${E(title)}</h3>
        <p>${E(message)}</p>
        <button type="button" class="btn red" id="eruModalOk">OK</button>
      </div>
    `;

    const close = () => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      resolve();
    };

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') close();
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(backdrop);

    const okBtn = backdrop.querySelector('#eruModalOk');
    okBtn.onclick = close;
    okBtn.focus();
  });
};

window.alert = (msg) => { ERU.alert(msg); };

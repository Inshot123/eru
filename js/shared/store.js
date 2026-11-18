'use strict';
/* =====================================================================
   SHARED HELPERS  (used by both the citizen page and the admin page)
     $ / $$        short DOM selectors
     ERU.api()     talks to Supabase (replaces api/*.php)
     ERU.esc()     escapes text before putting it in HTML (security)
     initTabs()    tab switching (citizen top tabs / admin sidebar)
   ===================================================================== */
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UVAjz127wAxrtQ0v0dzxdg_e-n6apkf';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $  = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function httpErr(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

const ERU = {
  cache: { inc: [], st: [] },   // admin data loaded from the database

  /* ---------- Backend (Supabase Adapter) ---------- */
  async api(file, body = {}) {
    const a = body.a || '';

    /* ================= PUBLIC / CITIZEN ACTIONS ================= */
    if (file === 'report') {
      if (a === 'stations') {
        const { data, error } = await sb.from('stations').select('name,city,lat,lng');
        if (error) throw httpErr(error.message, 500);
        return {
          items: (data || []).map((r) => ({
            name: r.name,
            city: r.city,
            lat: Number(r.lat),
            lng: Number(r.lng),
          })),
        };
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

        // Find nearest station
        const { data: stations, error: stErr } = await sb.from('stations').select('city,lat,lng');
        if (stErr) throw httpErr(stErr.message, 500);

        let best = 'Unknown';
        let bd = 1e9;
        (stations || []).forEach((st) => {
          const km = this.dist(lat, lng, Number(st.lat), Number(st.lng));
          if (km < bd) { bd = km; best = st.city; }
        });

        // Generate ERU-XXXXXX reference
        const bytes = new Uint8Array(3);
        crypto.getRandomValues(bytes);
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        const ref = 'ERU-' + hex;

        const { error: insErr } = await sb.from('incidents').insert([{
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
        }]);
        if (insErr) throw httpErr(insErr.message, 500);

        return { ok: true, ref, city: best };
      }

      if (a === 'track') {
        const refs = (Array.isArray(body.refs) ? body.refs : [])
          .slice(0, 20)
          .filter((r) => typeof r === 'string' && /^ERU-[A-F0-9]{6}$/.test(r));
        if (!refs.length) return { items: [] };

        const { data, error } = await sb
          .from('incidents')
          .select('ref,type,status,created_at')
          .in('ref', refs)
          .order('created_at', { ascending: false });
        if (error) throw httpErr(error.message, 500);

        return {
          items: (data || []).map((r) => ({
            ref: r.ref,
            type: r.type,
            status: r.status,
            ts: new Date(r.created_at).getTime(),
          })),
        };
      }
    }

    /* ================= ADMIN ACTIONS ================= */
    if (file === 'admin') {
      if (a === 'login') {
        const rawUser = String(body.u || '').trim();
        const email = rawUser.includes('@') ? rawUser : `${rawUser.toLowerCase()}@eru.local`;
        const { error } = await sb.auth.signInWithPassword({
          email,
          password: String(body.p || ''),
        });
        if (error) throw httpErr('Invalid username or password.', 401);
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

      // Require active admin session for data, assign, and resolve
      const { data: sessData } = await sb.auth.getSession();
      if (!sessData?.session) throw httpErr('Session expired. Please log in.', 401);

      if (a === 'data') {
        const [stRes, unRes, incRes, asgRes] = await Promise.all([
          sb.from('stations').select('id,city,name,lat,lng').order('id'),
          sb.from('units').select('id,station_id,type,name,status').order('id'),
          sb.from('incidents').select('*').order('created_at'),
          sb.from('assignments').select('incident_id,unit_id'),
        ]);
        if (stRes.error || unRes.error || incRes.error || asgRes.error) {
          throw httpErr('Failed to load dashboard data.', 500);
        }

        const stMap = {};
        stRes.data.forEach((r) => {
          stMap[r.id] = {
            id: r.id,
            city: r.city,
            name: r.name,
            lat: Number(r.lat),
            lng: Number(r.lng),
            units: [],
          };
        });

        const unitLookup = {};
        unRes.data.forEach((u) => {
          unitLookup[u.id] = u;
          if (stMap[u.station_id]) {
            stMap[u.station_id].units.push({
              id: u.id,
              type: u.type,
              name: u.name,
              status: u.status,
            });
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
            inc.assigned.push({
              unitId: u.id,
              stId: st.id,
              label: `${st.city}: ${u.name}`,
            });
          }
        });

        return { inc: Object.values(incMap), st: Object.values(stMap) };
      }

      if (a === 'assign') {
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

  /* ---------- Text safety ---------- */
  esc(s) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s ?? '').replace(/[&<>"']/g, (c) => map[c]);
  },
  clean(s, max) {
    return String(s || '').replace(/[<>]/g, '').trim().slice(0, max);
  },

  /* ---------- Distance (km) between two GPS points ---------- */
  dist(lat1, lng1, lat2, lng2) {
    const rad = (x) => x * Math.PI / 180;
    const h = Math.sin(rad(lat2 - lat1) / 2) ** 2
            + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  },

  /* ---------- Date / time formatting ---------- */
  fmtDate(t) { return new Date(t).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' }); },
  fmtTime(t) { return new Date(t).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }); },
};

const E = ERU.esc;   // shortcut used in templates:  ${E(value)}

/* Tabs: buttons with class "tab" + data-t="<section id>" show/hide sections with class "sec" */
function initTabs(onSelect) {
  const ids = [...$$('.tab')].map((t) => t.dataset.t);
  $$('.tab').forEach((btn) => btn.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('on', t === btn));
    [...$$('.sec')].filter((s) => ids.includes(s.id))
      .forEach((s) => s.classList.toggle('hide', s.id !== btn.dataset.t));
    onSelect(btn);
  }));
}
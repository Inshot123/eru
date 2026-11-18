'use strict';
/* =====================================================================
   CITIZEN PAGE - MAP & LOCATION
   Live GPS tracking, draggable pin, street/satellite layers, reverse geocoding
   ===================================================================== */
const MapView = (() => {
  const CEBU_BOUNDS = [[10.30, 123.88], [10.43, 124.04]];   // Mandaue - Liloan - Consolacion
  let map = null, marker = null, accuracyCircle = null;
  let watchId = null;
  let position = null;                                       // {lat, lng, acc} chosen by the citizen
  let detectedStreet = '';
  let manualAddr = false;
  let geoTimer = null;

  /* ---------- Reverse-geocode exact street via OpenStreetMap Nominatim ---------- */
  async function fetchStreet(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) return '';
      const data = await res.json();
      const a = data.address || {};

      const place = a.amenity || a.building || a.shop || a.office || a.leisure || '';
      const street = [
        a.house_number,
        a.road || a.pedestrian || a.footway || a.street || a.residential || a.path || a.highway,
      ].filter(Boolean).join(' ');

      const area = a.suburb || a.neighbourhood || a.quarter || a.village || a.barangay || a.hamlet;
      const city = a.city || a.town || a.municipality || a.county;
      const exact = [place, street, area, city].filter(Boolean).join(', ')
        || (data.display_name ? data.display_name.split(',').slice(0, 4).join(',').trim() : '');

      detectedStreet = exact;
      if (exact) {
        updateCoordsLabel(lat, lng, position?.acc, exact);
        const addrInput = $('#addr');
        if (addrInput && (!manualAddr || !addrInput.value.trim())) {
          addrInput.value = exact.slice(0, 120);
        }
      }
      return exact;
    } catch {
      return '';
    }
  }

  function queueStreetLookup(lat, lng) {
    clearTimeout(geoTimer);
    geoTimer = setTimeout(() => fetchStreet(lat, lng), 350);
  }

  function updateCoordsLabel(lat, lng, accuracy, streetText = detectedStreet) {
    const base = `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}` +
      (accuracy ? ` · GPS accuracy ±${Math.round(accuracy)} m` : ' · pinned manually');
    $('#coords').textContent = streetText ? `${base} — ${streetText}` : `${base} · locating street...`;
  }

  /* ---------- Set / move the reporter's pin ---------- */
  function setPosition(lat, lng, accuracy = null, recenter = true) {
    const moved = !position || Math.abs(position.lat - lat) > 0.00005 || Math.abs(position.lng - lng) > 0.00005;
    position = { lat, lng, acc: accuracy };
    if (moved) detectedStreet = '';
    updateCoordsLabel(lat, lng, accuracy);

    if (moved) queueStreetLookup(lat, lng);

    if (!map) return;

    if (!marker) {
      const icon = L.divIcon({ html: '📍', className: 'pin', iconSize: [34, 34], iconAnchor: [17, 32] });
      marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      marker.on('dragend', () => {                           // citizen drags the pin to fine-tune
        stopTracking();
        manualAddr = false;
        const p = marker.getLatLng();
        setPosition(p.lat, p.lng, null, false);
      });
    } else {
      marker.setLatLng([lat, lng]);
    }

    if (accuracyCircle) accuracyCircle.remove();
    accuracyCircle = accuracy
      ? L.circle([lat, lng], { radius: accuracy, color: '#3b82f6', weight: 1, fillOpacity: 0.14 }).addTo(map)
      : null;

    if (recenter || !map.getBounds().contains([lat, lng])) {
      map.setView([lat, lng], Math.max(map.getZoom(), 17));
    }
  }

  /* ---------- Live tracking (button "Use my live location") ---------- */
  function stopTracking() {
    if (watchId === null) return;
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    $('#loc').textContent = '📍 Use my live location';
  }

  function toggleTracking() {
    if (!navigator.geolocation) { showMessage('Geolocation is not supported by this browser.', 'err'); return; }
    if (watchId !== null) { stopTracking(); return; }

    manualAddr = false;
    let firstFix = true;
    $('#coords').textContent = 'Getting live GPS location...';
    $('#loc').textContent = '⏹ Stop live tracking';
    watchId = navigator.geolocation.watchPosition(
      (p) => { setPosition(p.coords.latitude, p.coords.longitude, p.coords.accuracy, firstFix); firstFix = false; },
      (err) => {
        stopTracking();
        showMessage(err.code === 1
          ? 'Location permission denied. Allow it in browser settings, or tap the map to pin the spot.'
          : 'Could not get your location. Tap the map to pin it.', 'err');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }

  /* ---------- One fresh GPS reading + exact street lookup (used by Quick Send) ---------- */
  function getFreshFix(onDone) {
    if (!navigator.geolocation) { showMessage('Geolocation is not supported by this browser.', 'err'); return; }
    manualAddr = false;
    $('#coords').textContent = 'Getting live GPS & street location...';
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        setPosition(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
        clearTimeout(geoTimer);
        await fetchStreet(p.coords.latitude, p.coords.longitude);
        if (onDone) onDone();
      },
      (err) => showMessage(err.code === 1
        ? 'Location permission denied. Allow it in browser settings or tap the map.'
        : 'Could not get location. Tap the map to pin it.', 'err'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  /* ---------- Build the map ---------- */
  function init() {
    if (!window.L) { $('#map').textContent = 'Map could not load (check internet).'; return; }

    const addrInput = $('#addr');
    if (addrInput) {
      addrInput.addEventListener('input', () => {
        manualAddr = addrInput.value.trim().length > 0;
      });
    }

    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { subdomains: 'abc', maxZoom: 19, attribution: '© OpenStreetMap contributors' });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Tiles © Esri' });

    map = L.map('map', { layers: [street] });
    map.fitBounds(CEBU_BOUNDS);
    L.control.layers({ '🗺️ Street': street, '🛰️ Satellite': satellite }).addTo(map);

    // "Cebu view" button
    const cebuButton = L.control({ position: 'topleft' });
    cebuButton.onAdd = () => {
      const b = L.DomUtil.create('button', 'cebu leaflet-bar');
      b.type = 'button';
      b.textContent = '🧭 Cebu view';
      b.onclick = (e) => { L.DomEvent.stopPropagation(e); map.fitBounds(CEBU_BOUNDS); };
      return b;
    };
    cebuButton.addTo(map);

    // Response stations (blue dots) loaded from the database
    ERU.api('report', { a: 'stations' }).then((r) => r.items.forEach((s) =>
      L.circleMarker([s.lat, s.lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 })
        .addTo(map).bindTooltip('🚒 ' + s.name))).catch(() => {});

    // Tap the map = pin that exact spot
    map.on('click', (e) => {
      stopTracking();
      manualAddr = false;
      setPosition(e.latlng.lat, e.latlng.lng, null, false);
    });
  }

  function refresh() { if (map) setTimeout(() => map.invalidateSize(), 50); }   // after tab switch

  return {
    init,
    refresh,
    toggleTracking,
    getFreshFix,
    getPosition: () => position,
    getStreet: () => detectedStreet,
    resolveNow: () => (position ? fetchStreet(position.lat, position.lng) : Promise.resolve('')),
  };
})();
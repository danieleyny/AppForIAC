(() => {
  'use strict';

  // ---------- Storage keys ----------
  const KEYS = {
    drives: 'miletrack.drives',
    settings: 'miletrack.settings',
  };

  const DEFAULT_SETTINGS = {
    ratePerMile: 0.70, // 2025 IRS business mileage rate
    homeAddress: '',
    annualOdometer: {}, // { '2026': { start: 12345, end: 67890 } }
  };

  const PURPOSE_DEFAULT_NOTES_SHOWN = false;

  // ---------- State ----------
  let drives = load(KEYS.drives, []);
  let settings = { ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) };
  let pending = null; // { from, to, fromCoords, toCoords, miles, method }
  let selectedPurpose = null;

  // ---------- Utilities ----------
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatMoney(n) {
    return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatMiles(n) {
    return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function todayISO() {
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0, 10);
  }

  function parseDate(iso) {
    // Parse YYYY-MM-DD as local, not UTC
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function monthShort(date) {
    return date.toLocaleString('en-US', { month: 'short' });
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2500);
  }

  function haversineMiles(a, b) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 3958.8; // miles
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // ---------- Geocoding (Nominatim) ----------
  async function geocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': navigator.language || 'en' },
    });
    if (!res.ok) throw new Error('geocode_failed');
    const data = await res.json();
    if (!data || !data.length) throw new Error('no_match');
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  }

  async function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { 'Accept-Language': navigator.language || 'en' } });
    if (!res.ok) throw new Error('reverse_failed');
    const data = await res.json();
    return data.display_name || `${lat}, ${lon}`;
  }

  // ---------- Routing (OSRM) ----------
  async function routeMiles(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('route_failed');
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error('no_route');
    const meters = data.routes[0].distance;
    return meters / 1609.344;
  }

  async function calculateDistance(from, to) {
    const [fc, tc] = await Promise.all([geocode(from), geocode(to)]);
    let miles;
    let method = 'driving';
    try {
      miles = await routeMiles(fc, tc);
    } catch (e) {
      miles = haversineMiles(fc, tc);
      method = 'straight-line';
    }
    return { miles, method, fromCoords: fc, toCoords: tc };
  }

  // ---------- View routing ----------
  function goto(view) {
    document.querySelectorAll('.view').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.view !== view);
    });
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (view === 'home') renderHome();
    if (view === 'drives') renderAllDrives();
    if (view === 'export') renderExport();
    if (view === 'settings') renderSettings();
    if (view === 'log') resetLogForm();
  }

  // ---------- Renderers ----------
  function renderHome() {
    const year = new Date().getFullYear();
    const yearDrives = drives.filter((d) => d.date.startsWith(String(year)));
    const totalMiles = yearDrives.reduce((s, d) => s + d.miles, 0);

    document.getElementById('summary-year').textContent = year;
    document.getElementById('total-miles').textContent = formatMiles(totalMiles);
    document.getElementById('total-deduction').textContent = formatMoney(totalMiles * settings.ratePerMile);
    document.getElementById('total-drives').textContent = yearDrives.length;

    const list = document.getElementById('recent-list');
    const recent = [...drives].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5);
    renderDriveList(list, recent);
  }

  function renderAllDrives() {
    const select = document.getElementById('year-filter');
    const years = [...new Set(drives.map((d) => d.date.slice(0, 4)))].sort().reverse();
    const currentYear = String(new Date().getFullYear());
    if (!years.includes(currentYear)) years.unshift(currentYear);
    select.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
    const chosen = select.value || currentYear;
    select.value = chosen;

    const list = document.getElementById('all-list');
    const filtered = drives
      .filter((d) => d.date.startsWith(chosen))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    renderDriveList(list, filtered);
  }

  function renderDriveList(el, items) {
    if (!items.length) {
      el.innerHTML = '<li class="empty-state">No drives yet. Tap "Log a Drive" to start.</li>';
      return;
    }
    el.innerHTML = items
      .map((d) => {
        const date = parseDate(d.date);
        const day = date.getDate();
        const mon = monthShort(date);
        const route = `${shortAddr(d.from)} → ${shortAddr(d.to)}`;
        const purpose = d.purpose || '—';
        return `
          <li class="drive-item" data-id="${d.id}">
            <div class="drive-date"><div class="day">${day}</div><div class="mon">${mon}</div></div>
            <div class="drive-info">
              <div class="drive-route">${escapeHtml(route)}</div>
              <div class="drive-meta">${escapeHtml(purpose)}</div>
            </div>
            <div class="drive-miles">${formatMiles(d.miles)}<span class="unit">mi</span></div>
          </li>`;
      })
      .join('');
    el.querySelectorAll('.drive-item').forEach((node) => {
      node.addEventListener('click', () => openDetail(node.dataset.id));
    });
  }

  function shortAddr(addr) {
    if (!addr) return '';
    const parts = addr.split(',').map((s) => s.trim());
    return parts.slice(0, 2).join(', ');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function renderExport() {
    const sel = document.getElementById('export-year');
    const years = [...new Set(drives.map((d) => d.date.slice(0, 4)))].sort().reverse();
    const currentYear = String(new Date().getFullYear());
    if (!years.includes(currentYear)) years.unshift(currentYear);
    sel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
    const chosen = sel.value || currentYear;
    sel.value = chosen;

    updateExportSummary(chosen);
  }

  function updateExportSummary(year) {
    const yearDrives = drives.filter((d) => d.date.startsWith(year));
    const totalMiles = yearDrives.reduce((s, d) => s + d.miles, 0);
    const deduction = totalMiles * settings.ratePerMile;

    document.getElementById('export-drives').textContent = yearDrives.length;
    document.getElementById('export-miles').textContent = formatMiles(totalMiles);
    document.getElementById('export-rate').textContent = '$' + settings.ratePerMile.toFixed(3);
    document.getElementById('export-deduction').textContent = formatMoney(deduction);

    const odo = (settings.annualOdometer || {})[year] || {};
    document.getElementById('odo-year-start').textContent = odo.start != null ? odo.start.toLocaleString() : '—';
    document.getElementById('odo-year-end').textContent = odo.end != null ? odo.end.toLocaleString() : '—';
    if (odo.start != null && odo.end != null) {
      document.getElementById('odo-year-diff').textContent = (odo.end - odo.start).toLocaleString();
    } else {
      document.getElementById('odo-year-diff').textContent = '—';
    }
  }

  function renderSettings() {
    document.getElementById('setting-rate').value = settings.ratePerMile;
    document.getElementById('setting-home').value = settings.homeAddress || '';

    const sel = document.getElementById('setting-odo-year');
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) years.push(y);
    sel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
    sel.value = String(currentYear);
    loadOdoFields(String(currentYear));
    sel.onchange = () => loadOdoFields(sel.value);
  }

  function loadOdoFields(year) {
    const odo = (settings.annualOdometer || {})[year] || {};
    document.getElementById('setting-odo-start').value = odo.start != null ? odo.start : '';
    document.getElementById('setting-odo-end').value = odo.end != null ? odo.end : '';
  }

  // ---------- Log form ----------
  function resetLogForm() {
    document.getElementById('drive-date').value = todayISO();
    document.getElementById('drive-from').value = settings.homeAddress || '';
    document.getElementById('drive-to').value = '';
    document.getElementById('drive-notes').value = '';
    document.getElementById('odo-start').value = '';
    document.getElementById('odo-end').value = '';
    document.getElementById('purpose-other').value = '';
    document.getElementById('purpose-other').classList.add('hidden');
    document.getElementById('distance-card').classList.add('hidden');
    document.getElementById('purpose-section').classList.add('hidden');
    document.getElementById('notes-section').classList.add('hidden');
    document.getElementById('save-btn').classList.add('hidden');
    document.querySelectorAll('.purpose-tile').forEach((el) => el.classList.remove('selected'));
    selectedPurpose = null;
    pending = null;
  }

  async function onCalculate() {
    const fromEl = document.getElementById('drive-from');
    const toEl = document.getElementById('drive-to');
    const from = fromEl.value.trim();
    const to = toEl.value.trim();
    if (!from || !to) {
      toast('Enter both addresses first');
      return;
    }
    const btn = document.getElementById('calc-btn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Calculating…';

    try {
      const result = await calculateDistance(from, to);
      pending = {
        from: result.fromCoords.displayName,
        to: result.toCoords.displayName,
        fromCoords: { lat: result.fromCoords.lat, lon: result.fromCoords.lon },
        toCoords: { lat: result.toCoords.lat, lon: result.toCoords.lon },
        miles: Math.round(result.miles * 10) / 10,
        method: result.method,
      };
      fromEl.value = result.fromCoords.displayName;
      toEl.value = result.toCoords.displayName;

      document.getElementById('distance-miles').textContent = formatMiles(pending.miles);
      document.getElementById('distance-method').textContent =
        pending.method === 'driving' ? 'Driving distance' : 'Straight-line (routing unavailable)';
      document.getElementById('distance-card').classList.remove('hidden');
      document.getElementById('purpose-section').classList.remove('hidden');
      document.getElementById('notes-section').classList.remove('hidden');
    } catch (e) {
      console.error(e);
      if (e.message === 'no_match') toast('Address not found. Try more detail.');
      else toast('Could not calculate. Check connection.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }

  function onPurposePick(tile) {
    document.querySelectorAll('.purpose-tile').forEach((el) => el.classList.remove('selected'));
    tile.classList.add('selected');
    selectedPurpose = tile.dataset.purpose;
    const otherField = document.getElementById('purpose-other');
    if (selectedPurpose === 'Other') {
      otherField.classList.remove('hidden');
      otherField.focus();
    } else {
      otherField.classList.add('hidden');
    }
    document.getElementById('save-btn').classList.remove('hidden');
  }

  function onSaveDrive(e) {
    e.preventDefault();
    if (!pending) {
      toast('Calculate distance first');
      return;
    }
    if (!selectedPurpose) {
      toast('Pick a purpose');
      return;
    }

    let purpose = selectedPurpose;
    if (selectedPurpose === 'Other') {
      const other = document.getElementById('purpose-other').value.trim();
      if (!other) {
        toast('Describe the purpose');
        return;
      }
      purpose = other;
    }

    const drive = {
      id: uid(),
      date: document.getElementById('drive-date').value || todayISO(),
      from: pending.from,
      to: pending.to,
      fromCoords: pending.fromCoords,
      toCoords: pending.toCoords,
      miles: pending.miles,
      method: pending.method,
      purpose,
      purposeCategory: selectedPurpose,
      notes: document.getElementById('drive-notes').value.trim(),
      odoStart: numOrNull(document.getElementById('odo-start').value),
      odoEnd: numOrNull(document.getElementById('odo-end').value),
      createdAt: Date.now(),
    };

    drives.push(drive);
    save(KEYS.drives, drives);
    toast('Drive saved');
    goto('home');
  }

  function numOrNull(v) {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
  }

  // ---------- Detail modal ----------
  function openDetail(id) {
    const d = drives.find((x) => x.id === id);
    if (!d) return;
    const body = document.getElementById('modal-body');
    const date = parseDate(d.date);
    body.innerHTML = `
      <div class="row"><span class="row-label">Date</span><span class="row-value">${date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
      <div class="row"><span class="row-label">From</span><span class="row-value">${escapeHtml(d.from)}</span></div>
      <div class="row"><span class="row-label">To</span><span class="row-value">${escapeHtml(d.to)}</span></div>
      <div class="row"><span class="row-label">Miles</span><span class="row-value">${formatMiles(d.miles)} mi</span></div>
      <div class="row"><span class="row-label">Purpose</span><span class="row-value">${escapeHtml(d.purpose)}</span></div>
      ${d.notes ? `<div class="row"><span class="row-label">Notes</span><span class="row-value">${escapeHtml(d.notes)}</span></div>` : ''}
      ${d.odoStart != null ? `<div class="row"><span class="row-label">Odo start</span><span class="row-value">${d.odoStart.toLocaleString()}</span></div>` : ''}
      ${d.odoEnd != null ? `<div class="row"><span class="row-label">Odo end</span><span class="row-value">${d.odoEnd.toLocaleString()}</span></div>` : ''}
      <div class="row"><span class="row-label">Deduction</span><span class="row-value">${formatMoney(d.miles * settings.ratePerMile)}</span></div>
    `;
    const modal = document.getElementById('drive-modal');
    modal.classList.remove('hidden');
    modal.dataset.id = id;
  }

  function closeDetail() {
    document.getElementById('drive-modal').classList.add('hidden');
  }

  function deleteDrive() {
    const id = document.getElementById('drive-modal').dataset.id;
    if (!id) return;
    if (!confirm('Delete this drive? This cannot be undone.')) return;
    drives = drives.filter((d) => d.id !== id);
    save(KEYS.drives, drives);
    closeDetail();
    // re-render the view we came from
    const visible = [...document.querySelectorAll('.view')].find((v) => !v.classList.contains('hidden'));
    if (visible) goto(visible.dataset.view);
    toast('Drive deleted');
  }

  // ---------- CSV export ----------
  function exportCsv() {
    const year = document.getElementById('export-year').value;
    const rows = drives
      .filter((d) => d.date.startsWith(year))
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

    if (!rows.length) {
      toast('No drives to export for ' + year);
      return;
    }

    const header = ['Date', 'From', 'To', 'Miles', 'Purpose', 'Notes', 'Odometer Start', 'Odometer End', 'Deduction ($)'];
    const esc = (v) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(',')];
    let totalMiles = 0;
    rows.forEach((d) => {
      totalMiles += d.miles;
      lines.push(
        [
          d.date,
          esc(d.from),
          esc(d.to),
          d.miles.toFixed(1),
          esc(d.purpose),
          esc(d.notes || ''),
          d.odoStart != null ? d.odoStart : '',
          d.odoEnd != null ? d.odoEnd : '',
          (d.miles * settings.ratePerMile).toFixed(2),
        ].join(','),
      );
    });
    // Summary footer
    lines.push('');
    lines.push(['', '', 'TOTAL', totalMiles.toFixed(1), '', '', '', '', (totalMiles * settings.ratePerMile).toFixed(2)].join(','));
    const odo = (settings.annualOdometer || {})[year] || {};
    if (odo.start != null || odo.end != null) {
      lines.push('');
      lines.push(`Annual odometer start,,,${odo.start != null ? odo.start : ''}`);
      lines.push(`Annual odometer end,,,${odo.end != null ? odo.end : ''}`);
      if (odo.start != null && odo.end != null) {
        lines.push(`Total vehicle miles,,,${odo.end - odo.start}`);
        const pct = totalMiles / (odo.end - odo.start) * 100;
        lines.push(`Business use %,,,${pct.toFixed(2)}`);
      }
    }
    lines.push('');
    lines.push(`IRS standard mileage rate used,$${settings.ratePerMile.toFixed(3)}`);

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miletrack-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('CSV downloaded');
  }

  // ---------- Settings save ----------
  function saveSettings(e) {
    e.preventDefault();
    const rate = parseFloat(document.getElementById('setting-rate').value);
    if (!isFinite(rate) || rate < 0) {
      toast('Enter a valid rate');
      return;
    }
    settings.ratePerMile = rate;
    settings.homeAddress = document.getElementById('setting-home').value.trim();

    const year = document.getElementById('setting-odo-year').value;
    const start = numOrNull(document.getElementById('setting-odo-start').value);
    const end = numOrNull(document.getElementById('setting-odo-end').value);
    settings.annualOdometer = settings.annualOdometer || {};
    if (start == null && end == null) {
      delete settings.annualOdometer[year];
    } else {
      settings.annualOdometer[year] = {};
      if (start != null) settings.annualOdometer[year].start = start;
      if (end != null) settings.annualOdometer[year].end = end;
    }

    save(KEYS.settings, settings);
    toast('Settings saved');
    goto('home');
  }

  function clearAllData() {
    if (!confirm('Delete ALL drives and settings? This cannot be undone.')) return;
    if (!confirm('Really delete everything? Last chance.')) return;
    localStorage.removeItem(KEYS.drives);
    localStorage.removeItem(KEYS.settings);
    drives = [];
    settings = { ...DEFAULT_SETTINGS };
    toast('All data cleared');
    goto('home');
  }

  // ---------- Geolocation ----------
  async function useMyLocation() {
    if (!navigator.geolocation) {
      toast('Location not supported on this device');
      return;
    }
    const btn = document.getElementById('use-location');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Finding location…';

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          document.getElementById('drive-from').value = addr;
          toast('Location added');
        } catch (e) {
          toast('Could not resolve address');
        } finally {
          btn.disabled = false;
          btn.innerHTML = original;
        }
      },
      (err) => {
        btn.disabled = false;
        btn.innerHTML = original;
        toast('Location permission denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  // ---------- Wire up ----------
  document.addEventListener('click', (e) => {
    const gotoTarget = e.target.closest('[data-goto]');
    if (gotoTarget) {
      goto(gotoTarget.dataset.goto);
    }
  });

  document.getElementById('calc-btn').addEventListener('click', onCalculate);
  document.getElementById('use-location').addEventListener('click', useMyLocation);
  document.getElementById('drive-form').addEventListener('submit', onSaveDrive);
  document.querySelectorAll('.purpose-tile').forEach((tile) => {
    tile.addEventListener('click', () => onPurposePick(tile));
  });
  document.getElementById('year-filter').addEventListener('change', renderAllDrives);
  document.getElementById('export-year').addEventListener('change', (e) => updateExportSummary(e.target.value));
  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);
  document.getElementById('settings-form').addEventListener('submit', saveSettings);
  document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
  document.getElementById('modal-close').addEventListener('click', closeDetail);
  document.getElementById('modal-delete').addEventListener('click', deleteDrive);
  document.getElementById('drive-modal').addEventListener('click', (e) => {
    if (e.target.id === 'drive-modal') closeDetail();
  });

  // Register service worker for offline use
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // Initial render
  goto('home');
})();

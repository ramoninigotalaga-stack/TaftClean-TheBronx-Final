/*
  TaftClean — shared browser storage + UI helpers.
  Student project / static demo: reports belong to THIS browser (localStorage).
  Photos are stored separately using IndexedDB where supported.
  Replace this with a backend/database to share reports across users.
*/
(() => {
  'use strict';

  const STORAGE_KEY = 'taftclean_reports_v1';
  const LAST_SUBMIT_KEY = 'taftclean_last_submit_v1';
  const STATUS_ORDER = ['Submitted', 'Under Review', 'Assigned', 'Resolved'];
  const SUBTYPES = [
    'Overflowing Bin', 'Illegal Dumping', 'Market Waste',
    'Uncollected Household Waste', 'Construction Waste', 'Other'
  ];
  const SAMPLE_REPORTS = [
    {
      id: '99-6799', email: '', subtype: 'Illegal Dumping',
      description: '', observed: '2026-10-20',
      street: 'Taft Avenue near corner', landmark: '',
      amount: 'Large Pile', status: 'Under Review',
      image: 'assets/illegal-dumping.webp', sample: true,
      createdAt: '2026-10-20T08:00:00.000Z'
    },
    {
      id: '99-6800', email: '', subtype: 'Overflowing Bin',
      description: '', observed: '2026-10-18',
      street: 'Taft Ave. Near the Corner', landmark: '',
      amount: 'Small Pile', status: 'Resolved',
      image: 'assets/overflowing-bin.webp', sample: true,
      createdAt: '2026-10-18T08:00:00.000Z'
    },
    {
      id: '99-6801', email: '', subtype: 'Market Waste',
      description: '', observed: '2026-10-21',
      street: 'Taft Ave. Near the stalls', landmark: '',
      amount: 'Large Pile', status: 'Assigned',
      image: 'assets/market-waste.webp', sample: true,
      createdAt: '2026-10-21T08:00:00.000Z'
    }
  ];

  // Shared validation patterns.
  const REGEX = Object.freeze({
    email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    // 15–500 characters. Supports Filipino letters, numbers and common punctuation.
    description: /^(?=[\s\S]{15,500}$)[\p{L}\p{N}\s.,!?\u2019'"()#:/&\u2013\u2014-]+$/u,
    // 5–120 characters; letters and numbers plus normal address punctuation.
    street: /^(?=.{5,120}$)[\p{L}\p{N}\s.,\u2019'()#\/-]+$/u,
    landmark: /^(?=.{3,100}$)[\p{L}\p{N}\s.,\u2019'()#\/-]+$/u,
    reference: /^99-\d{4}$/,
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
  });

  function todayLocal() {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function validObservedDate(value) {
    if (!REGEX.date.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return false;
    if (parsed.getFullYear() + '-' + String(parsed.getMonth() + 1).padStart(2, '0') + '-' + String(parsed.getDate()).padStart(2, '0') !== value) return false;
    return value <= todayLocal();
  }

  function readSaved() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data.filter(x => x && typeof x.id === 'string') : [];
    } catch (error) {
      console.warn('Could not read saved reports:', error);
      return [];
    }
  }
  function writeSaved(reports) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      throw new Error('Browser storage is unavailable or full. Enable local storage and try again.');
    }
  }
  function allReports() {
    const combined = new Map(SAMPLE_REPORTS.map(report => [report.id, { ...report }]));
    readSaved().forEach(report => combined.set(report.id, { ...report }));
    return [...combined.values()];
  }
  function getReport(reference) {
    return allReports().find(report => report.id === reference) || null;
  }
  function generateReference() {
    const used = new Set(allReports().map(r => r.id));
    let highest = Math.max(6798, ...[...used].map(id => Number(id.split('-')[1]) || 0));
    for (let attempt = 0; attempt < 9000; attempt++) {
      highest = highest >= 9999 ? 1000 : highest + 1;
      const ref = `99-${String(highest).padStart(4, '0')}`;
      if (!used.has(ref)) return ref;
    }
    throw new Error('No new reference numbers are available.');
  }
  function createReport(input) {
    const recent = readSaved();
    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_SUBMIT_KEY) || '0');
    if (now - last < 10000) throw new Error('Please wait 10 seconds before sending another report.');
    const similar = recent.some(item =>
      item.subtype === input.subtype &&
      item.street.trim().toLocaleLowerCase() === input.street.trim().toLocaleLowerCase() &&
      item.observed === input.observed &&
      item.description.trim().toLocaleLowerCase() === input.description.trim().toLocaleLowerCase() &&
      now - Date.parse(item.createdAt) < 30 * 60 * 1000
    );
    if (similar) throw new Error('This appears to be a duplicate report submitted in this browser in the last 30 minutes. Track your existing report instead.');
    const report = {
      id: generateReference(), email: input.email, subtype: input.subtype,
      description: input.description, observed: input.observed,
      street: input.street, landmark: input.landmark,
      amount: input.amount, bagCount: input.bagCount, status: 'Submitted', image: '', sample: false,
      createdAt: new Date().toISOString()
    };
    writeSaved([...recent, report]);
    try { localStorage.setItem(LAST_SUBMIT_KEY, String(now)); } catch { /* report itself was saved successfully */ }
    return report;
  }
  function updateReportStatus(id, status) {
    if (!STATUS_ORDER.includes(status)) throw new Error('Invalid report status.');
    const report = getReport(id);
    if (!report) throw new Error('Report not found.');
    const updated = { ...report, status, lastUpdated: new Date().toISOString() };
    const saved = readSaved();
    const index = saved.findIndex(row => row.id === id);
    if (index === -1) saved.push(updated);
    else saved[index] = updated;
    writeSaved(saved);
    return updated;
  }
  function formatDate(value) {
    const [year, month, day] = String(value).split('-').map(Number);
    if (!year || !month || !day) return value || '—';
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function statusClass(status) {
    return ({ Submitted: 'status-submitted', 'Under Review': 'status-review', Assigned: 'status-assigned', Resolved: 'status-resolved' })[status] || 'status-submitted';
  }

  // IndexedDB preserves uploaded image files without hitting localStorage quotas.
  const DB_NAME = 'taftclean_images_v1';
  function openPhotoDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('photos')) request.result.createObjectStore('photos');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Image database unavailable'));
    });
  }
  async function savePhoto(reference, file) {
    const db = await openPhotoDB();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('photos', 'readwrite');
        transaction.objectStore('photos').put(file, reference);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error || new Error('Photo could not be saved'));
      });
    } finally { db.close(); }
  }
  async function loadPhoto(reference) {
    try {
      const db = await openPhotoDB();
      const result = await new Promise((resolve, reject) => {
        const transaction = db.transaction('photos', 'readonly');
        const request = transaction.objectStore('photos').get(reference);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return result;
    } catch { return null; }
  }

  let toastTimer;
  function toast(message) {
    const element = document.getElementById('toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove('show'), 3400);
  }
  function initMenu() {
    const button = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.site-nav');
    if (!button || !menu) return;
    const close = () => { menu.classList.remove('is-open'); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', 'Open navigation'); };
    button.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    document.addEventListener('click', event => { if (!menu.contains(event.target) && !button.contains(event.target)) close(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 800) close(); });
  }
  function elementWithText(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }
  async function renderRecent() {
    const parent = document.getElementById('recent-reports');
    if (!parent) return;
    // New browser-local submissions appear first, followed by the original Canva examples.
    const reports = allReports().sort((a, b) => {
      if (!!a.sample !== !!b.sample) return a.sample ? 1 : -1;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }).slice(0, 3);
    parent.replaceChildren();
    for (const report of reports) {
      const card = document.createElement('a');
      card.className = 'info-card recent-card';
      card.href = `track.html?ref=${encodeURIComponent(report.id)}`;
      card.title = `Track report ${report.id}`;
      const image = document.createElement('img');
      image.alt = `Photo for ${report.subtype}`;
      image.width = 104;
      image.height = 104;
      image.src = report.image || 'assets/hero-garbage.webp';
      const content = document.createElement('div');
      content.append(elementWithText('h3', '', report.subtype));
      content.append(elementWithText('p', '', report.street));
      content.append(elementWithText('span', `status-badge ${statusClass(report.status)}`, report.status));
      card.append(image, content);
      parent.append(card);
      if (!report.image) {
        const blob = await loadPhoto(report.id);
        if (blob && image.isConnected) {
          const url = URL.createObjectURL(blob);
          image.src = url;
          image.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
        }
      }
    }
  }

  window.TaftClean = Object.freeze({
    REGEX, SUBTYPES, STATUS_ORDER, todayLocal, validObservedDate,
    allReports, getReport, createReport, updateReportStatus,
    statusClass, formatDate, savePhoto, loadPhoto, toast
  });
  document.addEventListener('DOMContentLoaded', () => { initMenu(); renderRecent(); });
})();

/* Tracking lookup + status progression. Note: "admin" status controls are demo-only. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const api = window.TaftClean;
  const $ = id => document.getElementById(id);
  const form = $('track-form');
  const input = $('reference-search');
  let currentReference = '';

  function showReport(reference) {
    const code = String(reference || '').trim().toUpperCase();
    if (!api.REGEX.reference.test(code)) {
      $('reference-error').textContent = 'Use the format 99-1234 (two digits, a dash and four digits).';
      input.setAttribute('aria-invalid', 'true');
      $('tracking-result').hidden = true;
      $('track-empty').hidden = true;
      currentReference = '';
      input.focus();
      return;
    }
    $('reference-error').textContent = '';
    input.setAttribute('aria-invalid', 'false');
    const report = api.getReport(code);
    currentReference = report ? code : '';
    $('tracking-result').hidden = !report;
    $('track-empty').hidden = !!report;
    if (!report) return;
    input.value = code;
    $('result-heading').textContent = report.id;
    const status = $('result-status');
    status.textContent = report.status;
    status.className = `status-badge ${api.statusClass(report.status)}`;
    $('result-subtype').textContent = report.subtype;
    $('result-location').textContent = [report.street, report.landmark].filter(Boolean).join(' • ');
    $('result-date').textContent = api.formatDate(report.observed);
    $('result-description-row').hidden = !report.description;
    $('result-description').textContent = report.description || '';
    $('result-amount-row').hidden = !report.amount && !report.bagCount;
    $('result-amount').textContent = [report.amount && report.amount !== 'Not specified' ? report.amount : '', report.bagCount ? `${report.bagCount} estimated bag${Number(report.bagCount) === 1 ? '' : 's'}` : ''].filter(Boolean).join(' • ');
    $('result-update-row').hidden = !(report.lastUpdated || report.createdAt);
    $('result-updated').textContent = report.lastUpdated ? new Date(report.lastUpdated).toLocaleString() : 'At submission';
    const activeIndex = Math.max(0, api.STATUS_ORDER.indexOf(report.status));
    $('progress-tracker').querySelectorAll('.progress-stage').forEach((stage, index) => {
      stage.classList.toggle('is-complete', index < activeIndex);
      stage.classList.toggle('is-current', index === activeIndex);
      if (index === activeIndex) stage.setAttribute('aria-current', 'step');
      else stage.removeAttribute('aria-current');
    });
    $('demo-status').value = report.status;
    try { history.replaceState(null, '', `track.html?ref=${encodeURIComponent(code)}`); } catch { /* file:// privacy mode may limit history */ }
  }

  form.addEventListener('submit', event => { event.preventDefault(); showReport(input.value); });
  input.addEventListener('input', () => {
    if ($('reference-error').textContent) {
      $('reference-error').textContent = '';
      input.setAttribute('aria-invalid', 'false');
    }
  });
  $('sample-code').addEventListener('click', () => showReport('99-6799'));
  $('apply-status').addEventListener('click', () => {
    if (!currentReference) return;
    try {
      api.updateReportStatus(currentReference, $('demo-status').value);
      showReport(currentReference);
      api.toast('Demo status updated in this browser.');
    } catch (error) { api.toast(error.message); }
  });
  const requested = new URLSearchParams(window.location.search).get('ref');
  if (requested) showReport(requested);
  else showReport('99-6799'); // Initial content follows the example in the Canva mockup.
});

document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const api = window.TaftClean;
  const $ = id => document.getElementById(id);
  const search = $('dash-search');
  const filter = $('dash-status');
  const sort = $('dash-sort');
  if (!search || !filter || !sort) return;
  const reports = api.allReports();
  $('stat-total').textContent = String(reports.length);
  $('stat-submitted').textContent = String(reports.filter(r => r.status === 'Submitted').length);
  $('stat-progress').textContent = String(reports.filter(r => ['Under Review', 'Assigned'].includes(r.status)).length);
  $('stat-resolved').textContent = String(reports.filter(r => r.status === 'Resolved').length);

  function cell(row, text, cls = '') {
    const td = document.createElement('td');
    if (cls) td.className = cls;
    td.textContent = text;
    row.append(td);
    return td;
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const status = filter.value;
    let visible = reports.filter(report => {
      const matchText = [report.id, report.subtype, report.street].join(' ').toLocaleLowerCase().includes(query);
      return matchText && (!status || report.status === status);
    });
    if (sort.value === 'type') visible.sort((a, b) => a.subtype.localeCompare(b.subtype));
    else visible.sort((a, b) => (sort.value === 'oldest' ? 1 : -1) * (Date.parse(a.createdAt) - Date.parse(b.createdAt)));
    const body = $('dashboard-rows');
    body.replaceChildren();
    visible.forEach(report => {
      const row = document.createElement('tr');
      cell(row, report.id, 'report-ref');
      cell(row, report.subtype);
      cell(row, report.street);
      cell(row, api.formatDate(report.observed));
      const badgeCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `status-badge ${api.statusClass(report.status)}`;
      badge.textContent = report.status;
      badgeCell.append(badge);
      row.append(badgeCell);
      const action = document.createElement('td');
      const link = document.createElement('a');
      link.href = `track.html?ref=${encodeURIComponent(report.id)}`;
      link.className = 'table-link';
      link.textContent = 'Track';
      link.setAttribute('aria-label', `Track report ${report.id}`);
      action.append(link);
      row.append(action);
      body.append(row);
    });
    $('result-count').textContent = `${visible.length} report${visible.length === 1 ? '' : 's'} shown`;
    $('dashboard-empty').hidden = visible.length > 0;
  }
  [search, filter, sort].forEach(control => control.addEventListener(control === search ? 'input' : 'change', render));
  render();
});

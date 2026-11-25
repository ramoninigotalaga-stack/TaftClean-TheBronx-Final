/* TaftClean report flow, including regex validation for class demonstration. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const api = window.TaftClean;
  const form = document.getElementById('garbage-form');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const fields = {
    email: $('email'), subtype: $('subtype'), description: $('description'),
    observed: $('observed'), street: $('street'), landmark: $('landmark'), bagCount: $('bagCount'), photo: $('photo'), acknowledge: $('acknowledge')
  };
  let selectedPhoto = null;
  let previewURL = null;
  const FIVE_MB = 5 * 1024 * 1024;
  fields.observed.max = api.todayLocal();

  function errorFor(name, message) {
    const control = fields[name];
    const errorElement = $(`${name}-error`);
    if (control) control.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorElement) errorElement.textContent = message || '';
  }
  function hasActualText(text) { return /[\p{L}\p{N}]/u.test(text); }
  function validateField(name) {
    const val = name === 'photo' ? selectedPhoto : fields[name].value.trim();
    let message = '';
    switch (name) {
      case 'email':
        if (!val) message = 'Email is required.';
        else if (!api.REGEX.email.test(val) || val.length > 120) message = 'Enter a valid email (example@email.com).';
        break;
      case 'subtype':
        if (!val) message = 'Please select a garbage sub type.';
        else if (!api.SUBTYPES.includes(val)) message = 'Please select a listed garbage type.';
        break;
      case 'description':
        if (!val) message = 'Description is required.';
        else if (!api.REGEX.description.test(val) || !hasActualText(val)) message = 'Use 15–500 characters; letters, numbers and ordinary punctuation only.';
        break;
      case 'observed':
        if (!val) message = 'Date observed is required.';
        else if (!api.validObservedDate(val)) message = 'Choose a valid date that is not in the future.';
        break;
      case 'street':
        if (!val) message = 'Barangay or street segment is required.';
        else if (!api.REGEX.street.test(val) || !hasActualText(val)) message = 'Use 5–120 characters and a valid street or barangay.';
        break;
      case 'landmark':
        if (val && (!api.REGEX.landmark.test(val) || !hasActualText(val))) message = 'Use 3–100 characters; letters, numbers and basic address punctuation only.';
        break;
      case 'bagCount':
        if (fields.bagCount.validity.badInput || (val && (!/^[0-9]{1,3}$/.test(val) || Number(val) < 1 || Number(val) > 500))) message = 'Enter a whole number from 1 to 500, or leave this field empty.';
        break;
      case 'acknowledge':
        if (!fields.acknowledge.checked) message = 'Please acknowledge the classroom prototype privacy notice.';
        break;
      case 'photo':
        if (val && !['image/jpeg', 'image/png'].includes(val.type)) message = 'Only JPG and PNG photos are allowed.';
        else if (val && val.size > FIVE_MB) message = 'File must be 5MB or smaller.';
        else if (val && val.size === 0) message = 'This image is empty. Choose another photo.';
        break;
    }
    errorFor(name, message);
    return !message;
  }
  function validateAll() {
    const names = ['email', 'subtype', 'description', 'observed', 'street', 'landmark', 'bagCount', 'photo', 'acknowledge'];
    let firstInvalid = null;
    let failed = 0;
    for (const name of names) {
      if (!validateField(name)) {
        failed++;
        if (!firstInvalid) firstInvalid = fields[name];
      }
    }
    const summary = $('error-summary');
    summary.hidden = failed === 0;
    summary.textContent = failed ? `Please correct ${failed} field${failed === 1 ? '' : 's'} marked below before submitting.` : '';
    if (failed) {
      summary.focus({ preventScroll: true });
      firstInvalid?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      firstInvalid?.focus({ preventScroll: true });
      return false;
    }
    return true;
  }
  ['email', 'subtype', 'description', 'observed', 'street', 'landmark', 'bagCount'].forEach(name => {
    fields[name].addEventListener('blur', () => {
      if (fields[name].value.trim() || fields[name].getAttribute('aria-invalid') === 'true') validateField(name);
    });
    fields[name].addEventListener(name === 'subtype' || name === 'observed' ? 'change' : 'input', () => {
      if ($(`${name}-error`).textContent) validateField(name);
      if (name === 'description') $('character-count').textContent = `${fields.description.value.length} / 500`;
    });
  });

  function clearPreview() {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    selectedPhoto = null;
    fields.photo.value = '';
    $('photo-selected').hidden = true;
    $('photo-placeholder').hidden = false;
    $('remove-photo').hidden = true;
    errorFor('photo', '');
  }
  function setPhoto(file) {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    selectedPhoto = file || null;
    if (!file) return clearPreview();
    const valid = validateField('photo');
    $('photo-selected').hidden = !valid;
    $('photo-placeholder').hidden = valid;
    $('remove-photo').hidden = !valid;
    if (valid) {
      previewURL = URL.createObjectURL(file);
      $('photo-preview').src = previewURL;
      $('photo-filename').textContent = file.name;
    }
  }
  fields.photo.addEventListener('change', () => setPhoto(fields.photo.files[0] || null));
  $('remove-photo').addEventListener('click', clearPreview);
  const dropzone = $('photo-drop');
  ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    dropzone.classList.add('is-dragover');
  }));
  ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    dropzone.classList.remove('is-dragover');
  }));
  dropzone.addEventListener('drop', event => { if (event.dataTransfer?.files?.length) setPhoto(event.dataTransfer.files[0]); });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateAll()) return;
    if ($('website').value.trim()) { api.toast('Please try your submission again.'); return; }
    const submitButton = $('submit-report');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting…';
    try {
      const selectedAmount = form.querySelector('input[name="amount"]:checked');
      const report = api.createReport({
        email: fields.email.value.trim(), subtype: fields.subtype.value,
        description: fields.description.value.trim(), observed: fields.observed.value,
        street: fields.street.value.trim(), landmark: fields.landmark.value.trim(),
        amount: selectedAmount?.value || 'Not specified', bagCount: fields.bagCount.value.trim() ? Number(fields.bagCount.value) : null
      });
      if (selectedPhoto) {
        try { await api.savePhoto(report.id, selectedPhoto); }
        catch (err) { console.warn('Photo save failed:', err); api.toast('Report saved, but the photo could not be stored on this browser.'); }
      }
      $('success-reference').textContent = report.id;
      $('track-this-report').href = `track.html?ref=${encodeURIComponent(report.id)}`;
      $('report-flow').hidden = true;
      $('success-view').hidden = false;
      document.title = 'Report Submitted | TaftClean';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      $('success-heading').focus?.();
      if (previewURL) URL.revokeObjectURL(previewURL);
    } catch (error) {
      api.toast(error.message || 'Could not submit this report. Please try again.');
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Report';
    }
  });
  fields.acknowledge.addEventListener('change', () => { if ($('acknowledge-error').textContent) validateField('acknowledge'); });
  form.addEventListener('reset', () => { window.setTimeout(() => { clearPreview(); $('error-summary').hidden = true; Object.keys(fields).forEach(name => errorFor(name, '')); $('character-count').textContent = '0 / 500'; }, 0); });
  $('copy-reference').addEventListener('click', async () => {
    const reference = $('success-reference').textContent;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(reference);
      else {
        const input = document.createElement('textarea');
        input.value = reference;
        document.body.appendChild(input);
        input.select();
        if (!document.execCommand('copy')) throw new Error('Copy failed');
        input.remove();
      }
      api.toast('Reference number copied!');
    } catch { api.toast(`Copy this reference: ${reference}`); }
  });
});

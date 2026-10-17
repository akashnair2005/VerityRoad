const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const STATUS_LABELS = {
  supported_by_visible_evidence: 'Supported by visible evidence',
  consistent_but_not_measurable: 'Consistent but not measurable',
  not_visible_in_image: 'Not visible in image',
  appears_inconsistent_with_image: 'Appears inconsistent with image',
  requires_external_evidence: 'Requires external evidence',
  insufficient_information: 'Insufficient information'
};
const STATUS_BADGE = {
  supported_by_visible_evidence: 'badge-ok',
  consistent_but_not_measurable: 'badge-warn',
  not_visible_in_image: 'badge-ext',
  appears_inconsistent_with_image: 'badge-err',
  requires_external_evidence: 'badge-ext',
  insufficient_information: 'badge-info'
};

const STEP_COPY = {
  1: {
    title: 'Capture the scene, then state the claim',
    body: 'Use JPEG, PNG, or WEBP. Keep a safe vantage point. Write specific claims on separate lines so they can be assessed one by one.'
  },
  2: {
    title: 'Compare each claim with the photograph',
    body: 'The model lists visible observations first, then grades claims. Missing from the frame is not treated as proof that a claim is false.'
  },
  3: {
    title: 'Add evidence and edit the draft',
    body: 'A second photo can close a gap. The complaint draft is yours to correct, copy, and file elsewhere if you choose.'
  }
};

const state = {
  images: [],
  lastPayload: null,
  lastAnalysis: null,
  baselineDraft: '',
  inflight: false
};

const $ = (id) => document.getElementById(id);

function routeName() {
  const hash = (location.hash || '#/').replace(/^#/, '');
  const path = hash.split('?')[0] || '/';
  if (path.startsWith('/workspace')) return 'workspace';
  if (path.startsWith('/methodology')) return 'methodology';
  if (path.startsWith('/standards')) return 'standards';
  if (path.startsWith('/privacy')) return 'privacy';
  return 'home';
}

function showView(name) {
  document.querySelectorAll('.view').forEach((el) => el.classList.remove('active'));
  const view = document.getElementById(`view-${name}`) || $('view-home');
  view.classList.add('active');
  document.querySelectorAll('.nav a').forEach((a) => {
    a.removeAttribute('aria-current');
    if (a.dataset.route === name) a.setAttribute('aria-current', 'page');
  });
  const menu = $('mobileNav');
  const btn = $('menuBtn');
  if (menu && btn) {
    menu.hidden = true;
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  window.scrollTo(0, 0);
}

function setPanel(name) {
  ['form', 'progress', 'error', 'results', 'draft'].forEach((key) => {
    const el = $(`panel-${key}`);
    if (!el) return;
    el.classList.toggle('hidden', key !== name);
  });
  document.querySelectorAll('.stepper button').forEach((btn) => {
    const map = { form: 'form', progress: 'progress', error: 'form', results: 'results', draft: 'draft' };
    btn.setAttribute('aria-current', map[name] === btn.dataset.goto ? 'step' : 'false');
  });
}

function parseClaims(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*•\d.)-]+/, '').trim())
    .filter(Boolean);
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED.includes(file.type)) {
      reject(new Error('Use a JPEG, PNG, or WEBP image.'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('Each image must be 6 MB or smaller.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      resolve({
        mimeType: file.type,
        data: String(reader.result),
        name: file.name,
        previewUrl: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  const root = $('previewList');
  root.innerHTML = '';
  state.images.forEach((img, index) => {
    const row = document.createElement('div');
    row.className = 'thumb';
    row.innerHTML = `
      <img alt="Preview of ${img.name}" src="${img.previewUrl}" />
      <div>
        <strong>${img.name}</strong>
        <p class="help">${img.mimeType}</p>
      </div>
      <div class="thumb-actions">
        <button class="btn btn-secondary" type="button" data-replace="${index}">Replace</button>
        <button class="btn btn-ghost" type="button" data-remove="${index}">Remove</button>
      </div>`;
    root.appendChild(row);
  });
}

function showFormError(message) {
  const el = $('formError');
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
}

function listFill(id, items) {
  const el = $(id);
  el.innerHTML = '';
  (items || []).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  });
  if (!items || !items.length) {
    const li = document.createElement('li');
    li.textContent = 'None listed.';
    el.appendChild(li);
  }
}

function renderResults(analysis) {
  state.lastAnalysis = analysis;
  state.baselineDraft = analysis.complaint_draft;
  $('complaintDraft').value = analysis.complaint_draft;
  updateCounts();
  const quality = analysis.image_quality || 'limited';
  $('qualityNote').textContent = `Image quality assessed as ${quality}. Observations are limited to what is visible.`;
  listFill('observationList', analysis.observations);
  listFill('gapList', analysis.evidence_gaps);
  listFill('cannotList', analysis.cannot_establish);
  listFill('nextList', analysis.next_steps);
  listFill('uncertaintyList', analysis.uncertainty_notes);
  const box = $('findings');
  box.innerHTML = '';
  (analysis.findings || []).forEach((finding) => {
    const article = document.createElement('article');
    article.className = `finding ${finding.status}`;
    const header = document.createElement('header');
    const strong = document.createElement('strong');
    strong.textContent = finding.claim;
    const badge = document.createElement('span');
    badge.className = `badge ${STATUS_BADGE[finding.status] || 'badge-ext'}`;
    badge.textContent = STATUS_LABELS[finding.status] || finding.status;
    header.append(strong, badge);
    const expl = document.createElement('p');
    expl.textContent = finding.explanation;
    const support = document.createElement('p');
    support.className = 'help';
    support.textContent = finding.supporting_observation_or_limitation;
    article.append(header, expl, support);
    if (finding.recommended_next_evidence) {
      const next = document.createElement('p');
      next.className = 'help';
      next.textContent = `Next evidence: ${finding.recommended_next_evidence}`;
      article.append(next);
    }
    box.appendChild(article);
  });
}

function updateCounts() {
  const text = $('complaintDraft').value || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $('draftCounts').textContent = `${text.length} characters · ${words} words`;
}

async function buildPayload() {
  const issueType = document.querySelector('input[name="issueType"]:checked')?.value;
  const description = $('description').value.trim();
  const claims = parseClaims($('claims').value);
  if (!issueType) throw new Error('Select road damage or garbage.');
  if (state.images.length === 0) throw new Error('Upload at least one photograph.');
  if (description.length < 8) throw new Error('Enter a short description of what you observed.');
  if (claims.length === 0) throw new Error('Add at least one specific claim, one per line.');
  return {
    issueType,
    description,
    claims,
    images: state.images.map((img) => ({ mimeType: img.mimeType, data: img.data }))
  };
}

async function runAnalysis() {
  if (state.inflight) return;
  showFormError('');
  $('analyzeError').textContent = '';
  let payload;
  try {
    payload = await buildPayload();
  } catch (err) {
    showFormError(err.message);
    setPanel('form');
    return;
  }
  state.lastPayload = payload;
  state.inflight = true;
  $('submitBtn').disabled = true;
  $('reassessBtn').disabled = true;
  setPanel('progress');
  $('progressText').textContent = 'Sending the photograph and claims to Gemma. This can take a little while.';
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Analysis failed.');
    }
    renderResults(data.analysis);
    setPanel('results');
  } catch (err) {
    $('analyzeError').textContent = err.message || 'Analysis failed.';
    setPanel('error');
  } finally {
    state.inflight = false;
    $('submitBtn').disabled = false;
    $('reassessBtn').disabled = false;
  }
}

async function checkReady() {
  try {
    const res = await fetch('/api/ready');
    const data = await res.json();
    const banner = $('serviceBanner');
    if (!data.configured) {
      banner.textContent = 'This server has no GEMINI_API_KEY configured. You can still prepare a report, but analysis will not run until a key is set on the server.';
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  } catch {
    const banner = $('serviceBanner');
    banner.textContent = 'Could not reach the analysis service.';
    banner.classList.remove('hidden');
  }
}

function addImage(file, replaceIndex) {
  fileToPayload(file)
    .then((payload) => {
      if (typeof replaceIndex === 'number') {
        URL.revokeObjectURL(state.images[replaceIndex].previewUrl);
        state.images[replaceIndex] = payload;
      } else if (state.images.length >= 2) {
        URL.revokeObjectURL(state.images[1].previewUrl);
        state.images[1] = payload;
      } else {
        state.images.push(payload);
      }
      renderPreviews();
      showFormError('');
    })
    .catch((err) => showFormError(err.message));
}

$('photoInput').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) addImage(file);
  event.target.value = '';
});

$('previewList').addEventListener('click', (event) => {
  const replace = event.target.closest('[data-replace]');
  const remove = event.target.closest('[data-remove]');
  if (replace) {
    const index = Number(replace.dataset.replace);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ALLOWED.join(',');
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) addImage(file, index);
    });
    input.click();
  }
  if (remove) {
    const index = Number(remove.dataset.remove);
    URL.revokeObjectURL(state.images[index].previewUrl);
    state.images.splice(index, 1);
    renderPreviews();
  }
});

$('reportForm').addEventListener('submit', (event) => {
  event.preventDefault();
  runAnalysis();
});

['description', 'claims'].forEach((id) => {
  $(id).addEventListener('input', () => showFormError(''));
});

$('retryBtn').addEventListener('click', () => runAnalysis());
$('editBtn').addEventListener('click', () => setPanel('form'));
$('toDraftBtn').addEventListener('click', () => setPanel('draft'));
$('backResultsBtn').addEventListener('click', () => setPanel('results'));

$('reassessBtn').addEventListener('click', () => {
  if (state.images.length === 0) {
    showFormError('Add a photograph before reassessing.');
    setPanel('form');
    return;
  }
  runAnalysis();
});

$('extraPhoto').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) addImage(file);
  event.target.value = '';
});

$('complaintDraft').addEventListener('input', updateCounts);

$('copyBtn').addEventListener('click', async () => {
  const text = $('complaintDraft').value;
  try {
    await navigator.clipboard.writeText(text);
    $('copyStatus').textContent = 'Copied.';
  } catch {
    $('complaintDraft').select();
    document.execCommand('copy');
    $('copyStatus').textContent = 'Copied.';
  }
});

$('resetDraftBtn').addEventListener('click', () => {
  $('complaintDraft').value = state.baselineDraft || '';
  updateCounts();
  $('copyStatus').textContent = 'Draft reset to generated text.';
});

document.querySelectorAll('[data-step-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const n = btn.dataset.stepTab;
    document.querySelectorAll('[data-step-tab]').forEach((el) => el.setAttribute('aria-pressed', String(el === btn)));
    const copy = STEP_COPY[n];
    $('stepDetail').innerHTML = `<h3>${copy.title}</h3><p class="muted">${copy.body}</p>`;
  });
});

document.querySelectorAll('.stepper button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.goto;
    if (target === 'results' && !state.lastAnalysis) return;
    if (target === 'draft' && !state.lastAnalysis) return;
    if (target === 'progress' && !state.inflight) return;
    setPanel(target === 'progress' ? (state.inflight ? 'progress' : 'form') : target);
  });
});

$('menuBtn').addEventListener('click', () => {
  const menu = $('mobileNav');
  const open = menu.hidden;
  menu.hidden = !open;
  menu.classList.toggle('open', open);
  $('menuBtn').setAttribute('aria-expanded', String(open));
});

window.addEventListener('hashchange', () => showView(routeName()));
showView(routeName());
setPanel('form');
checkReady();

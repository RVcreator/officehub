(function () {
  'use strict';

  const PROJECT = 'wxjjrfhahxqhbixaviwm';
  const API = `https://${PROJECT}.supabase.co`;
  const nativeFetch = window.fetch.bind(window);
  const state = { draft: [], detailTaskId: '', detailRows: [], createBusy: false, detailBusy: false, lastPath: location.pathname };
  let anonKey = '';

  function session() {
    const preferred = ['auth-token-wipahs-officehub', `sb-${PROJECT}-auth-token`];
    const keys = [...new Set([...preferred, ...Object.keys(localStorage).filter(k => /auth-token|supabase/i.test(k))])];
    for (const name of keys) {
      try {
        const value = JSON.parse(localStorage.getItem(name) || 'null');
        const candidates = [value, value?.currentSession, value?.session, value?.data?.session, value?.state?.session, value?.state?.currentSession, value?.currentSession?.session];
        for (const candidate of candidates) if (candidate?.access_token && candidate?.user?.id) return candidate;
      } catch (_) {}
    }
    return null;
  }

  async function key() {
    if (anonKey) return anonKey;
    const src = document.querySelector('script[type="module"][src]')?.src;
    if (!src) return '';
    const jwt = /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/;
    const publishable = /sb_(?:publishable|anon)_[a-zA-Z0-9_-]{30,}/;
    let text = await nativeFetch(src, { cache: 'no-store' }).then(r => r.text());
    let match = text.match(jwt) || text.match(publishable);
    if (!match) {
      const dependency = text.match(/\.\/button-[a-zA-Z0-9_-]+\.js/)?.[0];
      if (dependency) {
        text = await nativeFetch(new URL(dependency, src), { cache: 'no-store' }).then(r => r.text());
        match = text.match(jwt) || text.match(publishable);
      }
    }
    anonKey = match?.[0] || '';
    return anonKey;
  }

  async function api(path, options = {}) {
    const current = session(), anon = await key();
    if (!current || !anon) throw new Error('Please sign in again.');
    const headers = Object.assign({ apikey: anon, Authorization: `Bearer ${current.access_token}`, 'Content-Type': 'application/json' }, options.headers || {});
    const response = await nativeFetch(`${API}${path}`, Object.assign({}, options, { headers }));
    if (!response.ok) throw new Error((await response.text()) || 'Request failed.');
    return response.status === 204 ? null : response.json();
  }

  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function styles() {
    if (document.getElementById('oh-subtasks-style')) return;
    const style = document.createElement('style');
    style.id = 'oh-subtasks-style';
    style.textContent = `.oh-subtasks{border:1px solid #dbe3ed;border-radius:12px;background:#fff;padding:15px;margin:14px 0;color:#172033}.oh-subtasks h3{font-size:15px;font-weight:700;margin:0 0 4px}.oh-subtasks-help{font-size:12px;color:#64748b;margin:0 0 11px}.oh-subtasks-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.oh-subtasks-input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:9px 10px;background:#fff}.oh-subtasks-btn{border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:8px 11px;cursor:pointer;font-weight:650}.oh-subtasks-list{display:grid;gap:7px;margin-top:10px}.oh-subtask-draft,.oh-subtask-row{display:flex;align-items:center;gap:9px;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#f8fafc}.oh-subtask-draft span,.oh-subtask-row span{flex:1;min-width:0;overflow-wrap:anywhere}.oh-subtask-remove{border:0;background:transparent;color:#b42318;cursor:pointer;font-size:18px}.oh-subtask-row input{width:17px;height:17px;cursor:pointer}.oh-subtask-row.is-done span{text-decoration:line-through;color:#64748b}.oh-progress-head{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin:12px 0 6px}.oh-progress-track{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.oh-progress-fill{height:100%;background:#2563eb;border-radius:999px;transition:width .25s ease}.oh-subtasks-error{font-size:12px;color:#b42318;margin-top:8px}@media(max-width:600px){.oh-subtasks-add{grid-template-columns:1fr}.oh-subtasks-btn{width:100%}}`;
    document.head.appendChild(style);
  }

  function taskIdFromPath() {
    if (!/(^|\/)tasks?(\/|$)/i.test(location.pathname)) return '';
    return location.pathname.match(/[0-9a-f]{8}-[0-9a-f-]{27,}/i)?.[0] || '';
  }

  function draftSection() {
    const section = document.createElement('section');
    section.className = 'oh-subtasks';
    section.dataset.ohSubtaskDraft = '1';
    section.innerHTML = '<h3>Subtasks</h3><p class="oh-subtasks-help">Break this task into smaller steps. You can add as many as needed.</p><div class="oh-subtasks-add"><input class="oh-subtasks-input" type="text" maxlength="300" placeholder="Add a subtask"><button class="oh-subtasks-btn" type="button">Add subtask</button></div><div class="oh-subtasks-list"></div><div class="oh-subtasks-error"></div>';
    const input = section.querySelector('input');
    const list = section.querySelector('.oh-subtasks-list');
    const error = section.querySelector('.oh-subtasks-error');
    const paint = () => {
      list.innerHTML = state.draft.map((title, index) => `<div class="oh-subtask-draft"><span>${esc(title)}</span><button type="button" class="oh-subtask-remove" data-remove="${index}" aria-label="Remove subtask">×</button></div>`).join('');
    };
    const add = () => {
      const title = input.value.trim();
      error.textContent = '';
      if (!title) return;
      if (state.draft.length >= 50) { error.textContent = 'A task can have up to 50 subtasks.'; return; }
      state.draft.push(title);
      input.value = '';
      paint();
      input.focus();
    };
    section.querySelector('.oh-subtasks-btn').onclick = add;
    input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); add(); } };
    list.onclick = event => {
      const index = event.target.dataset.remove;
      if (index === undefined) return;
      state.draft.splice(Number(index), 1);
      paint();
    };
    paint();
    return section;
  }

  function enhanceCreateTask() {
    if (state.createBusy || taskIdFromPath()) return;
    const title = document.querySelector('input[placeholder="What needs to be done?"]');
    const form = title?.closest('form');
    if (!form || form.querySelector('[data-oh-subtask-draft]')) return;
    state.createBusy = true;
    try {
      const section = draftSection();
      const submit = form.querySelector('button[type="submit"],input[type="submit"]');
      const target = submit?.parentElement || form.lastElementChild;
      target ? target.before(section) : form.appendChild(section);
    } finally {
      state.createBusy = false;
    }
  }

  async function saveDraft(taskId) {
    if (!taskId || !state.draft.length) return;
    const current = session();
    const rows = state.draft.map((title, position) => ({ task_id: taskId, title, position, created_by: current.user.id }));
    await api('/rest/v1/task_subtasks', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rows) });
    state.draft = [];
  }

  function detailSection(taskId, rows) {
    const section = document.createElement('section');
    section.className = 'oh-subtasks';
    section.dataset.ohSubtaskDetail = taskId;
    const done = rows.filter(row => row.is_completed).length;
    const percent = rows.length ? Math.round(done * 100 / rows.length) : 0;
    section.innerHTML = `<h3>Subtasks</h3><div class="oh-progress-head"><span>${done} of ${rows.length} completed</span><strong>${percent}%</strong></div><div class="oh-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="oh-progress-fill" style="width:${percent}%"></div></div><div class="oh-subtasks-list">${rows.map(row => `<label class="oh-subtask-row${row.is_completed ? ' is-done' : ''}"><input type="checkbox" data-subtask="${row.id}"${row.is_completed ? ' checked' : ''}><span>${esc(row.title)}</span></label>`).join('') || '<p class="oh-subtasks-help">No subtasks have been added.</p>'}</div><div class="oh-subtasks-add" style="margin-top:10px"><input class="oh-subtasks-input" type="text" maxlength="300" placeholder="Add another subtask"><button class="oh-subtasks-btn" type="button" data-add-detail>Add subtask</button></div><div class="oh-subtasks-error"></div>`;
    section.querySelector('.oh-subtasks-list').onchange = async event => {
      const input = event.target.closest('[data-subtask]');
      if (!input) return;
      input.disabled = true;
      const completed = input.checked;
      const current = session();
      try {
        await api(`/rest/v1/task_subtasks?id=eq.${encodeURIComponent(input.dataset.subtask)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null, completed_by: completed ? current.user.id : null, updated_at: new Date().toISOString() }) });
        await loadDetail(taskId, true);
      } catch (error) {
        input.checked = !completed;
        input.disabled = false;
        section.querySelector('.oh-subtasks-error').textContent = error.message;
      }
    };
    const addInput = section.querySelector('input[placeholder="Add another subtask"]');
    const add = async () => {
      const title = addInput.value.trim();
      if (!title) return;
      section.querySelector('.oh-subtasks-error').textContent = '';
      try {
        await api('/rest/v1/task_subtasks', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ task_id: taskId, title, position: rows.length, created_by: session().user.id }) });
        await loadDetail(taskId, true);
      } catch (error) {
        section.querySelector('.oh-subtasks-error').textContent = error.message;
      }
    };
    section.querySelector('[data-add-detail]').onclick = add;
    addInput.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); add(); } };
    return section;
  }

  function placeDetail(section) {
    const main = document.querySelector('main');
    if (!main) return;
    const host = main.querySelector('.space-y-6') || main;
    const heading = [...host.querySelectorAll('h1,h2')].find(node => !/task details?/i.test(node.textContent || '')) || host.querySelector('h1,h2');
    let anchor = heading?.closest('[class*="border"],.page-header');
    if (!anchor || anchor === host) anchor = host.firstElementChild;
    if (anchor && anchor.nextElementSibling !== section) anchor.insertAdjacentElement('afterend', section);
    else if (!anchor && section.parentElement !== host) host.prepend(section);
  }

  async function loadDetail(taskId, force = false) {
    if (state.detailBusy || (!force && state.detailTaskId === taskId && document.querySelector(`[data-oh-subtask-detail="${taskId}"]`))) return;
    state.detailBusy = true;
    try {
      const rows = await api(`/rest/v1/task_subtasks?task_id=eq.${encodeURIComponent(taskId)}&select=id,title,position,is_completed,completed_at&order=position.asc,created_at.asc`);
      state.detailTaskId = taskId;
      state.detailRows = rows || [];
      document.querySelectorAll('[data-oh-subtask-detail]').forEach(node => node.remove());
      placeDetail(detailSection(taskId, state.detailRows));
    } catch (error) {
      console.error('OfficeHub subtasks', error);
    } finally {
      state.detailBusy = false;
    }
  }

  function init() {
    styles();
    if (!session()) return;
    if (state.lastPath !== location.pathname) {
      state.lastPath = location.pathname;
      state.detailTaskId = '';
      if (!/tasks?\/(new|create)/i.test(location.pathname)) state.draft = [];
      document.querySelectorAll('[data-oh-subtask-detail],[data-oh-subtask-draft]').forEach(node => node.remove());
    }
    enhanceCreateTask();
    const taskId = taskIdFromPath();
    if (taskId) loadDetail(taskId);
  }

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input?.url || String(input);
    const method = (init?.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();
    let next = init;
    if (method === 'POST' && /\/rest\/v1\/tasks(\?|$)/.test(url) && state.draft.length) {
      const headers = new Headers(init?.headers || (typeof input !== 'string' && input?.headers) || {});
      headers.set('Prefer', 'return=representation');
      next = Object.assign({}, init, { headers });
    }
    const response = await nativeFetch(input, next);
    if (response.ok && method === 'POST' && /\/rest\/v1\/tasks(\?|$)/.test(url) && state.draft.length) {
      try {
        const data = await response.clone().json();
        const task = Array.isArray(data) ? data[0] : data;
        if (task?.id) await saveDraft(task.id);
      } catch (error) {
        console.error('OfficeHub subtask creation', error);
      }
    }
    return response;
  };

  addEventListener('popstate', init);
  new MutationObserver(init).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(init, 1600);
  init();
})();

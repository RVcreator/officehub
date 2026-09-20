(function () {
  'use strict';

  const PROJECT = 'wxjjrfhahxqhbixaviwm';
  const API = `https://${PROJECT}.supabase.co`;
  const nativeFetch = window.fetch.bind(window);
  const state = {
    draft: [],
    path: location.pathname,
    detailTaskId: '',
    detailRows: [],
    editTaskId: '',
    editRows: [],
    busy: false
  };
  let anonKey = '';

  function session() {
    const preferred = ['auth-token-wipahs-officehub', `sb-${PROJECT}-auth-token`];
    const keys = [...new Set([...preferred, ...Object.keys(localStorage).filter(key => /auth-token|supabase/i.test(key))])];
    for (const name of keys) {
      try {
        const value = JSON.parse(localStorage.getItem(name) || 'null');
        const candidates = [value, value?.currentSession, value?.session, value?.data?.session, value?.state?.session, value?.state?.currentSession, value?.currentSession?.session];
        for (const candidate of candidates) {
          if (candidate?.access_token && candidate?.user?.id) return candidate;
        }
      } catch (_) {}
    }
    return null;
  }

  async function key() {
    if (anonKey) return anonKey;
    const src = new URL('/assets/v20260908e/index-CQVVn--2-oh20260903.js', location.origin).href;
    const jwt = /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/;
    const publishable = /sb_(?:publishable|anon)_[a-zA-Z0-9_-]{30,}/;
    let text = await nativeFetch(src, { cache: 'no-store' }).then(response => response.text());
    let match = text.match(jwt) || text.match(publishable);
    if (!match) {
      const dependency = text.match(/\.\/button-[a-zA-Z0-9_-]+\.js/)?.[0];
      if (dependency) {
        text = await nativeFetch(new URL(dependency, src), { cache: 'no-store' }).then(response => response.text());
        match = text.match(jwt) || text.match(publishable);
      }
    }
    anonKey = match?.[0] || '';
    return anonKey;
  }

  async function api(path, options = {}) {
    const current = session();
    const anon = await key();
    if (!current || !anon) throw new Error('Please sign in again.');
    const headers = Object.assign({
      apikey: anon,
      Authorization: `Bearer ${current.access_token}`,
      'Content-Type': 'application/json'
    }, options.headers || {});
    const response = await nativeFetch(`${API}${path}`, Object.assign({}, options, { headers }));
    if (!response.ok) {
      let message = await response.text();
      try { message = JSON.parse(message)?.message || message; } catch (_) {}
      throw new Error(message || 'Request failed.');
    }
    return response.status === 204 ? null : response.json();
  }

  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function styles() {
    if (document.getElementById('oh-subtasks-style-v2')) return;
    document.getElementById('oh-subtasks-style')?.remove();
    const style = document.createElement('style');
    style.id = 'oh-subtasks-style-v2';
    style.textContent = `
      .oh-subtasks{border:1px solid #dbe3ed;border-radius:12px;background:#fff;padding:15px;margin:0;color:#172033}
      .oh-subtasks h3{font-size:15px;font-weight:700;margin:0 0 4px}.oh-subtasks-help{font-size:12px;color:#64748b;margin:0 0 11px}
      .oh-subtasks-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.oh-subtasks-input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:9px 10px;background:#fff}
      .oh-subtasks-btn{border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:8px 11px;cursor:pointer;font-weight:650}.oh-subtasks-btn:disabled{opacity:.55;cursor:not-allowed}
      .oh-subtasks-list{display:grid;gap:7px;margin-top:10px}.oh-subtask-draft,.oh-subtask-row,.oh-subtask-edit{display:flex;align-items:center;gap:9px;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#f8fafc}
      .oh-subtask-draft span,.oh-subtask-row span{flex:1;min-width:0;overflow-wrap:anywhere}.oh-subtask-edit .oh-subtasks-input{flex:1;min-width:0}
      .oh-subtask-remove{border:0;background:transparent;color:#b42318;cursor:pointer;font-size:18px}.oh-subtask-row input[type=checkbox]{width:18px;height:18px;cursor:pointer;accent-color:#2563eb}
      .oh-subtask-row.is-done span{text-decoration:line-through;color:#64748b}.oh-progress-head{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin:12px 0 6px}
      .oh-progress-track{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.oh-progress-fill{height:100%;background:#2563eb;border-radius:999px;transition:width .25s ease}
      .oh-subtasks-error{font-size:12px;color:#b42318;margin-top:8px}.oh-subtasks-status{font-size:11px;color:#64748b;white-space:nowrap}
      @media(max-width:600px){.oh-subtasks-add{grid-template-columns:1fr}.oh-subtasks-btn{width:100%}.oh-subtask-edit{align-items:stretch;flex-direction:column}.oh-subtask-edit .oh-subtasks-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function taskIdFromPath() {
    if (!/(^|\/)tasks?(\/|$)/i.test(location.pathname)) return '';
    return location.pathname.match(/[0-9a-f]{8}-[0-9a-f-]{27,}/i)?.[0] || '';
  }

  function isCreatePage() {
    return /\/tasks?\/(create|new)\/?$/i.test(location.pathname);
  }

  function isEditPage() {
    return /\/tasks?\/[0-9a-f-]+\/edit\/?$/i.test(location.pathname);
  }

  function taskDetailsCard(form) {
    const heading = [...form.querySelectorAll('h1,h2,h3,h4,div,span')].find(node => node.children.length === 0 && node.textContent?.trim().toLowerCase() === 'task details');
    if (heading) {
      let card = heading;
      while (card.parentElement && card.parentElement !== form) {
        card = card.parentElement;
        if (/border|rounded-xl|shadow/.test(card.className || '')) return card;
      }
    }
    const title = form.querySelector('input[placeholder="What needs to be done?"],input[name="title"]');
    return title?.closest('[class*="border"],[class*="rounded-xl"]') || title?.closest('label')?.parentElement?.parentElement || form.firstElementChild;
  }

  function placeAfterTaskDetails(form, section) {
    const card = taskDetailsCard(form);
    if (card && card !== form) card.insertAdjacentElement('afterend', section);
    else form.prepend(section);
  }

  function draftSection() {
    const section = document.createElement('section');
    section.className = 'oh-subtasks';
    section.dataset.ohSubtaskDraft = '1';
    section.innerHTML = '<h3>Subtasks</h3><p class="oh-subtasks-help">Break this task into smaller steps. Progress will update automatically as they are completed.</p><div class="oh-subtasks-add"><input class="oh-subtasks-input" type="text" maxlength="300" placeholder="Add a subtask"><button class="oh-subtasks-btn" type="button">Add subtask</button></div><div class="oh-subtasks-list"></div><div class="oh-subtasks-error"></div>';
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
    if (!isCreatePage()) return;
    const title = document.querySelector('input[placeholder="What needs to be done?"]');
    const form = title?.closest('form');
    if (!form || form.querySelector('[data-oh-subtask-draft]')) return;
    placeAfterTaskDetails(form, draftSection());
  }

  async function saveDraft(taskId) {
    if (!taskId || !state.draft.length) return;
    const current = session();
    const rows = state.draft.map((title, position) => ({ task_id: taskId, title, position, created_by: current.user.id }));
    await api('/rest/v1/task_subtasks', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rows) });
    state.draft = [];
  }

  function automaticProgress(rows) {
    const done = rows.filter(row => row.is_completed).length;
    return { done, percent: rows.length ? Math.round(done * 100 / rows.length) : 0 };
  }

  function setManualProgressVisibility(hasSubtasks) {
    const range = document.querySelector('input[aria-label="Task progress percentage"]');
    const wrapper = range?.closest('div.flex');
    if (!wrapper) return;
    if (!wrapper.dataset.ohOriginalDisplay) wrapper.dataset.ohOriginalDisplay = wrapper.style.display || 'flex';
    wrapper.style.display = hasSubtasks ? 'none' : wrapper.dataset.ohOriginalDisplay;
    wrapper.dataset.ohSubtaskControlled = hasSubtasks ? '1' : '0';
  }

  function detailSection(taskId, rows) {
    const section = document.createElement('section');
    section.className = 'oh-subtasks';
    section.dataset.ohSubtaskDetail = taskId;
    const { done, percent } = automaticProgress(rows);
    section.innerHTML = `<h3>Subtasks</h3><p class="oh-subtasks-help">Check each item when it is complete. Task progress updates automatically.</p><div class="oh-progress-head"><span>${done} of ${rows.length} completed</span><strong>${percent}%</strong></div><div class="oh-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="oh-progress-fill" style="width:${percent}%"></div></div><div class="oh-subtasks-list">${rows.map(row => `<label class="oh-subtask-row${row.is_completed ? ' is-done' : ''}"><input type="checkbox" data-subtask="${row.id}"${row.is_completed ? ' checked' : ''}><span>${esc(row.title)}</span></label>`).join('') || '<p class="oh-subtasks-help">No subtasks have been added. Task progress can be updated manually.</p>'}</div><div class="oh-subtasks-error"></div>`;
    section.querySelector('.oh-subtasks-list').onchange = async event => {
      const input = event.target.closest('[data-subtask]');
      if (!input) return;
      const completed = input.checked;
      input.disabled = true;
      section.querySelector('.oh-subtasks-error').textContent = '';
      try {
        await api('/rest/v1/rpc/set_task_subtask_completion', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ p_subtask_id: input.dataset.subtask, p_completed: completed })
        });
        // Reload so the native task status and progress card reflect the database
        // values immediately, including automatic completion at 100%.
        location.reload();
      } catch (error) {
        input.checked = !completed;
        input.disabled = false;
        section.querySelector('.oh-subtasks-error').textContent = error.message;
      }
    };
    return section;
  }

  function placeDetail(section) {
    const main = document.querySelector('main');
    if (!main) return;
    const progressLabel = [...main.querySelectorAll('span,h2,h3,p')].find(node => node.textContent?.trim().toLowerCase() === 'task progress');
    if (progressLabel) {
      let card = progressLabel;
      while (card.parentElement && card.parentElement !== main) {
        card = card.parentElement;
        if (/border|rounded-xl|shadow/.test(card.className || '')) break;
      }
      if (card.parentElement) { card.insertAdjacentElement('beforebegin', section); return; }
    }
    const host = main.querySelector('.space-y-6') || main;
    const header = host.querySelector('.page-header') || host.firstElementChild;
    if (header) header.insertAdjacentElement('afterend', section);
    else host.prepend(section);
  }

  async function loadDetail(taskId, force = false) {
    if (!taskId || isEditPage()) return;
    if (!force && state.detailTaskId === taskId && document.querySelector(`[data-oh-subtask-detail="${taskId}"]`)) {
      setManualProgressVisibility(state.detailRows.length > 0);
      return;
    }
    try {
      const rows = await api(`/rest/v1/task_subtasks?task_id=eq.${encodeURIComponent(taskId)}&select=id,title,position,is_completed,completed_at&order=position.asc,created_at.asc`);
      state.detailTaskId = taskId;
      state.detailRows = rows || [];
      document.querySelectorAll('[data-oh-subtask-detail]').forEach(node => node.remove());
      placeDetail(detailSection(taskId, state.detailRows));
      setManualProgressVisibility(state.detailRows.length > 0);
    } catch (error) {
      console.error('OfficeHub subtasks', error);
    }
  }

  function editSection(taskId, rows) {
    const section = document.createElement('section');
    section.className = 'oh-subtasks';
    section.dataset.ohSubtaskEdit = taskId;
    section.innerHTML = '<h3>Subtasks</h3><p class="oh-subtasks-help">Add, rename or remove subtasks here. Completion is checked from the task page.</p><div class="oh-subtasks-add"><input class="oh-subtasks-input" type="text" maxlength="300" placeholder="Add a subtask"><button class="oh-subtasks-btn" type="button" data-add>Add subtask</button></div><div class="oh-subtasks-list"></div><div class="oh-subtasks-error"></div>';
    const list = section.querySelector('.oh-subtasks-list');
    const error = section.querySelector('.oh-subtasks-error');
    const addInput = section.querySelector('input[placeholder="Add a subtask"]');
    list.innerHTML = rows.map(row => `<div class="oh-subtask-edit" data-row="${row.id}"><input class="oh-subtasks-input" maxlength="300" value="${esc(row.title)}" aria-label="Subtask title"><span class="oh-subtasks-status">${row.is_completed ? 'Completed' : 'Not completed'}</span><button type="button" class="oh-subtasks-btn" data-save>Save</button><button type="button" class="oh-subtask-remove" data-delete aria-label="Delete subtask">×</button></div>`).join('') || '<p class="oh-subtasks-help">No subtasks have been added.</p>';
    const add = async () => {
      const title = addInput.value.trim();
      if (!title) return;
      error.textContent = '';
      try {
        await api('/rest/v1/rpc/manage_task_subtask', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ p_action: 'add', p_task_id: taskId, p_subtask_id: null, p_title: title })
        });
        await loadEdit(taskId, true);
      } catch (err) { error.textContent = err.message; }
    };
    section.querySelector('[data-add]').onclick = add;
    addInput.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); add(); } };
    list.onclick = async event => {
      const row = event.target.closest('[data-row]');
      if (!row) return;
      error.textContent = '';
      try {
        if (event.target.closest('[data-save]')) {
          const title = row.querySelector('input').value.trim();
          if (!title) throw new Error('Subtask title is required.');
          await api('/rest/v1/rpc/manage_task_subtask', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ p_action: 'rename', p_task_id: taskId, p_subtask_id: row.dataset.row, p_title: title })
          });
        } else if (event.target.closest('[data-delete]')) {
          await api('/rest/v1/rpc/manage_task_subtask', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ p_action: 'delete', p_task_id: taskId, p_subtask_id: row.dataset.row, p_title: null })
          });
        } else return;
        await loadEdit(taskId, true);
      } catch (err) { error.textContent = err.message; }
    };
    return section;
  }

  async function loadEdit(taskId, force = false) {
    if (!taskId || !isEditPage()) return;
    const title = document.querySelector('input[name="title"],form input[type="text"]');
    const form = title?.closest('form');
    if (!form) return;
    if (!force && state.editTaskId === taskId && form.querySelector(`[data-oh-subtask-edit="${taskId}"]`)) return;
    try {
      const rows = await api(`/rest/v1/task_subtasks?task_id=eq.${encodeURIComponent(taskId)}&select=id,title,position,is_completed&order=position.asc,created_at.asc`);
      state.editTaskId = taskId;
      state.editRows = rows || [];
      document.querySelectorAll('[data-oh-subtask-edit]').forEach(node => node.remove());
      placeAfterTaskDetails(form, editSection(taskId, state.editRows));
    } catch (error) {
      console.error('OfficeHub subtask editor', error);
    }
  }

  function resetForRoute() {
    if (state.path === location.pathname) return;
    state.path = location.pathname;
    state.detailTaskId = '';
    state.editTaskId = '';
    state.detailRows = [];
    state.editRows = [];
    if (!isCreatePage()) state.draft = [];
    document.querySelectorAll('[data-oh-subtask-detail],[data-oh-subtask-draft],[data-oh-subtask-edit]').forEach(node => node.remove());
    setManualProgressVisibility(false);
  }

  function init() {
    styles();
    if (!session() || state.busy) return;
    resetForRoute();
    enhanceCreateTask();
    const taskId = taskIdFromPath();
    if (isEditPage()) loadEdit(taskId);
    else if (taskId) loadDetail(taskId);
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
  setInterval(init, 1500);
  init();
})();

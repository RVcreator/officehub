(function () {
  'use strict';

  const PROJECT = 'wxjjrfhahxqhbixaviwm';
  const API = `https://${PROJECT}.supabase.co`;
  const DRAFT_KEY = 'oh_pending_task_subtasks_v1';
  const nativeFetch = window.fetch.bind(window);
  const state = {
    draft: [],
    path: location.pathname,
    detailTaskId: '',
    detailRows: [],
    editTaskId: '',
    editRows: [],
    detailTask: null,
    detailLoading: false,
    editLoading: false,
    pendingFlush: false,
    scheduled: false
  };
  let anonKey = '';

  function session() {
    if (window.__OH_SESSION__?.access_token && window.__OH_SESSION__?.user?.id) return window.__OH_SESSION__;
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
    if (window.__OH_ANON_KEY__) return (anonKey = window.__OH_ANON_KEY__);
    if (window.__OH_ANON_KEY_PROMISE__) return (anonKey = await window.__OH_ANON_KEY_PROMISE__);
    window.__OH_ANON_KEY_PROMISE__ = (async () => {
    const src = new URL('/assets/v20260908e/index-CQVVn--2-oh20260903.js', location.origin).href;
    const jwt = /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/;
    const publishable = /sb_(?:publishable|anon)_[a-zA-Z0-9_-]{30,}/;
    let text = await nativeFetch(src, { cache: 'force-cache' }).then(response => response.text());
    let match = text.match(jwt) || text.match(publishable);
    if (!match) {
      const dependency = text.match(/\.\/button-[a-zA-Z0-9_-]+\.js/)?.[0];
      if (dependency) {
        text = await nativeFetch(new URL(dependency, src), { cache: 'force-cache' }).then(response => response.text());
        match = text.match(jwt) || text.match(publishable);
      }
    }
    window.__OH_ANON_KEY__ = match?.[0] || '';
    return window.__OH_ANON_KEY__;
    })();
    anonKey = await window.__OH_ANON_KEY_PROMISE__;
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
    const response = await nativeFetch(`${API}${path}`, Object.assign({ cache: 'no-store' }, options, { headers }));
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

  function readPendingDraft() {
    try {
      const value = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (!value || !Array.isArray(value.titles) || Date.now() - Number(value.at || 0) > 300000) {
        sessionStorage.removeItem(DRAFT_KEY);
        return null;
      }
      return value;
    } catch (_) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
  }

  function persistDraft(form, submitted = false) {
    if (!state.draft.length) { sessionStorage.removeItem(DRAFT_KEY); return; }
    const title = form?.querySelector('input[name="title"],input[placeholder*="needs to be done" i],input[id*="title" i]')?.value?.trim() || '';
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ titles: [...state.draft], taskTitle: title, submitted, at: Date.now() }));
  }

  function clearDraft() {
    state.draft = [];
    sessionStorage.removeItem(DRAFT_KEY);
  }

  function styles() {
    if (document.getElementById('oh-subtasks-style-v2')) return;
    document.getElementById('oh-subtasks-style')?.remove();
    const style = document.createElement('style');
    style.id = 'oh-subtasks-style-v2';
    style.textContent = `
      .oh-subtasks{box-sizing:border-box;min-width:0;max-width:100%;overflow:hidden;border:1px solid #dbe3ed;border-radius:12px;background:#fff;padding:15px;margin:0;color:#172033}
      .oh-subtasks[data-oh-subtask-detail]{width:min(100%,680px);padding:12px 13px;justify-self:start}
      .oh-subtasks[data-oh-subtask-detail] .oh-subtasks-list{max-height:280px;overflow-y:auto;overflow-x:hidden;padding-right:3px}
      .oh-subtasks[data-oh-subtask-detail] .oh-subtask-row{min-width:0;padding:7px 9px}
      .oh-subtasks h3{font-size:15px;font-weight:700;margin:0 0 4px}.oh-subtasks-help{font-size:12px;color:#64748b;margin:0 0 11px}
      .oh-subtasks-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.oh-subtasks-input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:9px 10px;background:#fff}
      .oh-subtasks-btn{border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:8px 11px;cursor:pointer;font-weight:650}.oh-subtasks-btn:disabled{opacity:.55;cursor:not-allowed}
      .oh-subtasks-list{display:grid;gap:7px;margin-top:10px}.oh-subtask-draft,.oh-subtask-row,.oh-subtask-edit{display:flex;align-items:center;gap:9px;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#f8fafc}
      .oh-subtask-draft span,.oh-subtask-row span{flex:1;min-width:0;overflow-wrap:anywhere}.oh-subtask-edit .oh-subtasks-input{flex:1;min-width:0}
      .oh-subtask-remove{border:0;background:transparent;color:#b42318;cursor:pointer;font-size:18px}.oh-subtask-row input[type=checkbox]{width:18px;height:18px;cursor:pointer;accent-color:#2563eb}
      .oh-subtask-row.is-done span{text-decoration:line-through;color:#64748b}.oh-progress-head{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin:12px 0 6px}
      .oh-progress-track{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.oh-progress-fill{height:100%;background:#2563eb;border-radius:999px;transition:width .25s ease}
      .oh-subtasks-error{font-size:12px;color:#b42318;margin-top:8px}.oh-subtasks-status{font-size:11px;color:#64748b;white-space:nowrap}
      .oh-manual-complete{margin-top:12px;padding:10px 12px;border-radius:8px;background:#f8fafc;color:#475569;font-size:13px;font-weight:650}.oh-manual-complete.is-complete{background:#ecfdf3;color:#067647}
      .oh-complete-task{margin-top:12px;background:#166534;border-color:#166534;color:#fff}.oh-completion-note{margin:10px 0 0}
      @media(max-width:600px){.oh-subtasks[data-oh-subtask-detail]{width:100%;padding:11px}.oh-subtasks-add{grid-template-columns:1fr}.oh-subtasks-btn{width:100%}.oh-subtask-edit{align-items:stretch;flex-direction:column}.oh-subtask-edit .oh-subtasks-btn{width:100%}}
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
    const title = form.querySelector('input[placeholder*="needs to be done" i],input[name="title"],input[id*="title" i]');
    const textarea = form.querySelector('textarea');
    let node = title?.parentElement;
    while (node && node.parentElement !== form) {
      if (textarea && node.contains(textarea)) break;
      if (/border|rounded-xl|shadow|card/.test(String(node.className || '')) && node.querySelector('textarea')) break;
      node = node.parentElement;
    }
    return node && node !== form ? node : title?.closest('section,[class*="border"],[class*="rounded-xl"]') || title?.closest('label')?.parentElement || form.firstElementChild;
  }

  function placeAfterTaskDetails(form, section) {
    const card = taskDetailsCard(form);
    if (card && card !== form) card.insertAdjacentElement('afterend', section);
    else form.prepend(section);
  }

  function draftSection(form) {
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
      persistDraft(form, false);
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
      persistDraft(form, false);
      paint();
    };
    paint();
    return section;
  }

  function enhanceCreateTask() {
    if (!isCreatePage()) return;
    const title = document.querySelector('input[placeholder*="needs to be done" i],input[name="title"],input[id*="title" i]');
    const form = title?.closest('form') || document.querySelector('main form');
    if (!form) return;
    if (!state.draft.length) {
      const pending = readPendingDraft();
      if (pending && !pending.submitted) state.draft = [...pending.titles];
    }
    if (!form.dataset.ohSubtaskSubmitBound) {
      form.dataset.ohSubtaskSubmitBound = '1';
      form.addEventListener('submit', () => persistDraft(form, true));
      const submit = form.querySelector('button[type="submit"],input[type="submit"]');
      submit?.addEventListener('click', () => persistDraft(form, true), true);
    }
    if (form.querySelector('[data-oh-subtask-draft]')) return;
    placeAfterTaskDetails(form, draftSection(form));
  }

  async function saveDraft(taskId, titles = state.draft) {
    if (!taskId || !titles.length) return;
    const current = session();
    const existing = await api(`/rest/v1/task_subtasks?task_id=eq.${encodeURIComponent(taskId)}&select=title,position`);
    const have = new Set((existing || []).map(row => String(row.title || '').trim().toLowerCase()));
    const missing = titles.filter(title => !have.has(String(title).trim().toLowerCase()));
    if (missing.length) {
      const base = (existing || []).reduce((max, row) => Math.max(max, Number(row.position) || 0), -1) + 1;
      const rows = missing.map((title, index) => ({ task_id: taskId, title, position: base + index, created_by: current.user.id }));
      await api('/rest/v1/task_subtasks', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rows) });
    }
    clearDraft();
  }

  async function flushPendingDraft(taskId) {
    const pending = readPendingDraft();
    if (!pending?.submitted || !pending.titles.length || state.pendingFlush) return false;
    state.pendingFlush = true;
    try {
      const tasks = await api(`/rest/v1/tasks?id=eq.${encodeURIComponent(taskId)}&select=id,title,created_by,created_at`);
      const task = tasks?.[0];
      const current = session();
      if (!task || task.created_by !== current?.user?.id) return false;
      if (pending.taskTitle && String(task.title || '').trim() !== pending.taskTitle) return false;
      state.draft = [...pending.titles];
      await saveDraft(taskId, pending.titles);
      state.detailTaskId = '';
      return true;
    } catch (error) {
      console.error('OfficeHub pending subtasks', error);
      return false;
    } finally {
      state.pendingFlush = false;
    }
  }

  function automaticProgress(rows) {
    const done = rows.filter(row => row.is_completed).length;
    return { done, percent: rows.length ? Math.round(done * 100 / rows.length) : 0 };
  }

  function syncVisibleTaskState(task, rows) {
    if (!task) return;
    const main = document.querySelector('main');
    if (!main) return;
    const { percent } = automaticProgress(rows || []);
    if (task.status === 'completed') {
      for (const node of main.querySelectorAll('span,p,div')) {
        if (node.children.length || !/^(in progress|assigned|pending)$/i.test(node.textContent?.trim() || '')) continue;
        node.textContent = 'Completed';
        node.style.color = '#067647';
        node.style.backgroundColor = '#ecfdf3';
        node.style.borderColor = '#abefc6';
      }
    }
    if (rows?.length) {
      const progressLabel = [...main.querySelectorAll('span,h2,h3,p')].find(node => node.textContent?.trim().toLowerCase() === 'task progress');
      const progressCard = progressLabel?.closest('section,[class*="border"],[class*="rounded"]') || progressLabel?.parentElement?.parentElement;
      if (progressCard) {
        for (const node of progressCard.querySelectorAll('span,strong,p')) {
          if (node.children.length === 0 && /^\d{1,3}%$/.test(node.textContent?.trim() || '')) node.textContent = `${percent}%`;
        }
      }
    }
  }

  function setManualProgressVisibility(hasSubtasks) {
    const range = document.querySelector('input[aria-label="Task progress percentage"]');
    const wrapper = range?.closest('div.flex');
    if (!wrapper) return;
    if (!wrapper.dataset.ohOriginalDisplay) wrapper.dataset.ohOriginalDisplay = wrapper.style.display || 'flex';
    wrapper.style.display = hasSubtasks ? 'none' : wrapper.dataset.ohOriginalDisplay;
    wrapper.dataset.ohSubtaskControlled = hasSubtasks ? '1' : '0';
  }

  function detailSection(taskId, rows, task) {
    const section = document.createElement('section');
    section.className = 'oh-subtasks';
    section.dataset.ohSubtaskDetail = taskId;
    const { done, percent } = automaticProgress(rows);
    const isCompleted = task?.status === 'completed';
    const manual = !rows.length
      ? (isCompleted
        ? '<div class="oh-manual-complete is-complete">✓ Task completed</div>'
        : '<button type="button" class="oh-subtasks-btn oh-complete-task" data-complete-task>Mark task as completed</button>')
      : (percent === 100 ? '<div class="oh-manual-complete is-complete">✓ All subtasks completed — task completed automatically</div>' : '<p class="oh-subtasks-help oh-completion-note">Complete every subtask to finish this task automatically.</p>');
    section.innerHTML = `<h3>Subtasks</h3><p class="oh-subtasks-help">Check each item when it is complete. Task progress updates automatically.</p>${rows.length ? `<div class="oh-progress-head"><span>${done} of ${rows.length} completed</span><strong>${percent}%</strong></div><div class="oh-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="oh-progress-fill" style="width:${percent}%"></div></div>` : ''}<div class="oh-subtasks-list">${rows.map(row => `<label class="oh-subtask-row${row.is_completed ? ' is-done' : ''}"><input type="checkbox" data-subtask="${row.id}"${row.is_completed ? ' checked' : ''}><span>${esc(row.title)}</span></label>`).join('') || '<p class="oh-subtasks-help">No subtasks were added to this task.</p>'}</div>${manual}<div class="oh-subtasks-error"></div>`;
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
        await loadDetail(taskId, true);
      } catch (error) {
        input.checked = !completed;
        input.disabled = false;
        section.querySelector('.oh-subtasks-error').textContent = error.message;
      }
    };
    const completeButton = section.querySelector('[data-complete-task]');
    if (completeButton) completeButton.onclick = async () => {
      completeButton.disabled = true;
      completeButton.textContent = 'Completing…';
      section.querySelector('.oh-subtasks-error').textContent = '';
      try {
        await api('/rest/v1/rpc/complete_task_manually', {
          method: 'POST', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ p_task_id: taskId })
        });
        await loadDetail(taskId, true);
      } catch (error) {
        completeButton.disabled = false;
        completeButton.textContent = 'Mark task as completed';
        section.querySelector('.oh-subtasks-error').textContent = error.message;
      }
    };
    return section;
  }

  function placeDetail(section) {
    const main = document.querySelector('main');
    if (!main) return;
    const detailsLabel = [...main.querySelectorAll('h1,h2,h3,h4')].find(node => /^(task details|details|description)$/i.test(node.textContent?.trim() || ''));
    if (detailsLabel) {
      let card = detailsLabel;
      while (card.parentElement && card.parentElement !== main) {
        card = card.parentElement;
        if (/border|rounded-xl|shadow/.test(card.className || '')) break;
      }
      if (card.parentElement) { card.insertAdjacentElement('afterend', section); return; }
    }
    const progressLabel = [...main.querySelectorAll('span,h2,h3,p')].find(node => node.textContent?.trim().toLowerCase() === 'task progress');
    if (progressLabel) {
      let card = progressLabel;
      while (card.parentElement && card.parentElement !== main) {
        card = card.parentElement;
        if (/border|rounded-xl|shadow/.test(card.className || '')) break;
      }
      if (card.parentElement) { card.insertAdjacentElement('afterend', section); return; }
    }
    const host = main.querySelector('.space-y-6') || main;
    const cards = [...host.children].filter(node => node.matches?.('section,[class*="border"],[class*="rounded"]'));
    const anchor = cards[0] || host.children[1] || host.firstElementChild;
    if (anchor) anchor.insertAdjacentElement('afterend', section);
    else host.appendChild(section);
  }

  async function loadDetail(taskId, force = false) {
    if (!taskId || isEditPage()) return;
    if (!force && state.detailTaskId === taskId && document.querySelector(`[data-oh-subtask-detail="${taskId}"]`)) {
      setManualProgressVisibility(state.detailRows.length > 0);
      syncVisibleTaskState(state.detailTask, state.detailRows);
      return;
    }
    if (state.detailLoading) return;
    state.detailLoading = true;
    if (!document.querySelector(`[data-oh-subtask-detail="${taskId}"]`)) {
      const loading = document.createElement('section');
      loading.className = 'oh-subtasks'; loading.dataset.ohSubtaskDetail = taskId;
      loading.innerHTML = '<h3>Subtasks</h3><p class="oh-subtasks-help">Loading subtasks…</p>';
      placeDetail(loading);
    }
    try {
      const [rows, tasks] = await Promise.all([
        api(`/rest/v1/task_subtasks?task_id=eq.${encodeURIComponent(taskId)}&select=id,title,position,is_completed,completed_at&order=position.asc,created_at.asc`),
        api(`/rest/v1/tasks?id=eq.${encodeURIComponent(taskId)}&select=id,status,progress_percent,created_by`)
      ]);
      state.detailTaskId = taskId;
      state.detailRows = rows || [];
      state.detailTask = tasks?.[0] || null;
      document.querySelectorAll('[data-oh-subtask-detail]').forEach(node => node.remove());
      placeDetail(detailSection(taskId, state.detailRows, state.detailTask));
      setManualProgressVisibility(state.detailRows.length > 0);
      syncVisibleTaskState(state.detailTask, state.detailRows);
    } catch (error) {
      console.error('OfficeHub subtasks', error);
      const loading = document.querySelector(`[data-oh-subtask-detail="${taskId}"]`);
      if (loading) loading.innerHTML = `<h3>Subtasks</h3><p class="oh-subtasks-error">${esc(error.message || 'Subtasks could not be loaded.')}</p><button type="button" class="oh-subtasks-btn" data-retry>Retry</button>`;
      loading?.querySelector('[data-retry]')?.addEventListener('click', () => loadDetail(taskId, true));
    } finally {
      state.detailLoading = false;
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
    const title = document.querySelector('input[name="title"],input[placeholder*="needs to be done" i],form input[type="text"]');
    const form = title?.closest('form') || document.querySelector('main form');
    if (!form) return;
    if (!force && state.editTaskId === taskId && form.querySelector(`[data-oh-subtask-edit="${taskId}"]`)) return;
    if (state.editLoading) return;
    state.editLoading = true;
    if (!form.querySelector(`[data-oh-subtask-edit="${taskId}"]`)) {
      const loading = document.createElement('section');
      loading.className = 'oh-subtasks'; loading.dataset.ohSubtaskEdit = taskId;
      loading.innerHTML = '<h3>Subtasks</h3><p class="oh-subtasks-help">Loading existing subtasks…</p>';
      placeAfterTaskDetails(form, loading);
    }
    try {
      const rows = await api(`/rest/v1/task_subtasks?task_id=eq.${encodeURIComponent(taskId)}&select=id,title,position,is_completed&order=position.asc,created_at.asc`);
      state.editTaskId = taskId;
      state.editRows = rows || [];
      document.querySelectorAll('[data-oh-subtask-edit]').forEach(node => node.remove());
      placeAfterTaskDetails(form, editSection(taskId, state.editRows));
    } catch (error) {
      console.error('OfficeHub subtask editor', error);
      const loading = form.querySelector(`[data-oh-subtask-edit="${taskId}"]`);
      if (loading) loading.innerHTML = `<h3>Subtasks</h3><p class="oh-subtasks-error">${esc(error.message || 'Subtasks could not be loaded.')}</p><button type="button" class="oh-subtasks-btn" data-retry>Retry</button>`;
      loading?.querySelector('[data-retry]')?.addEventListener('click', () => loadEdit(taskId, true));
    } finally {
      state.editLoading = false;
    }
  }

  function resetForRoute() {
    if (state.path === location.pathname) return;
    state.path = location.pathname;
    state.detailTaskId = '';
    state.editTaskId = '';
    state.detailRows = [];
    state.editRows = [];
    state.detailTask = null;
    state.detailLoading = false;
    state.editLoading = false;
    if (!isCreatePage()) {
      const pending = readPendingDraft();
      if (!pending?.submitted) clearDraft();
    }
    document.querySelectorAll('[data-oh-subtask-detail],[data-oh-subtask-draft],[data-oh-subtask-edit]').forEach(node => node.remove());
    setManualProgressVisibility(false);
  }

  function init() {
    styles();
    resetForRoute();
    enhanceCreateTask();
    if (!session()) return;
    const taskId = taskIdFromPath();
    if (isEditPage()) loadEdit(taskId);
    else if (taskId) {
      const pending = readPendingDraft();
      if (pending?.submitted && !state.pendingFlush) {
        flushPendingDraft(taskId).finally(() => loadDetail(taskId, true));
      } else loadDetail(taskId);
    }
  }

  function scheduleInit() {
    if (state.scheduled) return;
    state.scheduled = true;
    setTimeout(() => { state.scheduled = false; init(); }, 80);
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

  addEventListener('popstate', scheduleInit);
  new MutationObserver(scheduleInit).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(scheduleInit, 1200);
  init();
})();

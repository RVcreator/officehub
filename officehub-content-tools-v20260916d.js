(function () {
  'use strict';
  const PROJECT = 'wxjjrfhahxqhbixaviwm';
  const API = `https://${PROJECT}.supabase.co`;
  const state = { noticeFiles: [], projectFiles: [], recipients: new Set(), departments: [], users: [] };
  let anonKey = '';
  let enhancing = false;

  function session() {
    if (window.__OH_SESSION__?.access_token && window.__OH_SESSION__?.user?.id) return window.__OH_SESSION__;
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
    const src = new URL('/assets/v20260908e/index-CQVVn--2-oh20260903.js', location.origin).href;
    let text = await fetch(src, { cache: 'no-store' }).then(r => r.text());
    const jwt = /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/;
    const publishable = /sb_(?:publishable|anon)_[a-zA-Z0-9_-]{30,}/;
    let match = text.match(jwt) || text.match(publishable);
    if (!match) {
      const dep = text.match(/\.\/button-[a-zA-Z0-9_-]+\.js/)?.[0];
      if (dep) {
        text = await fetch(new URL(dep, src), { cache: 'no-store' }).then(r => r.text());
        match = text.match(jwt) || text.match(publishable);
      }
    }
    anonKey = match ? match[0] : '';
    return anonKey;
  }
  async function api(path, options = {}) {
    const s = session(), k = await key();
    if (!s || !k) throw new Error('Please sign in again.');
    const headers = Object.assign({ apikey: k, Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' }, options.headers || {});
    const res = await fetch(`${API}${path}`, Object.assign({}, options, { headers }));
    if (!res.ok) throw new Error((await res.text()) || 'Request failed');
    return res.status === 204 ? null : res.json();
  }
  function styles() {
    if (document.getElementById('oh-content-tools-style')) return;
    const el = document.createElement('style'); el.id = 'oh-content-tools-style';
    el.textContent = `.oh-tools{border:1px solid #dbe3ed;border-radius:14px;background:#fbfdff;padding:16px;margin:16px 0;font:inherit}.oh-tools h3{margin:0 0 5px;font-size:15px;color:#132238}.oh-help{margin:0 0 13px;color:#64748b;font-size:13px}.oh-depts{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.oh-check{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:9px;padding:9px;cursor:pointer}.oh-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.oh-user-add{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:8px;margin:12px 0}.oh-select{width:100%;border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:9px;color:#334155}.oh-btn{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:7px 11px;cursor:pointer;font-weight:600;color:#334155}.oh-count{margin-left:auto;align-self:center;color:#475569;font-size:13px}.oh-people{display:flex;gap:7px;flex-wrap:wrap;min-height:34px}.oh-chip{border:0;border-radius:999px;background:#e8f1ff;color:#174ea6;padding:6px 9px;cursor:pointer}.oh-drop{display:block;border:2px dashed #b8c7d9;border-radius:12px;background:#fff;padding:18px;text-align:center;cursor:pointer;color:#475569}.oh-drop:hover{border-color:#2f6fed;background:#f6f9ff}.oh-files{margin:9px 0 0;padding:0;list-style:none}.oh-file{display:flex;justify-content:space-between;gap:10px;padding:7px 9px;background:#f1f5f9;border-radius:8px;margin-top:5px;font-size:13px}.oh-error{color:#b42318;font-size:13px;margin-top:8px}@media(max-width:600px){.oh-user-add{grid-template-columns:1fr}}`;
    document.head.appendChild(el);
  }
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function filesBox(kind) {
    const box = document.createElement('section'); box.className = 'oh-tools'; box.dataset.oh = `${kind}-files`;
    box.innerHTML = `<h3>Attachments</h3><p class="oh-help">Add supporting files (PDF, Word, Excel, PowerPoint, images or text). Maximum 10 MB each.</p><label class="oh-drop">Drop files here or click to browse<input type="file" multiple hidden></label><ul class="oh-files"></ul><div class="oh-error"></div>`;
    const input = box.querySelector('input'), list = box.querySelector('.oh-files'), err = box.querySelector('.oh-error');
    const render = () => { const arr = state[`${kind}Files`]; list.innerHTML = arr.map((f,i)=>`<li class="oh-file"><span>${esc(f.name)} · ${(f.size/1048576).toFixed(1)} MB</span><button type="button" class="oh-btn" data-rm="${i}">Remove</button></li>`).join(''); };
    const add = xs => { err.textContent=''; for (const f of xs) f.size > 10485760 ? err.textContent=`${f.name} is larger than 10 MB.` : state[`${kind}Files`].push(f); render(); };
    input.addEventListener('change',()=>add(input.files)); box.addEventListener('click',e=>{if(e.target.dataset.rm!==undefined){state[`${kind}Files`].splice(+e.target.dataset.rm,1);render();}});
    const drop=box.querySelector('.oh-drop'); ['dragenter','dragover'].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.style.borderColor='#2f6fed'})); drop.addEventListener('dragleave',()=>drop.style.borderColor=''); drop.addEventListener('drop',e=>{e.preventDefault();drop.style.borderColor='';add(e.dataTransfer.files)});
    return box;
  }
  async function recipientBox() {
    const box=document.createElement('section'); box.className='oh-tools'; box.dataset.oh='notice-recipients'; box.innerHTML='<h3>Notice recipients</h3><p class="oh-help">Select a department to include its users, or add individual people below.</p><div class="oh-depts">Loading departments…</div><div class="oh-user-add"><select class="oh-select" data-user-picker aria-label="Add individual user"><option value="">Choose a person…</option></select><button type="button" class="oh-btn" data-add-user>Add user</button></div><div class="oh-actions"><button type="button" class="oh-btn" data-all>Select all users</button><button type="button" class="oh-btn" data-clear>Clear selection</button><span class="oh-count">0 people selected</span></div><div class="oh-people"></div><div class="oh-error"></div>';
    box.hidden = true;
    try {
      const [deps, memberships, profiles] = await Promise.all([api('/rest/v1/departments?select=id,name&is_active=eq.true&order=name'),api('/rest/v1/user_departments?select=user_id,department_id'),api('/rest/v1/profiles?select=id,full_name,display_name,email&order=full_name')]);
      state.departments=deps; state.users=profiles.map(u=>Object.assign(u,{departmentIds:memberships.filter(m=>m.user_id===u.id).map(m=>m.department_id)}));
      box.querySelector('.oh-depts').innerHTML=deps.map(d=>`<label class="oh-check"><input type="checkbox" value="${d.id}"><span>${esc(d.name)}</span></label>`).join('');
      const picker=box.querySelector('[data-user-picker]');
      picker.insertAdjacentHTML('beforeend',state.users.map(u=>`<option value="${u.id}">${esc(u.display_name||u.full_name||u.email||'Unnamed user')}</option>`).join(''));
      const paint=()=>{const chosen=state.users.filter(u=>state.recipients.has(u.id));box.querySelector('.oh-count').textContent=`${chosen.length} ${chosen.length===1?'person':'people'} selected`;box.querySelector('.oh-people').innerHTML=chosen.map(u=>`<button type="button" class="oh-chip" data-user="${u.id}" title="Remove">${esc(u.display_name||u.full_name||u.email)} ×</button>`).join('')||'<span class="oh-help">No specific people selected.</span>';};
      const addPicked=()=>{if(!picker.value)return;state.recipients.add(picker.value);picker.value='';paint();};
      box.querySelector('[data-add-user]').onclick=addPicked;
      picker.addEventListener('change',addPicked);
      box.querySelector('.oh-depts').addEventListener('change',e=>{const id=e.target.value;state.users.filter(u=>u.departmentIds.includes(id)).forEach(u=>e.target.checked?state.recipients.add(u.id):state.recipients.delete(u.id));paint();});
      box.querySelector('[data-all]').onclick=()=>{state.users.forEach(u=>state.recipients.add(u.id));paint()}; box.querySelector('[data-clear]').onclick=()=>{state.recipients.clear();box.querySelectorAll('.oh-depts input').forEach(i=>i.checked=false);paint()}; box.querySelector('.oh-people').onclick=e=>{if(e.target.dataset.user){state.recipients.delete(e.target.dataset.user);paint()}}; paint();
    } catch(e) { box.querySelector('.oh-depts').textContent=''; box.querySelector('.oh-error').textContent=e.message; }
    return box;
  }
  function syncNoticeRecipientVisibility(form) {
    const box = form.querySelector('[data-oh="notice-recipients"]');
    if (!box) return;
    const audience = [...form.querySelectorAll('button,[role="combobox"]')]
      .find(node => /all staff|specific recipients|specific department|specific role/i.test(node.textContent || ''));
    const specific = /specific recipients|specific department/i.test(audience?.textContent || '');
    box.hidden = !specific;
    if (!specific) {
      const checked = [...box.querySelectorAll('.oh-depts input')].some(input => input.checked);
      if (state.recipients.size || checked) {
        state.recipients.clear();
        box.querySelectorAll('.oh-depts input').forEach(input => { input.checked = false; });
        box.querySelector('.oh-count').textContent = '0 people selected';
        box.querySelector('.oh-people').innerHTML = '<span class="oh-help">No specific people selected.</span>';
      }
    }
    for (const label of form.querySelectorAll('label')) {
      if (/^(department|role)\s*\*?$/i.test(label.textContent?.trim() || '')) {
        const wrapper = label.parentElement;
        if (wrapper && !wrapper.closest('[data-oh="notice-recipients"]')) wrapper.style.display = 'none';
      }
    }
  }
  function target(form) { return form.querySelector('button[type="submit"],input[type="submit"]')?.parentElement || form.lastElementChild || form; }
  async function enhance() {
    if (enhancing) return;
    if (!session()) return;
    enhancing = true;
    try {
      styles(); const path=location.pathname.toLowerCase();
      for(const form of document.querySelectorAll('form')){
        const text=form.innerText.toLowerCase();
        if((path.includes('notice')||path.includes('announcement'))&&!form.querySelector('[data-oh="notice-files"]')){
          form.dataset.ohEnhancing='1';
          const r=await recipientBox();
          target(form).before(r);
          target(form).before(filesBox('notice'));
          form.addEventListener('click',()=>setTimeout(()=>syncNoticeRecipientVisibility(form),0));
          syncNoticeRecipientVisibility(form);
          delete form.dataset.ohEnhancing;
        }
        if(path.includes('notice')||path.includes('announcement'))syncNoticeRecipientVisibility(form);
        if(path.includes('project')&&!text.includes('search')&&!form.querySelector('[data-oh="project-files"]'))target(form).before(filesBox('project'));
      }
    } finally {
      enhancing = false;
    }
  }
  async function uploadFiles(kind,id,files){const s=session(),k=await key();for(const file of files){const clean=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${s.user.id}/${kind}s/${id}/${Date.now()}-${clean}`;const up=await fetch(`${API}/storage/v1/object/content-attachments/${path}`,{method:'POST',headers:{apikey:k,Authorization:`Bearer ${s.access_token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});if(!up.ok)throw new Error(await up.text());await api(`/rest/v1/${kind==='notice'?'announcement':'project'}_attachments`,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({[kind==='notice'?'announcement_id':'project_id']:id,file_name:file.name,storage_path:path,mime_type:file.type,file_size:file.size,created_by:s.user.id})});}}
  const nativeFetch=window.fetch.bind(window); window.fetch=async function(input,init){let url=typeof input==='string'?input:input.url;let method=(init?.method||(typeof input!=='string'&&input.method)||'GET').toUpperCase();let next=init;const contentMatch=url.match(/\/rest\/v1\/(announcements|projects)(\?|$)/);if(method==='POST'&&contentMatch){const headers=new Headers(init?.headers||(typeof input!=='string'&&input.headers)||{});headers.set('Prefer','return=representation');next=Object.assign({},init,{headers});if(contentMatch[1]==='announcements'&&typeof next.body==='string'){try{const parsed=JSON.parse(next.body);const rows=Array.isArray(parsed)?parsed:[parsed];for(const row of rows){if(row?.audience==='department'){row.target_department_id=null;row.target_role_id=null;}if(row?.audience==='all_staff')state.recipients.clear();}next.body=JSON.stringify(Array.isArray(parsed)?rows:rows[0]);}catch(_){}}}const res=await nativeFetch(input,next);if(res.ok&&method==='POST'&&contentMatch){try{const rows=await res.clone().json();const row=Array.isArray(rows)?rows[0]:rows;if(row?.id){if(contentMatch[1]==='announcements'){const s=session();if(state.recipients.size)await api('/rest/v1/announcement_recipients',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify([...state.recipients].map(user_id=>({announcement_id:row.id,user_id,created_by:s.user.id})))});await uploadFiles('notice',row.id,state.noticeFiles);state.recipients.clear();state.noticeFiles=[];}else{await uploadFiles('project',row.id,state.projectFiles);state.projectFiles=[];}}}catch(e){console.error('OfficeHub attachments:',e);}}return res;};
  new MutationObserver(()=>enhance()).observe(document.documentElement,{childList:true,subtree:true});addEventListener('popstate',enhance);setInterval(enhance,1800);enhance();
})();

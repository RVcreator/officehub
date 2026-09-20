(function(){
'use strict';
const RELEASE='20260917e',PROJECT='wxjjrfhahxqhbixaviwm',API=`https://${PROJECT}.supabase.co`,previousFetch=window.fetch.bind(window),originalScrollIntoView=Element.prototype.scrollIntoView;
let anonKey='',groupTimer=0;
function getSession(){
  if(window.__OH_SESSION__?.access_token&&window.__OH_SESSION__?.user?.id)return window.__OH_SESSION__;
  const preferred=['auth-token-wipahs-officehub',`sb-${PROJECT}-auth-token`],keys=[...new Set([...preferred,...Object.keys(localStorage).filter(k=>/auth-token|supabase/i.test(k))])];
  for(const name of keys){try{const value=JSON.parse(localStorage.getItem(name)||'null'),choices=[value,value?.currentSession,value?.session,value?.data?.session,value?.state?.session,value?.state?.currentSession,value?.currentSession?.session];for(const item of choices)if(item?.access_token&&item?.user?.id)return item}catch(_){}}
  return null;
}
async function getAnonKey(){
  if(anonKey)return anonKey;
  const src=new URL('/assets/v20260908e/index-CQVVn--2-oh20260903.js',location.origin).href,jwt=/eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/,publishable=/sb_(?:publishable|anon)_[a-zA-Z0-9_-]{30,}/;
  let text=await previousFetch(src,{cache:'no-store'}).then(r=>r.text()),match=text.match(jwt)||text.match(publishable);
  if(!match){const dep=text.match(/\.\/button-[a-zA-Z0-9_-]+\.js/)?.[0];if(dep){text=await previousFetch(new URL(dep,src),{cache:'no-store'}).then(r=>r.text());match=text.match(jwt)||text.match(publishable)}}
  return anonKey=match?.[0]||'';
}
function isMyWork(){return /(^|\/)tasks\/my-work\/?$/i.test(location.pathname)}
async function addPersonalAssignments(url,response){
  if(!response.ok||!isMyWork())return response;
  let parsed;try{parsed=new URL(url,location.origin)}catch(_){return response}
  if(!/\/rest\/v1\/task_assignments$/.test(parsed.pathname))return response;
  const select=parsed.searchParams.get('select')||'',userFilter=parsed.searchParams.get('user_id')||'',type=parsed.searchParams.get('assignment_type')||'';
  if(!/(^|,)task_id(,|$)/.test(select)||!userFilter.startsWith('eq.')||(type&&type!=='eq.responsible'))return response;
  const userId=userFilter.slice(3),session=getSession(),key=await getAnonKey();
  if(!session||!key||session.user.id!==userId)return response;
  try{
    const assigned=await response.clone().json(),headers={apikey:key,Authorization:`Bearer ${session.access_token}`},personalUrl=`${API}/rest/v1/tasks?select=id&created_by=eq.${encodeURIComponent(userId)}`,personalResponse=await previousFetch(personalUrl,{headers,cache:'no-store'});
    if(!personalResponse.ok)return response;
    const created=await personalResponse.json(),createdIds=(Array.isArray(created)?created:[]).map(task=>task?.id).filter(Boolean);
    if(!createdIds.length)return response;
    const assignmentUrl=`${API}/rest/v1/task_assignments?select=task_id,user_id&assignment_type=eq.responsible&removed_at=is.null&task_id=in.(${createdIds.map(encodeURIComponent).join(',')})`,assignmentResponse=await previousFetch(assignmentUrl,{headers,cache:'no-store'});
    if(!assignmentResponse.ok)return response;
    const responsibleRows=await assignmentResponse.json(),responsibleByTask=new Map();
    for(const row of Array.isArray(responsibleRows)?responsibleRows:[])if(row?.task_id)responsibleByTask.set(row.task_id,row.user_id);
    const merged=Array.isArray(assigned)?assigned.slice():[],seen=new Set(merged.map(row=>row.task_id));
    for(const taskId of createdIds){const responsibleId=responsibleByTask.get(taskId);if((!responsibleId||responsibleId===userId)&&!seen.has(taskId)){seen.add(taskId);merged.push({task_id:taskId})}}
    const responseHeaders=new Headers(response.headers);responseHeaders.delete('content-length');responseHeaders.delete('content-encoding');
    return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers:responseHeaders});
  }catch(error){console.error('OfficeHub personal task merge',error);return response}
}
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:input?.url||String(input),method=(init?.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase(),response=await previousFetch(input,init);
  return method==='GET'?addPersonalAssignments(url,response):response;
};
function addStyles(){
  if(document.querySelector('#oh-workflow-css'))return;
  const style=document.createElement('style');style.id='oh-workflow-css';style.textContent=`
    .oh-menu-toggle{display:none;align-items:center;gap:7px;border:1px solid hsl(var(--border));background:hsl(var(--background));color:hsl(var(--foreground));border-radius:8px;padding:7px 10px;font:600 13px system-ui;cursor:pointer;white-space:nowrap}
    .oh-menu-toggle:hover{background:hsl(var(--muted))}.oh-menu-toggle:focus-visible{outline:2px solid hsl(var(--ring));outline-offset:2px}
    .oh-nav-heading{cursor:pointer!important;user-select:none;border-radius:6px;padding:6px 7px!important;margin-left:0!important;margin-right:0!important}
    .oh-nav-heading:hover{background:hsl(var(--sidebar-accent,210 40% 96%))}.oh-nav-chevron{margin-left:auto;font-size:13px;line-height:1;transition:transform .15s ease}
    .oh-nav-heading[data-oh-collapsed="1"] .oh-nav-chevron{transform:rotate(-90deg)}
    .oh-group-conversations{border-top:1px solid #e2e8f0;margin-top:8px;padding-top:8px}.oh-group-conversations>summary{color:#174ea6}
    @media(min-width:768px){.oh-menu-toggle{display:inline-flex}.oh-desktop-nav-hidden{display:none!important}}
  `;document.head.appendChild(style);
}
function desktopSidebar(){return [...document.querySelectorAll('aside')].find(a=>a.querySelector('nav a[href="/tasks/my-work"]')&&a.classList.contains('md:flex'))||null}
function setupMenuToggle(){
  const sidebar=desktopSidebar(),header=document.querySelector('header');if(!sidebar||!header)return;
  let button=header.querySelector('[data-oh-menu-toggle]');
  function paintMenu(hidden){sidebar.classList.toggle('oh-desktop-nav-hidden',hidden);const state=hidden?'1':'0';if(button.dataset.ohHidden!==state){button.dataset.ohHidden=state;button.innerHTML=hidden?'<span aria-hidden="true">☰</span><span>Show menu</span>':'<span aria-hidden="true">⟨</span><span>Full screen</span>';button.setAttribute('aria-expanded',hidden?'false':'true');button.setAttribute('aria-label',hidden?'Show navigation menu':'Hide navigation menu for full-screen view')}}
  if(!button){button=document.createElement('button');button.type='button';button.className='oh-menu-toggle';button.dataset.ohMenuToggle='1';header.insertBefore(button,header.firstChild);button.onclick=()=>{const hidden=!sidebar.classList.contains('oh-desktop-nav-hidden');localStorage.setItem('oh-desktop-nav-hidden',hidden?'1':'0');paintMenu(hidden)}}
  paintMenu(localStorage.getItem('oh-desktop-nav-hidden')==='1');setupMenuGroups(sidebar.querySelector('nav'));
}
function setupMenuGroups(nav){
  if(!nav)return;
  for(const heading of nav.querySelectorAll(':scope > p.section-label')){
    if(heading.dataset.ohGroupReady)continue;
    const name=(heading.textContent||'Section').trim(),key=`oh-nav-group-${name.toLowerCase().replace(/\W+/g,'-')}`;heading.dataset.ohGroupReady='1';heading.classList.add('oh-nav-heading');heading.setAttribute('role','button');heading.tabIndex=0;
    const chevron=document.createElement('span');chevron.className='oh-nav-chevron';chevron.textContent='▾';chevron.setAttribute('aria-hidden','true');heading.appendChild(chevron);
    const items=[];let node=heading.nextElementSibling;while(node&&!node.className.toString().includes('border-t')){items.push(node);node=node.nextElementSibling}
    const paint=collapsed=>{heading.dataset.ohCollapsed=collapsed?'1':'0';heading.setAttribute('aria-expanded',collapsed?'false':'true');items.forEach(item=>item.style.display=collapsed?'none':'');localStorage.setItem(key,collapsed?'1':'0')};
    const toggle=()=>paint(heading.dataset.ohCollapsed!=='1');heading.onclick=toggle;heading.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};paint(localStorage.getItem(key)==='1');
  }
}
function messageSidebar(){if(!/(^|\/)messages(?:\/|$)/i.test(location.pathname))return null;return [...document.querySelectorAll('main aside')].find(a=>a.querySelector('[data-oh-original-thread]')||[...a.children].some(e=>e.tagName==='BUTTON'))||null}
function enhanceGroupConversations(){
  const sidebar=messageSidebar();if(!sidebar)return;
  const originals=[...sidebar.querySelectorAll(':scope > button')].filter(button=>!button.closest('[data-oh-people]')),panel=sidebar.querySelector('[data-oh-people]');if(!panel||!originals.length)return;
  const groups=originals.map(button=>{const count=Number((button.textContent.match(/(\d+)\s+members?/i)||[])[1]||0);return{button,count,title:(button.querySelector('p')?.textContent||'Group conversation').trim(),meta:(button.querySelectorAll('p')[1]?.textContent||'').trim()}}).filter(item=>item.count>2);
  const signature=groups.map(item=>`${item.title}:${item.count}`).join('|');if(panel.dataset.ohGroups===signature)return;
  panel.dataset.ohGroups=signature;panel.querySelector('[data-oh-group-conversations]')?.remove();
  const detail=document.createElement('details');detail.className='ohx-person oh-group-conversations';detail.dataset.ohGroupConversations='1';detail.open=groups.length>0;
  const summary=document.createElement('summary');summary.textContent=`Group conversations (${groups.length})`;detail.appendChild(summary);
  if(!groups.length){const empty=document.createElement('p');empty.className='ohx-help';empty.style.margin='7px 12px';empty.textContent='No group conversations yet.';detail.appendChild(empty)}
  for(const item of groups){const proxy=document.createElement('button');proxy.type='button';proxy.className='ohx-subject';proxy.style.cssText='width:calc(100% - 12px);text-align:left;border:0;background:transparent;cursor:pointer';proxy.innerHTML=`${escapeHtml(item.title)}<small>${escapeHtml(item.meta)}</small>`;proxy.onclick=()=>item.button.click();detail.appendChild(proxy)}
  panel.insertBefore(detail,panel.children[2]||null);
}
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
Element.prototype.scrollIntoView=function(options){
  if(/(^|\/)messages(?:\/|$)/i.test(location.pathname)){
    const parent=this.parentElement,isMessageEnd=this.childElementCount===0&&parent?.matches('div.overflow-y-auto')&&parent.closest('section');
    if(isMessageEnd){parent.scrollTop=parent.scrollHeight;return}
  }
  return originalScrollIntoView.call(this,options);
};
function init(){addStyles();setupMenuToggle();clearTimeout(groupTimer);groupTimer=setTimeout(enhanceGroupConversations,80)}
addEventListener('popstate',init);setInterval(init,1200);init();
console.info(`OfficeHub workflow ${RELEASE}`);
})();

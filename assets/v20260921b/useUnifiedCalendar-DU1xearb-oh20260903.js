import{Nt as e,i as t,jt as n,mt as r}from"./button-Dy7fhsr_-oh20260903.js";
import{Ct as i}from"./index-CQVVn--2-oh20260903.js";
import{o as a}from"./meetings-BvqXm2Mh-oh20260903.js";
import{a as o,r as s}from"./calendarActivities-CFxAyXkT-oh20260903.js";
import{u as c,v as l,y as u}from"./calendarUtils-C5HCquN1-oh20260903.js";
var d=t(`flag`,[[`path`,{d:`M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528`,key:`1jaruq`}]]),f=e(n(),1);
function p(e){let t=new Date(`${e}T00:00:00+03:00`).getTime(),n=new Date(`${e}T23:59:59+03:00`).getTime();
return{starts_at:new Date(t).toISOString(),ends_at:new Date(n).toISOString()}}function m(e,t){let{status:n,due_date:r}=e;
return n===`completed`||n===`archived`?`completed`:n===`cancelled`?`other`:r<t?`overdue`:r===t?`due_today`:Math.ceil((new Date(`${r}T12:00:00Z`).getTime()-new Date(`${t}T12:00:00Z`).getTime())/864e5)<=3?`due_soon`:`upcoming`}function h(e){return{itemKey:`meeting:${e.id}`,source:`meeting`,id:e.id,title:e.title,starts_at:e.starts_at,ends_at:e.ends_at,all_day:!1,department_id:e.department_id,href:`/meetings/${e.id}`,meeting:e,status:e.status,location:e.location,virtual_link:e.virtual_link}}function g(e,t){let{starts_at:n,ends_at:r}=p(e.due_date);
return{itemKey:`task:${e.id}`,source:`task`,id:e.id,title:e.title,starts_at:n,ends_at:r,all_day:!0,department_id:e.department_id,href:`/tasks/${e.id}`,task:e,status:e.status,priority:e.priority,taskState:m(e,t)}}function _(e){let t=e.published_at??e.created_at,{starts_at:n,ends_at:r}=p(new Intl.DateTimeFormat(`en-CA`,{timeZone:`Africa/Dar_es_Salaam`,year:`numeric`,month:`2-digit`,day:`2-digit`}).format(new Date(t)));
return{itemKey:`notice:${e.id}`,source:`notice`,id:e.id,title:e.title,starts_at:n,ends_at:r,all_day:!0,department_id:e.target_department_id,href:`/notices`,notice:e}}function v(e){return{itemKey:`activity:${e.id}`,source:`activity`,id:e.id,title:e.title,starts_at:e.starts_at,ends_at:e.ends_at,all_day:e.all_day,department_id:e.department_id,href:`/calendar/activities/${e.id}`,activity:e,status:e.status,activity_type:e.activity_type,location:e.location,virtual_link:e.virtual_link}}function y(e){let t=new Set;
return e.filter(e=>!t.has(e.itemKey)&&(t.add(e.itemKey),!0))}async function b(e,t){let{data:n,error:i}=await r.from(`tasks`).select(`id, title, description, status, priority, due_date, start_date, department_id, created_by, assigned_by, department:departments!department_id(id, name, code)`).gte(`due_date`,e).lte(`due_date`,t).not(`status`,`in`,`("completed","cancelled","archived")`).order(`due_date`,{ascending:!0}).limit(500);
return{data:Array.isArray(n)?n:[],error:i}}async function x(e,t){let{data:n,error:i}=await r.from(`announcements`).select(`id, title, content, audience, target_department_id, target_role_id, requires_acknowledgement, is_published, published_at, classification, created_by, created_at, updated_at, updated_by`).eq(`is_published`,!0).gte(`published_at`,e).lte(`published_at`,t).order(`published_at`,{ascending:!0}).limit(200);
return{data:Array.isArray(n)?n:[],error:i}}function S(e,t){let n=[...e];
if(t.sources&&t.sources.length>0&&(n=n.filter(e=>t.sources.includes(e.source))),t.department_id&&t.department_id!==`all`&&(n=n.filter(e=>e.department_id===t.department_id)),t.search){let e=t.search.toLowerCase();
n=n.filter(t=>t.title.toLowerCase().includes(e))}return t.meeting_type&&t.meeting_type!==`all`&&(n=n.filter(e=>e.source!==`meeting`||e.meeting.meeting_type===t.meeting_type)),t.meeting_status&&t.meeting_status!==`all`&&(n=n.filter(e=>e.source!==`meeting`||e.status===t.meeting_status)),t.task_priority&&t.task_priority!==`all`&&(n=n.filter(e=>e.source!==`task`||e.priority===t.task_priority)),t.task_status&&t.task_status!==`all`&&(n=n.filter(e=>e.source!==`task`||e.status===t.task_status)),t.activity_type&&t.activity_type!==`all`&&(n=n.filter(e=>e.source!==`activity`||e.activity_type===t.activity_type)),t.activity_status&&t.activity_status!==`all`&&(n=n.filter(e=>e.source!==`activity`||e.status===t.activity_status)),n}
function q(e,t=8e3){return Promise.race([e,new Promise((n,r)=>setTimeout(()=>r(Error(`Calendar request timed out`)),t))])}function C(e,t,n={}){let{user:q}=i(),[o,d]=(0,f.useState)([]),[p,m]=(0,f.useState)(!0),[C,w]=(0,f.useState)(null),T=(0,f.useRef)(0),E=c(l()),D=(0,f.useCallback)(async()=>{let i=++T.current;
m(!0),w(null);
let o=c(u(e)),l=c(u(t)),[f,p,D]=await Promise.allSettled([q(a(1,{date_from:e,date_to:t})),q(b(o,l)),q(s(e,t))]);
if(T.current!==i)return;
let O=[],k=!1,A=q?.id??``,M=f.status===`fulfilled`&&!f.value.error?(f.value.data??[]):[],P=p.status===`fulfilled`&&!p.value.error?p.value.data:[],R=D.status===`fulfilled`&&!D.value.error?D.value.data:[];
if(!A){d([]),m(!1);return}
let U=new Set,V=new Map;
if(M.length){let{data:e,error:t}=await r.from(`meeting_participants`).select(`meeting_id`).eq(`user_id`,A).in(`meeting_id`,M.map(e=>e.id));if(t)k=!0;else for(let t of e??[])U.add(t.meeting_id)}
if(P.length){let{data:e,error:t}=await r.from(`task_assignments`).select(`task_id,user_id`).eq(`assignment_type`,`responsible`).is(`removed_at`,null).in(`task_id`,P.map(e=>e.id));if(t)k=!0;else for(let t of e??[]){let e=V.get(t.task_id)||new Set;e.add(t.user_id),V.set(t.task_id,e)}}
for(let e of M)if(String(e.status||``).toLowerCase()!==`cancelled`&&(e.organizer_id===A||U.has(e.id)))O.push(h(e));
for(let e of P){let t=V.get(e.id),n=t?.has(A)||e.created_by===A&&(!t||t.size===0||t.size===1&&t.has(A));if(n)O.push(g(e,E))}
for(let e of R)if(e.organizer_id===A&&!`cancelled completed done`.split(` `).includes(String(e.status||``).toLowerCase()))O.push(v(e));
let B=S(y(O),n);B.sort((e,t)=>new Date(e.starts_at).getTime()-new Date(t.starts_at).getTime()),d(B),m(!1),k&&w(`Some personal calendar items could not be loaded. Please refresh.`)},[e,t,n.sources?.join(`,`),n.department_id,n.search,n.hide_completed_tasks,n.my_schedule,n.meeting_type,n.meeting_status,n.task_priority,n.task_status,n.activity_type,n.activity_status,q?.id]);
return(0,f.useEffect)(()=>{D()},[D]),{items:o,loading:p,error:C,refetch:D}}function w(e=8){let[t,n]=(0,f.useState)([]),[i,s]=(0,f.useState)(!0),[u,d]=(0,f.useState)(null);
return(0,f.useEffect)(()=>{let t=!1;
async function i(){s(!0);
let i=new Date().toISOString(),u=c(l()),d=new Date(Date.now()+5184e6).toISOString(),f=(()=>{let e=new Date;
return e.setDate(e.getDate()+3),e.toISOString().slice(0,10)})(),[p,m,h]=await Promise.allSettled([a(1,{date_from:i,date_to:d,status:`scheduled`}),r.from(`tasks`).select(`id, title, due_date, status, priority, location:department_id`).lte(`due_date`,f).not(`status`,`in`,`("completed","cancelled","archived")`).order(`due_date`,{ascending:!0}).limit(20),o(i,10)]);
if(t)return;
let g=[];
if(p.status===`fulfilled`&&!p.value.error)for(let t of(p.value.data??[]).slice(0,e))g.push({itemKey:`meeting:${t.id}`,source:`meeting`,id:t.id,title:t.title,starts_at:t.starts_at,href:`/meetings/${t.id}`,badge:t.meeting_type.replace(/_/g,` `),location:t.location,virtual:!!t.virtual_link});
if(m.status===`fulfilled`&&!m.value.error)for(let e of m.value.data??[]){let{starts_at:t}=(()=>{let t=new Date(`${e.due_date}T00:00:00+03:00`).getTime();
return{starts_at:new Date(t).toISOString()}})(),n=u,r=e.due_date<n?`Overdue`:e.due_date===n?`Due today`:`Due soon`;
g.push({itemKey:`task:${e.id}`,source:`task`,id:e.id,title:e.title,starts_at:t,href:`/tasks/${e.id}`,badge:r})}if(h.status===`fulfilled`&&!h.value.error)for(let e of h.value.data)g.push({itemKey:`activity:${e.id}`,source:`activity`,id:e.id,title:e.title,starts_at:e.starts_at,href:`/calendar/activities/${e.id}`,badge:e.activity_type.replace(/_/g,` `),location:e.location,virtual:!!e.virtual_link});
t||(g.sort((e,t)=>new Date(e.starts_at).getTime()-new Date(t.starts_at).getTime()),n(g.slice(0,e)),s(!1))}return i(),()=>{t=!0}},[e]),{items:t,loading:i,error:u}}export{w as n,d as r,C as t};

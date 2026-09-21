import{Nt as interop,Ot as jsxRuntime,b as fetchDepartments,dt as uploadAttachment,jt as reactModule,mt as db,p as createTask,t as Button}from"./button-Dy7fhsr_-oh20260903.js";
import{t as ArrowLeft}from"./arrow-left-9m5BVzk_-oh20260903.js";
import{Ct as useAuth,Ft as useNavigate,Lt as useSearchParams,wt as toast}from"./index-CQVVn--2-oh20260903.js";
import{i as CardTitle,n as CardContent,r as CardHeader,t as Card}from"./card-MJxuAN_1-oh20260903.js";

var React=interop(reactModule(),1),J=jsxRuntime();
const controlClass=`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring`;

function PersonList({people,selected,onToggle,exclude=[],empty=`No active people found in this department.`}){
  let available=people.filter(person=>!exclude.includes(person.id));
  if(!available.length)return J.jsx(`p`,{className:`text-xs text-muted-foreground rounded-md border border-dashed p-3`,children:empty});
  return J.jsx(`div`,{className:`max-h-52 overflow-y-auto rounded-md border divide-y`,children:available.map(person=>J.jsxs(`label`,{className:`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50`,children:[J.jsx(`input`,{type:`checkbox`,checked:selected.includes(person.id),onChange:()=>onToggle(person),className:`h-4 w-4 rounded border-input`} ),J.jsxs(`span`,{className:`min-w-0`,children:[J.jsx(`span`,{className:`block text-sm font-medium truncate`,children:person.full_name}),J.jsx(`span`,{className:`block text-xs text-muted-foreground truncate`,children:person.job_title??person.email})]})]},person.id))});
}

function CreateTaskPage(){
  let navigate=useNavigate(),[searchParams]=useSearchParams(),{user}=useAuth();
  let[departments,setDepartments]=React.useState([]),[taskPeople,setTaskPeople]=React.useState([]),[observerPeople,setObserverPeople]=React.useState([]),[loadingPeople,setLoadingPeople]=React.useState(false),[submitting,setSubmitting]=React.useState(false),[attachments,setAttachments]=React.useState([]);
  let[form,setForm]=React.useState({title:``,description:``,priority:`normal`,category:``,department_id:searchParams.get(`dept`)??``,responsible_id:``,collaborator_ids:[],observer_department_id:``,observer_ids:[],start_date:``,due_date:``});
  let today=new Date().toISOString().split(`T`)[0];

  React.useEffect(()=>{fetchDepartments().then(({data})=>setDepartments(Array.isArray(data)?data:[]))},[]);
  React.useEffect(()=>{
    if(!form.department_id){setTaskPeople([]);return}
    setLoadingPeople(true);
    db.rpc(`get_department_people`,{p_department_id:form.department_id}).then(({data,error})=>{setTaskPeople(Array.isArray(data)?data:[]);setLoadingPeople(false);if(error)toast.error(`Could not load department members`)});
  },[form.department_id]);
  React.useEffect(()=>{
    if(!form.observer_department_id){setObserverPeople([]);return}
    db.rpc(`get_department_people`,{p_department_id:form.observer_department_id}).then(({data,error})=>{setObserverPeople(Array.isArray(data)?data:[]);if(error)toast.error(`Could not load observers`)});
  },[form.observer_department_id]);

  let set=(key,value)=>setForm(current=>({...current,[key]:value}));
  let toggle=(key,person)=>setForm(current=>({...current,[key]:current[key].includes(person.id)?current[key].filter(id=>id!==person.id):[...current[key],person.id]}));

  async function submit(event){
    event.preventDefault();
    if(!form.title.trim()){toast.error(`Task title is required`);return}
    if(!form.department_id){toast.error(`Please choose a department`);return}
    if(!form.responsible_id){toast.error(`Please choose the person responsible for this task`);return}
    if(!form.due_date){toast.error(`Due date is required`);return}
    if(form.start_date&&form.start_date>form.due_date){toast.error(`Start date cannot be after due date`);return}
    setSubmitting(true);
    let{data,error}=await createTask({title:form.title.trim(),description:form.description.trim()||void 0,priority:form.priority,category:form.category.trim()||void 0,department_id:form.department_id,due_date:form.due_date,start_date:form.start_date||void 0,responsible_id:form.responsible_id,collaborator_ids:form.collaborator_ids,observer_ids:form.observer_ids});
    if(error||!data?.task_id){toast.error(String(error??`Task could not be created`));setSubmitting(false);return}
    let uploadFailures=0;
    for(let file of attachments){let result=await uploadAttachment(data.task_id,user?.profile?.id,file);if(result.error)uploadFailures++}
    if(uploadFailures)toast.error(`${uploadFailures} attachment${uploadFailures===1?``:`s`} could not be uploaded`);else toast.success(`Task created${attachments.length?` with attachments`:``}`);
    navigate(`/tasks/${data.task_id}`);
  }

  return J.jsxs(`div`,{className:`space-y-6 max-w-4xl`,children:[
    J.jsxs(`div`,{className:`flex items-center gap-3`,children:[J.jsxs(Button,{variant:`ghost`,size:`sm`,onClick:()=>navigate(-1),className:`gap-1.5`,children:[J.jsx(ArrowLeft,{className:`h-4 w-4`}),`Back`]}),J.jsxs(`div`,{children:[J.jsx(`h1`,{className:`text-xl font-semibold`,children:`Create Task`}),J.jsx(`p`,{className:`text-sm text-muted-foreground mt-0.5`,children:`Choose a department, assign responsibility, add observers and attach files.`})]})]}),
    J.jsxs(`form`,{onSubmit:submit,className:`space-y-6`,children:[
      J.jsxs(Card,{children:[J.jsx(CardHeader,{className:`pb-3`,children:J.jsx(CardTitle,{className:`text-sm font-semibold uppercase tracking-widest text-muted-foreground`,children:`Task details`})}),J.jsxs(CardContent,{className:`space-y-4`,children:[
        J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsxs(`span`,{className:`text-sm font-medium`,children:[`Title `,J.jsx(`span`,{className:`text-red-500`,children:`*`})]}),J.jsx(`input`,{className:controlClass,value:form.title,onChange:e=>set(`title`,e.target.value),placeholder:`What needs to be done?`})]}),
        J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsx(`span`,{className:`text-sm font-medium`,children:`Description`}),J.jsx(`textarea`,{className:`w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm`,value:form.description,onChange:e=>set(`description`,e.target.value),placeholder:`Provide context, instructions, or acceptance criteria…`})]}),
        J.jsxs(`div`,{className:`grid grid-cols-1 md:grid-cols-2 gap-4`,children:[J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsx(`span`,{className:`text-sm font-medium`,children:`Priority`}),J.jsxs(`select`,{className:controlClass,value:form.priority,onChange:e=>set(`priority`,e.target.value),children:[J.jsx(`option`,{value:`low`,children:`Low`}),J.jsx(`option`,{value:`normal`,children:`Normal`}),J.jsx(`option`,{value:`high`,children:`High`}),J.jsx(`option`,{value:`urgent`,children:`Urgent`})]})]}),J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsx(`span`,{className:`text-sm font-medium`,children:`Category`}),J.jsx(`input`,{className:controlClass,value:form.category,onChange:e=>set(`category`,e.target.value),placeholder:`e.g. Finance, HR, Reporting`})]})]})
      ]})]}),
      J.jsxs(Card,{children:[J.jsx(CardHeader,{className:`pb-3`,children:J.jsx(CardTitle,{className:`text-sm font-semibold uppercase tracking-widest text-muted-foreground`,children:`Schedule`})}),J.jsxs(CardContent,{className:`grid grid-cols-1 md:grid-cols-2 gap-4`,children:[J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsx(`span`,{className:`text-sm font-medium`,children:`Start date (optional)`}),J.jsx(`input`,{type:`date`,min:today,className:controlClass,value:form.start_date,onChange:e=>set(`start_date`,e.target.value)})]}),J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsxs(`span`,{className:`text-sm font-medium`,children:[`Due date `,J.jsx(`span`,{className:`text-red-500`,children:`*`})]}),J.jsx(`input`,{type:`date`,min:today,className:controlClass,value:form.due_date,onChange:e=>set(`due_date`,e.target.value)})]})]})]}),
      J.jsxs(Card,{children:[J.jsx(CardHeader,{className:`pb-3`,children:J.jsx(CardTitle,{className:`text-sm font-semibold uppercase tracking-widest text-muted-foreground`,children:`Assignment`})}),J.jsxs(CardContent,{className:`space-y-5`,children:[
        J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsxs(`span`,{className:`text-sm font-medium`,children:[`Department `,J.jsx(`span`,{className:`text-red-500`,children:`*`})]}),J.jsxs(`select`,{className:controlClass,value:form.department_id,onChange:e=>setForm(current=>({...current,department_id:e.target.value,responsible_id:``,collaborator_ids:[]})),children:[J.jsx(`option`,{value:``,children:`Choose department`}),...departments.map(dept=>J.jsx(`option`,{value:dept.id,children:dept.name},dept.id))]})]}),
        J.jsxs(`label`,{className:`block space-y-2`,children:[J.jsxs(`span`,{className:`text-sm font-medium`,children:[`Assign task to `,J.jsx(`span`,{className:`text-red-500`,children:`*`})]}),J.jsxs(`select`,{className:controlClass,value:form.responsible_id,onChange:e=>set(`responsible_id`,e.target.value),disabled:!form.department_id||loadingPeople,children:[J.jsx(`option`,{value:``,children:loadingPeople?`Loading people…`:`Choose responsible person`}),...taskPeople.map(person=>J.jsx(`option`,{value:person.id,children:`${person.full_name}${person.job_title?` — ${person.job_title}`:``}`},person.id))]})]}),
        J.jsxs(`div`,{className:`space-y-2`,children:[J.jsx(`p`,{className:`text-sm font-medium`,children:`Collaborators from this department`}),J.jsx(PersonList,{people:taskPeople,selected:form.collaborator_ids,onToggle:person=>toggle(`collaborator_ids`,person),exclude:[form.responsible_id],empty:form.department_id?`No additional members in this department.`:`Choose a department first.`})]}),
        J.jsxs(`div`,{className:`space-y-3 pt-2 border-t`,children:[J.jsx(`p`,{className:`text-sm font-medium`,children:`Observers`}),J.jsxs(`select`,{className:controlClass,value:form.observer_department_id,onChange:e=>setForm(current=>({...current,observer_department_id:e.target.value,observer_ids:[]})),children:[J.jsx(`option`,{value:``,children:`Choose observer department`}),...departments.map(dept=>J.jsx(`option`,{value:dept.id,children:dept.name},dept.id))]}),J.jsx(PersonList,{people:observerPeople,selected:form.observer_ids,onToggle:person=>toggle(`observer_ids`,person),exclude:[form.responsible_id,...form.collaborator_ids],empty:form.observer_department_id?`No active people found in this department.`:`Choose a department to see observers.`})]})
      ]})]}),
      J.jsxs(Card,{children:[J.jsx(CardHeader,{className:`pb-3`,children:J.jsx(CardTitle,{className:`text-sm font-semibold uppercase tracking-widest text-muted-foreground`,children:`Task documents`})}),J.jsxs(CardContent,{className:`space-y-2`,children:[J.jsx(`input`,{type:`file`,multiple:true,className:`block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground`,onChange:e=>setAttachments(Array.from(e.target.files??[]))}),J.jsx(`p`,{className:`text-xs text-muted-foreground`,children:`Attached files will also appear in Documents and remain visible only to the task creator and task participants.`}),attachments.length>0&&J.jsx(`ul`,{className:`text-xs text-muted-foreground list-disc pl-5`,children:attachments.map(file=>J.jsx(`li`,{children:file.name},`${file.name}-${file.size}`))})]})]}),
      J.jsxs(`div`,{className:`flex gap-3 justify-end`,children:[J.jsx(Button,{type:`button`,variant:`outline`,onClick:()=>navigate(-1),disabled:submitting,children:`Cancel`}),J.jsx(Button,{type:`submit`,disabled:submitting,children:submitting?`Creating and uploading…`:`Create Task`})]})
    ]})
  ]});
}

export{CreateTaskPage as default};

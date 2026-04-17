const API = "http://localhost:5000";

async function loadData(){
const g = await fetch(API+"/groups").then(r=>r.json());
const c = await fetch(API+"/chains").then(r=>r.json());

document.getElementById("totalGroups").innerText = g.length;
document.getElementById("totalChains").innerText = c.length;

showTable(c);
loadFilter(g);
}

function showTable(data){
const table=document.getElementById("table");
table.innerHTML="";

data.forEach((x,i)=>{
table.innerHTML+=`
<tr>
<td>${i+1}</td>
<td>${x.group_name}</td>
<td>${x.company_name}</td>
<td>${x.gstn_no}</td>
<td><button class="btn edit" onclick="edit(${x.chain_id},'${x.company_name}','${x.gstn_no}')">Edit</button></td>
<td><button class="btn delete" onclick="del(${x.chain_id})">Delete</button></td>
</tr>`;
});
}

async function edit(id,name,gst){
const n=prompt("Company",name);
const g=prompt("GST",gst);

await fetch(API+"/chains/"+id,{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({company_name:n,gstn_no:g})
});

loadData();
}

async function del(id){
await fetch(API+"/chains/"+id+"/delete",{method:"PATCH"});
loadData();
}

function loadFilter(groups){
const f=document.getElementById("groupFilter");
f.innerHTML="";
groups.forEach(g=>{
if(g.is_active){
f.innerHTML+=`<a onclick="filter('${g.group_name}')">${g.group_name}</a>`;
}
});
}

async function filter(name){
const data=await fetch(API+"/chains").then(r=>r.json());
showTable(data.filter(x=>x.group_name===name));
}

async function addGroup(){
const name=prompt("Group Name");

await fetch(API+"/groups",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({group_name:name})
});

loadData();
}

loadData();
const byId = id => document.getElementById(id);
const loginPanel = byId("loginPanel"), dashboard = byId("dashboard"), statusPill = byId("adminStatus");
const articleForm = byId("articleForm");
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function api(url, options={}) {
  const response = await fetch(url, { credentials:"same-origin", ...options, headers: { "Content-Type":"application/json", ...(options.headers||{}) } });
  const data = response.status === 204 ? {} : await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function showLoggedIn(value) {
  loginPanel.hidden = value; dashboard.hidden = !value;
  statusPill.textContent = value ? "● Signed in" : "● Sign in required";
  if(value) loadAdminArticles();
}
async function checkSession(){try{const data=await api("/api/admin/session");showLoggedIn(data.authenticated);}catch{showLoggedIn(false);}}
byId("loginForm").addEventListener("submit", async e=>{
  e.preventDefault(); byId("loginError").textContent="";
  const form=new FormData(e.currentTarget);
  try {await api("/api/admin/login",{method:"POST",body:JSON.stringify({username:form.get("username"),password:form.get("password")})});e.currentTarget.reset();showLoggedIn(true);}
  catch(err){byId("loginError").textContent=err.message;}
});
async function loadAdminArticles(){
  const box=byId("adminArticles");box.textContent="Loading articles…";
  try {
    const articles=await api("/api/admin/articles");
    box.innerHTML=articles.length?articles.map(a=>`<article class="admin-article"><small>${esc(a.category)} · ${a.published?"Published":"Draft"}</small><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><div class="admin-actions"><button class="small-button" data-edit="${esc(a.id)}">Edit</button><button class="small-button delete" data-delete="${esc(a.id)}">Delete</button></div></article>`).join(""):'<p class="admin-empty">No articles yet. Use the form to write your first story.</p>';
  }catch(err){box.textContent=err.message;}
}
byId("adminArticles").addEventListener("click",async e=>{
  const edit=e.target.dataset.edit, del=e.target.dataset.delete;
  if(edit){
    try{const a=(await api("/api/admin/articles")).find(item=>item.id===edit);if(!a)return;
      for(const key of ["id","title","category","author","summary","body","image"]) articleForm.elements[key].value=a[key]||"";
      articleForm.elements.published.checked=!!a.published;byId("editorHeading").textContent="Edit story";byId("editorMessage").textContent="Editing: "+a.title;window.scrollTo({top:0,behavior:"smooth"});
    }catch(err){alert(err.message);}
  }
  if(del && confirm("Delete this article permanently?")){
    try{await api("/api/admin/articles/"+encodeURIComponent(del),{method:"DELETE"});await loadAdminArticles();articleForm.reset();articleForm.elements.author.value="SPORTZONE Desk";byId("editorMessage").textContent="Article deleted.";}
    catch(err){alert(err.message);}
  }
});
articleForm.addEventListener("submit",async e=>{
  e.preventDefault();byId("editorMessage").textContent="Saving…";
  const f=new FormData(articleForm), id=f.get("id");
  const payload={title:f.get("title"),category:f.get("category"),author:f.get("author"),summary:f.get("summary"),body:f.get("body"),image:f.get("image"),published:f.get("published")==="on"};
  try{await api(id?"/api/admin/articles/"+encodeURIComponent(id):"/api/admin/articles",{method:id?"PUT":"POST",body:JSON.stringify(payload)});articleForm.reset();articleForm.elements.author.value="SPORTZONE Desk";byId("editorHeading").textContent="Write a story";byId("editorMessage").textContent="Saved successfully.";await loadAdminArticles();}
  catch(err){byId("editorMessage").textContent=err.message;}
});
byId("newArticle").addEventListener("click",()=>{articleForm.reset();articleForm.elements.author.value="SPORTZONE Desk";byId("editorHeading").textContent="Write a story";byId("editorMessage").textContent="";window.scrollTo({top:0,behavior:"smooth"});});
byId("cancelEdit").addEventListener("click",()=>{articleForm.reset();articleForm.elements.author.value="SPORTZONE Desk";byId("editorHeading").textContent="Write a story";byId("editorMessage").textContent="Form cleared.";});
byId("logout").addEventListener("click",async()=>{try{await api("/api/admin/logout",{method:"POST",body:"{}"});}finally{showLoggedIn(false);}});
checkSession();
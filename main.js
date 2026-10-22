/* واجهة أولية للتجربة فقط. البيانات تحفظ في هذا المتصفح ولا تصل إلى قاعدة بيانات بعد.
   قبل النشر العام، اربطي النموذج بـ Supabase Storage/Database واضبطي سياسات RLS.
   لا تضعي أي مفتاح سري في ملفات المتصفح. */
const form=document.querySelector("#submission-form");
const gallery=document.querySelector("#gallery-list");
const count=document.querySelector("#submission-count");
const status=document.querySelector("#form-status");
const KEY="nationalVoicesDemoSubmissions",MAX=5*1024*1024;
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
function setStatus(msg,type=""){status.textContent=msg;status.className=("form-status "+type).trim()}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){const items=load();count.textContent=items.length+" مشاركة";if(!items.length){gallery.innerHTML='<div class="empty-state"><div class="empty-icon">✧</div><h3>كوني أول من يشارك</h3><p>ستظهر المشاركات التجريبية التي أُرسلت من هذا المتصفح هنا.</p></div>';return}
gallery.innerHTML=items.map(x=>`<article class="submission-card">${x.image?`<img src="${x.image}" alt="صورة مرفقة للمشاركة">`:""}<div class="card-content"><span class="card-tag">${esc(x.category)} · ${esc(x.participant_type)}</span><h3>${esc(x.title)}</h3><p>${esc(x.message)}</p><p style="margin-top:12px;font-size:.82rem">بواسطة: ${esc(x.display_name)}${x.grade?" · "+esc(x.grade):""}</p></div></article>`).join("")}
function readImage(file){return new Promise((resolve,reject)=>{if(!file)return resolve("");if(!["image/jpeg","image/png","image/webp"].includes(file.type))return reject(Error("اختاري صورة JPG أو PNG أو WEBP."));if(file.size>MAX)return reject(Error("حجم الصورة أكبر من 5 ميغابايت."));const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error("تعذرت قراءة الصورة."));r.readAsDataURL(file)})}
form.addEventListener("submit",async e=>{e.preventDefault();setStatus("");const d=new FormData(form);try{const f=d.get("media"),image=f&&f.size?await readImage(f):"";const item={participant_type:d.get("participant_type"),display_name:d.get("display_name").trim(),grade:d.get("grade").trim(),category:d.get("category"),title:d.get("title").trim(),message:d.get("message").trim(),image,created_at:new Date().toISOString()};const items=load();items.unshift(item);localStorage.setItem(KEY,JSON.stringify(items));form.reset();render();setStatus("أُضيفت المشاركة للتجربة في هذا المتصفح فقط، ولم تُحفظ على خادم بعد.","success");document.querySelector("#gallery").scrollIntoView({behavior:"smooth"})}catch(err){setStatus(err.message||"تعذر إضافة المشاركة.","error")}});
render();

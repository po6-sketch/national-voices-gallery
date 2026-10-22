/* معرض أصوات وطنية ملهمة — Supabase Database + Storage */
const SUPABASE_URL = "https://mbabcyvrequxdxatpccq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ENF7hoLv2_NtQZ9qDXttig_y0347O1q";
const BUCKET = "national-voices-media";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const form = document.querySelector("#submission-form");
const gallery = document.querySelector("#gallery-list");
const count = document.querySelector("#submission-count");
const status = document.querySelector("#form-status");
const MAX = 5 * 1024 * 1024;

function setStatus(msg, type = "") {
  status.textContent = msg;
  status.className = ("form-status " + type).trim();
}
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function emptyState() {
  gallery.innerHTML = '<div class="empty-state"><div class="empty-icon">✧</div><h3>لا توجد مشاركات معتمدة بعد</h3><p>ستظهر المشاركات هنا بعد مراجعتها واعتمادها.</p></div>';
}
function render(items) {
  count.textContent = `${items.length} مشاركة`;
  if (!items.length) return emptyState();
  gallery.innerHTML = items.map(x => `<article class="submission-card">${x.media_url ? `<img src="${esc(x.media_url)}" alt="صورة مرفقة للمشاركة" loading="lazy">` : ""}<div class="card-content"><span class="card-tag">${esc(x.category)} · ${esc(x.participant_type)}</span><h3>${esc(x.title)}</h3><p>${esc(x.message)}</p><p style="margin-top:12px;font-size:.82rem">بواسطة: ${esc(x.display_name)}${x.grade ? " · " + esc(x.grade) : ""}</p></div></article>`).join("");
}
async function loadGallery() {
  gallery.innerHTML = '<div class="empty-state"><p>جارٍ تحميل المشاركات…</p></div>';
  const { data, error } = await db.from("submissions")
    .select("id,participant_type,display_name,grade,category,title,message,media_url,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) {
    count.textContent = "—";
    gallery.innerHTML = '<div class="empty-state"><h3>تعذر تحميل المعرض</h3><p>تحققي من إعدادات قاعدة البيانات وسياسات الوصول في Supabase.</p></div>';
    console.error("Gallery load error:", error);
    return;
  }
  render(data || []);
}
function validateImage(file) {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("اختاري صورة JPG أو PNG أو WEBP.");
  if (file.size > MAX) throw new Error("حجم الصورة أكبر من 5 ميغابايت.");
  return file;
}
async function uploadImage(file) {
  if (!file) return null;
  const ext = ({"image/jpeg":"jpg", "image/png":"png", "image/webp":"webp"})[file.type];
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw new Error("تعذر رفع الصورة إلى التخزين السحابي: " + error.message);
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setStatus("جارٍ إرسال المشاركة…");
  try {
    const d = new FormData(form);
    const file = validateImage(d.get("media") && d.get("media").size ? d.get("media") : null);
    const media_url = await uploadImage(file);
    const row = {
      participant_type: String(d.get("participant_type") || ""),
      display_name: String(d.get("display_name") || "").trim(),
      grade: String(d.get("grade") || "").trim() || null,
      category: String(d.get("category") || ""),
      title: String(d.get("title") || "").trim(),
      message: String(d.get("message") || "").trim(),
      media_url,
      status: "pending"
    };
    const { error } = await db.from("submissions").insert(row);
    if (error) throw new Error("تعذر حفظ المشاركة: " + error.message);
    form.reset();
    setStatus("وصلت مشاركتك وحُفظت سحابيًا بنجاح. ستظهر في المعرض بعد مراجعتها واعتمادها.", "success");
    await loadGallery();
  } catch (error) {
    console.error("Submission error:", error);
    setStatus(error.message || "تعذر إرسال المشاركة. تحققي من اتصال الإنترنت وإعدادات Supabase.", "error");
  } finally {
    button.disabled = false;
  }
});
loadGallery();

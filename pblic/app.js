const $ = (selector) => document.querySelector(selector);
const categoryIcons = { Football: "⚽", Ghana: "🇬🇭", Basketball: "🏀", Boxing: "🥊", Athletics: "🏃", Tennis: "🎾", "Other Sports": "🏆" };
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Latest" : date.toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" });
}
async function loadArticles() {
  const grid = $("#articleGrid"), ghana = $("#ghanaList");
  try {
    const response = await fetch("/api/articles");
    if (!response.ok) throw new Error("Could not load articles");
    const articles = await response.json();
    if (!articles.length) {
      grid.innerHTML = '<div class="empty-state">No published stories yet. Check back soon.</div>';
      ghana.innerHTML = '<p class="muted">Ghana stories will appear here as articles are published.</p>';
      return;
    }
    grid.innerHTML = articles.slice(0, 6).map(article => `
      <article class="article-card">
        <div class="article-visual">${article.image ? `<img src="${escapeHTML(article.image)}" alt="" style="width:100%;height:100%;object-fit:cover">` : (categoryIcons[article.category] || "🏆")}</div>
        <div class="article-content"><span class="category">${escapeHTML(article.category)}</span>
        <h3>${escapeHTML(article.title)}</h3><p>${escapeHTML(article.summary)}</p>
        <div class="article-meta"><span>${escapeHTML(article.author)}</span><span>${dateLabel(article.createdAt)}</span></div></div>
      </article>`).join("");
    const ghanaStories = articles.filter(a => a.category.toLowerCase() === "ghana").slice(0, 3);
    ghana.innerHTML = ghanaStories.length ? ghanaStories.map(a => `<article class="mini-story"><small>${escapeHTML(a.category)} · ${dateLabel(a.createdAt)}</small><h3>${escapeHTML(a.title)}</h3><span class="muted">${escapeHTML(a.summary)}</span></article>`).join("") : '<p class="muted">Publish an article in the “Ghana” category to feature it here.</p>';
  } catch (error) {
    grid.innerHTML = '<div class="empty-state">Stories could not load. Make sure the SPORTZONE server is running.</div>';
  }
}
async function loadExternalNews() {
  const grid = $("#externalGrid");
  grid.innerHTML = '<div class="loading">Loading external headlines…</div>';
  try {
    const response = await fetch("/api/external-news");
    if (!response.ok) throw new Error("Feed error");
    const data = await response.json();
    if (!data.items || !data.items.length) {
      grid.innerHTML = '<div class="empty-state">External headlines are temporarily unavailable. Try refreshing later.</div>';
      return;
    }
    grid.innerHTML = data.items.map(item => `<a class="external-card" href="${escapeHTML(item.link)}" target="_blank" rel="noopener noreferrer">
      <span class="external-source">${escapeHTML(item.source)}</span><h3>${escapeHTML(item.title)}</h3>
      ${item.summary ? `<p>${escapeHTML(item.summary)}</p>` : ""}
      <span class="external-date">${item.publishedAt ? dateLabel(item.publishedAt) + " · " : ""}Read at source ↗</span>
    </a>`).join("");
  } catch {
    grid.innerHTML = '<div class="empty-state">External headlines could not load. Check your connection or try again later.</div>';
  }
}
$("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(link => link.addEventListener("click", () => $("#mainNav").classList.remove("open")));
$("#refreshFeeds").addEventListener("click", loadExternalNews);
$("#year").textContent = new Date().getFullYear();
loadArticles();
loadExternalNews();

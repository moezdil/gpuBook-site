// Color mode, per-question known/review marks, group list filters, home progress and search.
// Progress lives in localStorage under "gb:<question id>".
(() => {
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;

  const mode = document.getElementById("mode");
  const isDark = () => root.dataset.mode ? root.dataset.mode === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const paintMode = () => { mode.textContent = isDark() ? "☀" : "☾"; };
  mode.onclick = () => { root.dataset.mode = isDark() ? "light" : "dark"; put("gb-mode", root.dataset.mode); paintMode(); };
  paintMode();

  // single question page: known/review marks + arrow-key navigation
  const qpage = document.querySelector(".qpage");
  if (qpage) {
    const id = qpage.dataset.id;
    const paint = () => { qpage.dataset.state = get("gb:" + id) || ""; };
    paint();
    $$(".mk", qpage).forEach(b => b.onclick = () => {
      put("gb:" + id, qpage.dataset.state === b.dataset.v ? null : b.dataset.v);
      paint();
    });
    document.addEventListener("keydown", e => {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const href = qpage.dataset[e.key === "ArrowRight" ? "next" : "prev"];
        if (href) location.href = href;
      }
    });
  }

  // group index: progress bar + filters over question rows
  const qlist = document.querySelector(".qlist");
  const bar = document.querySelector(".toolbar");
  if (qlist) {
    const rows = $$(".qrow", qlist);
    let filter = "all";
    rows.forEach(r => r.dataset.state = get("gb:" + r.dataset.id) || "");
    const refresh = () => {
      const known = rows.filter(r => r.dataset.state === "known").length;
      bar.querySelector(".count").textContent = known + " / " + rows.length;
      bar.querySelector(".progress i").style.width = (100 * known / rows.length) + "%";
      rows.forEach(r => {
        const s = r.dataset.state;
        r.hidden = filter === "review" ? s !== "review" : filter === "new" ? s === "known" : false;
      });
    };
    $$("[data-filter]", bar).forEach(b => b.onclick = () => {
      filter = b.dataset.filter;
      $$("[data-filter]", bar).forEach(x => x.setAttribute("aria-pressed", x === b));
      refresh();
    });
    refresh();
  }

  // home: known/review totals + per-group progress bars
  const stats = document.querySelector(".stats");
  if (stats) {
    let known = 0, review = 0;
    $$(".gtile[data-ids]").forEach(t => {
      const ids = t.dataset.ids.split(",");
      let k = 0;
      ids.forEach(id => {
        const s = get("gb:" + id);
        if (s === "known") k++;
        if (s === "review") review++;
      });
      known += k;
      t.querySelector(".progress i").style.width = (100 * k / ids.length) + "%";
      t.querySelector(".meta").textContent = k + " / " + ids.length + " biliyorum · known";
    });
    stats.querySelector(".s-known").textContent = known;
    stats.querySelector(".s-review").textContent = review;
  }

  // search
  const q = document.getElementById("q");
  if (q) {
    const norm = s => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
    const idx = JSON.parse(document.getElementById("idx").textContent)
      .map(r => Object.assign(r, { hay: norm([r.n, r.qtr, r.qen, r.atr, r.aen].join(" ")) }));
    const res = document.getElementById("res"), hint = document.querySelector(".hint");
    const esc = s => s.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
    const run = () => {
      const words = norm(q.value).split(/\s+/).filter(Boolean);
      const hits = words.length ? idx.filter(r => words.every(w => r.hay.includes(w))) : idx;
      hint.textContent = hits.length + " / " + idx.length + " soru · questions";
      res.innerHTML = hits.slice(0, 100).map(r =>
        `<li><a href="${r.u}"><b>${r.n}</b><span lang="tr">${esc(r.qtr)}</span><span lang="en">${esc(r.qen)}</span></a></li>`).join("");
    };
    q.value = new URLSearchParams(location.search).get("q") || "";
    q.oninput = run;
    run();
  }
})();

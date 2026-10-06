(function () {
/** 公共 UI：站点头部/底部、格式化、表格构建、折线图 */
const { t, onLang, initI18n } = window.AGUi18n;
const { isHighSchoolRecord, gradeAtDate } = window.AGUStore;

const NAV = [
  { href: "index.html", label: "nav.overview" },
  { href: "rankings.html", label: "nav.ranking" },
  { href: "best.html", label: "nav.best" },
  { href: "players.html", label: "nav.players" },
  { href: "races.html", label: "nav.races" },
  { href: "ekiden-members.html", label: "nav.ekiden" },
  { href: "records.html", label: "nav.records" },
  { href: "about.html", label: "nav.about" },
];

function mountLayout(active) {
  initI18n();
  const build = () => {
    const header = document.querySelector("[data-site-header]");
    if (header) {
      header.className = "site-header";
      header.innerHTML = `<div class="inner">
        <a class="brand" href="index.html">
          <span class="mark">青</span>
          <span>${t("brand.title")}<span class="sub">&nbsp;${t("brand.sub")}</span></span>
        </a>
        <nav class="main-nav">
          ${NAV.map((n) => `<a href="${n.href}" class="${n.href === active ? "active" : ""}">${t(n.label)}</a>`).join("")}
        </nav>
      </div>`;
    }
    const footer = document.querySelector("[data-site-footer]");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = `<div class="inner">
        <span>${t("footer.fan")} <a href="about.html">${t("footer.about")}</a></span>
        <span>${t("footer.updated")}：<span data-generated-at>—</span></span>
      </div>`;
    }
  };
  build();
  onLang(build);
}

function setGeneratedAt(text) {
  document.querySelectorAll("[data-generated-at]").forEach((el) => { el.textContent = fmtDateTime(text); });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function renderTable(container, columns, rows, { empty = t("common.empty"), onSort = null, sortState = null } = {}) {
  container.textContent = "";
  if (!rows.length) {
    container.append(el("div", { class: "empty", text: empty }));
    return;
  }
  const headCells = columns.map((c) => {
    const th = el("th", { class: c.cls || "" });
    if (c.sortKey && onSort) {
      const active = sortState && sortState.key === c.sortKey;
      th.classList.add("sortable");
      if (active) th.classList.add("sorted");
      const glyph = active ? (sortState.dir > 0 ? "▲" : "▼") : "⇅";
      th.innerHTML = esc(c.label) + `<span class="sort-ind">${glyph}</span>`;
      th.addEventListener("click", () => onSort(c.sortKey));
    } else {
      th.textContent = c.label;
    }
    return th;
  });
  const thead = el("thead", {}, [el("tr", {}, headCells)]);
  const tbody = el("tbody", {}, rows.map((row, i) => {
    if (row.__band != null) {
      return el("tr", { class: "group-band" }, [el("td", { colspan: columns.length, text: row.__band })]);
    }
    return el("tr", { class: [typeof row.__cls === "string" ? row.__cls : "", i < 3 ? "r" + (i + 1) : ""].filter(Boolean).join(" ") },
      columns.map((c) => {
        const cell = el("td", { class: c.cls || "" });
        const v = c.render ? c.render(row, i) : row[c.key];
        if (v instanceof Node) cell.append(v); else if (v != null) cell.innerHTML = String(v);
        return cell;
      }));
  }));
  const table = el("table", { class: "data" }, [thead, tbody]);
  container.append(el("div", { class: "table-wrap" }, [table]));
}

function avatarHTML(student, size = "") {
  const cls = "avatar" + (size ? " " + size : "");
  if (student && student.avatar) {
    return `<span class="${cls}"><img src="${esc(student.avatar)}" alt="${esc(student.name)}" loading="lazy"></span>`;
  }
  const initial = student && student.name ? student.name.slice(0, 1) : "?";
  return `<span class="${cls}">${esc(initial)}</span>`;
}

function studentLink(s, text) {
  return `<a href="player.html?id=${s.id}">${esc(text ?? s.name)}</a>`;
}

function fmtDate(d, withDay = null) {
  if (!d) return "—";
  const [y, m, day] = String(d).split("-");
  const show = withDay == null ? !!(day && day !== "01") : withDay;
  return `${y}/${m}${show && day ? "/" + day : ""}`;
}

function fmtDateFull(d) {
  if (!d) return "—";
  const [y, m, day] = String(d).split("-");
  return `${y}年${Number(m)}月${Number(day || 1)}日`;
}

function fmtDateCell(record, student) {
  if (isHighSchoolRecord(record, student)) {
    const real = record.competitionName === "高校時代" || record.remark === "高校時代"
      ? null : record.date;
    return `<span class="badge" title="${real ? esc(real) : "高校時代"}">${t("g.hs")}</span>`;
  }
  const g = gradeAtDate(student, record.date);
  const day = String(record.date || "").slice(8, 10);
  const exact = record.competitionId != null || (!!day && day !== "01");
  return fmtDate(record.date, exact)
    + (g ? `<span class="grade-note">（${gradeLabel(g)}）</span>` : "");
}

function gradeLabel(g) {
  if (g === 0) return t("g.hs");
  if (!g) return "—";
  return [t("g.1"), t("g.2"), t("g.3"), t("g.4")][g - 1] || g + t("common.year");
}

const REMARK_STYLES = [
  [/DNF|DNS|棄権|欠場|不出場|未出走/, "dim"],
  [/^PB$|自己ベスト|ベスト更新/i, "pb"],
  [/^SB$|シーズンベスト/i, "sb"],
  [/区間新|区間記録|大会新|優勝/, "gold"],
  [/区間賞/, "green"],
];

function remarkBadge(remark) {
  if (!remark) return "";
  const flags = String(remark).split(/[\s,、／/]+/).filter(Boolean);
  if (!flags.length) return "";
  const out = [];
  const rest = [];
  for (const f of flags) {
    const hit = REMARK_STYLES.find(([re]) => re.test(f));
    if (hit) out.push(`<span class="badge ${hit[1]}">${esc(f)}</span>`);
    else rest.push(f);
  }
  if (rest.length) out.push(`<span class="badge">${esc(rest.join(" "))}</span>`);
  return out.join(" ");
}

function medalClass(rank) {
  return rank === 1 ? "rank gold" : rank === 2 ? "rank silver" : rank === 3 ? "rank bronze" : "rank";
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

/**
 * 折线图：series = [{ name, color, points: [{x(日期), y(秒), label}] }]
 * 返回容器元素（带悬浮提示）。
 */
const CHART_COLORS = ["#0f7a52", "#b4442f", "#1f4e79", "#b8912b", "#a32a63", "#6f4fa3"];

function lineChart(series, { height = 300, valueFmt = (v) => String(v) } = {}) {
  const wrap = el("div", { class: "chart" });
  if (!series.length || series.every((s) => !s.points.length)) {
    wrap.append(el("div", { class: "chart-empty", text: t("common.empty") }));
    return wrap;
  }
  const allX = [];
  const allY = [];
  series.forEach((s) => s.points.forEach((p) => {
    allX.push(new Date(p.x).getTime());
    allY.push(p.y);
  }));
  const xMin = Math.min(...allX), xMax = Math.max(...allX);
  let yMin = Math.min(...allY), yMax = Math.max(...allY);
  if (yMax - yMin < 5) { const pad = 5; yMin -= pad; yMax += pad; } else { const pad = (yMax - yMin) * 0.08; yMin -= pad; yMax += pad; }
  if (xMax === xMin) { xMax += 86400000; }

  const W = 900, H = height;
  const padL = 46, padR = 12, padT = 10, padB = 26;
  const ix = (x) => padL + ((x - xMin) / (xMax - xMin)) * (W - padL - padR);
  const iy = (y) => padT + ((yMax - y) / (yMax - yMin)) * (H - padT - padB);

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  for (let i = 0; i <= 4; i++) {
    const yv = yMin + ((yMax - yMin) * i) / 4;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", padL); line.setAttribute("x2", W - padR);
    line.setAttribute("y1", iy(yv)); line.setAttribute("y2", iy(yv));
    line.setAttribute("class", "grid-line");
    svg.append(line);
    const txt = document.createElementNS(svgNS, "text");
    txt.setAttribute("x", padL - 6); txt.setAttribute("y", iy(yv) + 3);
    txt.setAttribute("text-anchor", "end"); txt.setAttribute("class", "axis-text");
    txt.textContent = valueFmt(yv);
    svg.append(txt);
  }
  const xTicks = 4;
  for (let i = 0; i <= xTicks; i++) {
    const xv = xMin + ((xMax - xMin) * i) / xTicks;
    const txt = document.createElementNS(svgNS, "text");
    txt.setAttribute("x", ix(xv)); txt.setAttribute("y", H - 8);
    txt.setAttribute("text-anchor", "middle"); txt.setAttribute("class", "axis-text");
    const d = new Date(xv);
    txt.textContent = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    svg.append(txt);
  }

  const tip = el("div", { class: "tip", hidden: true });

  series.forEach((s, si) => {
    if (!s.points.length) return;
    const color = s.color || CHART_COLORS[si % CHART_COLORS.length];
    const poly = document.createElementNS(svgNS, "polyline");
    poly.setAttribute("class", "series-line");
    poly.setAttribute("stroke", color);
    poly.setAttribute("points", s.points.map((p) => `${ix(new Date(p.x).getTime())},${iy(p.y)}`).join(" "));
    svg.append(poly);
    s.points.forEach((p) => {
      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", ix(new Date(p.x).getTime()));
      c.setAttribute("cy", iy(p.y));
      c.setAttribute("r", 3.5);
      c.setAttribute("fill", color);
      c.addEventListener("mousemove", (ev) => {
        tip.hidden = false;
        tip.innerHTML = `<b>${esc(s.name)}</b><br>${esc(p.x)} ${esc(valueFmt(p.y))}${p.label ? "<br>" + esc(p.label) : ""}`;
        const rect = wrap.getBoundingClientRect();
        tip.style.left = (ev.clientX - rect.left) + "px";
        tip.style.top = (ev.clientY - rect.top) + "px";
      });
      c.addEventListener("mouseleave", () => { tip.hidden = true; });
      svg.append(c);
    });
  });

  const legend = el("div", { class: "legend" });
  series.forEach((s, si) => {
    if (!s.points.length) return;
    const color = s.color || CHART_COLORS[si % CHART_COLORS.length];
    const item = el("span", { class: "item" }, [
      el("span", { class: "swatch", style: `background:${color}` }),
      esc(s.name),
    ]);
    item.addEventListener("click", () => {
      item.classList.toggle("off");
      // 简化处理：直接重绘交给调用方；这里仅做视觉开关
      const lines = svg.querySelectorAll(".series-line");
      lines[si]?.setAttribute("stroke", item.classList.contains("off") ? "transparent" : color);
    });
    legend.append(item);
  });

  wrap.append(svg, tip, legend);
  return wrap;
}

window.AGUUI = {
  mountLayout, setGeneratedAt, fmtDateTime, el, esc, renderTable,
  avatarHTML, studentLink, fmtDate, fmtDateFull, fmtDateCell,
  gradeLabel, remarkBadge, medalClass, qs, lineChart,
};
})();

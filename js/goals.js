/* ============================================================
   SEM 1 OS — goal tracking
   ============================================================ */
window.Goals = (function () {
  const S = window.Store, U = window.Utils;

  function progressPct(g) {
    return U.clamp(((g.current) / g.target) * 100, 0, 100);
  }

  function sparkline(history) {
    if (!history || history.length < 2) return "";
    const w = 120, h = 28, pad = 2;
    const vals = history.map(h => h.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = (max - min) || 1;
    const pts = vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="var(--accent-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function card(g) {
    const pct = progressPct(g);
    const reached = pct >= 100;
    return `<div class="goal-card ${reached ? "is-complete" : ""}">
      <div class="goal-top">
        <div>
          <h3>${U.escapeHTML(g.name)}</h3>
          <span class="muted small">${U.escapeHTML(g.deadline || "")}</span>
        </div>
        <div class="goal-value">${g.current}<span class="goal-target"> / ${g.target}</span></div>
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="goal-bottom">
        <span class="muted small">${reached ? "Đã đạt mục tiêu 🎉" : Math.round(pct) + "% hoàn thành"}</span>
        ${sparkline(g.history)}
      </div>
      <div class="goal-actions">
        <input type="number" step="0.1" class="goal-input" id="goal-input-${g.id}" placeholder="Cập nhật ${g.current}">
        <button class="btn btn-ghost" data-action="update-goal" data-id="${g.id}">Cập nhật</button>
      </div>
    </div>`;
  }

  function render(mountId) {
    const el = document.getElementById(mountId);
    if (!el) return;
    const goals = S.get().goals;
    el.innerHTML = goals.map(card).join("");
  }

  return { render, progressPct };
})();

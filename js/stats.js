/* ============================================================
   SEM 1 OS — analytics & heatmap
   ============================================================ */
window.Stats = (function () {
  const S = window.Store, U = window.Utils, D = window.APP_DATA;

  function scheduledMinutesByCategory() {
    const totals = {};
    D.days.forEach(d => D.schedule[d].forEach(it => {
      const [a, b] = U.parseTimeRange(it.time);
      totals[it.type] = (totals[it.type] || 0) + (b - a);
    }));
    return totals;
  }

  function weekSummary() {
    const state = S.get();
    const isoToday = U.isoDate();
    let studyHours = 0, focusMinutes = 0, tasksCompleted = 0, sessionsCompleted = 0, sessionsTotal = 0;
    let bestDay = null, bestDayScore = -1;
    const last7 = [];
    for (let i = 6; i >= 0; i--) last7.push(U.addDaysISO(isoToday, -i));

    last7.forEach(iso => {
      const log = state.dailyLog[iso];
      if (log) {
        focusMinutes += log.focusMinutes || 0;
        tasksCompleted += log.tasksDone || 0;
        sessionsCompleted += log.completedSessions || 0;
        sessionsTotal += log.totalSessions || 0;
        const score = S.dailyScore(iso);
        if (score > bestDayScore) { bestDayScore = score; bestDay = iso; }
      }
    });

    const cat = scheduledMinutesByCategory();
    studyHours = Math.round(((cat.study || 0) + (cat.school || 0)) / 60);

    // most productive time-of-day: bucket focus history by hour logged (approx: use created hour is unavailable, fallback message)
    const completionRate = sessionsTotal ? Math.round((sessionsCompleted / sessionsTotal) * 100) : 0;

    return {
      studyHours,
      focusHours: Math.round(focusMinutes / 6) / 10,
      tasksCompleted,
      completionRate,
      streak: state.streak,
      bestStreak: state.bestStreak,
      bestDay
    };
  }

  function metricCard(label, value) {
    return `<div class="metric"><b>${value}</b><p>${label}</p></div>`;
  }

  function renderSummary(mountId) {
    const w = weekSummary();
    const el = document.getElementById(mountId);
    if (!el) return;
    el.innerHTML = [
      metricCard("Giờ học theo lịch", w.studyHours + "h"),
      metricCard("Giờ tập trung (7 ngày)", w.focusHours + "h"),
      metricCard("Task hoàn thành", w.tasksCompleted),
      metricCard("Tỉ lệ hoàn thành", w.completionRate + "%"),
      metricCard("Streak hiện tại", w.streak + " ngày"),
      metricCard("Streak cao nhất", w.bestStreak + " ngày")
    ].join("");
  }

  function renderCategoryBreakdown(mountId) {
    const el = document.getElementById(mountId);
    if (!el) return;
    const cat = scheduledMinutesByCategory();
    const total = Object.values(cat).reduce((a, b) => a + b, 0) || 1;
    const order = ["study", "ielts", "school", "sport", "relax", "review"];
    el.innerHTML = order.filter(k => cat[k]).map(k => {
      const pct = Math.round((cat[k] / total) * 100);
      const meta = D.typeMeta[k];
      return `<div class="cat-row">
        <span class="cat-label">${meta.label}</span>
        <div class="cat-bar"><i style="width:${pct}%;background:${meta.color}"></i></div>
        <span class="cat-pct">${pct}%</span>
      </div>`;
    }).join("");
  }

  // 5-week contribution-style heatmap ending today
  function renderHeatmap(mountId) {
    const el = document.getElementById(mountId);
    if (!el) return;
    const isoToday = U.isoDate();
    const days = [];
    for (let i = 34; i >= 0; i--) days.push(U.addDaysISO(isoToday, -i));

    const cells = days.map(iso => {
      const score = S.dailyScore(iso);
      const level = score === 0 ? 0 : score < 25 ? 1 : score < 50 ? 2 : score < 75 ? 3 : 4;
      const isFuture = iso > isoToday;
      return `<span class="heat-cell ${isFuture ? "is-future" : ""}" data-level="${isFuture ? "" : level}" title="${iso} · ${isFuture ? "—" : score + "/100"}"></span>`;
    }).join("");

    el.innerHTML = `<div class="heatmap">${cells}</div>
      <div class="heat-legend"><span>Ít</span>
        <span class="heat-cell" data-level="0"></span><span class="heat-cell" data-level="1"></span>
        <span class="heat-cell" data-level="2"></span><span class="heat-cell" data-level="3"></span>
        <span class="heat-cell" data-level="4"></span><span>Nhiều</span></div>`;
  }

  return { renderSummary, renderCategoryBreakdown, renderHeatmap, weekSummary };
})();

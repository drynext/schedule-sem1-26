/* ============================================================
   SEM 1 OS — schedule & timeline rendering
   ============================================================ */
window.Schedule = (function () {
  const D = window.APP_DATA, U = window.Utils, S = window.Store;

  let scheduleViewDay = U.dayKeyFor(new Date());

  function setScheduleViewDay(day) { scheduleViewDay = day; }
  function getScheduleViewDay() { return scheduleViewDay; }

  function isCurrent(day, item) {
    const now = new Date();
    if (day !== U.dayKeyFor(now)) return false;
    const m = now.getHours() * 60 + now.getMinutes();
    const [a, b] = U.parseTimeRange(item.time);
    return m >= a && m < b;
  }

  function isPast(day, item) {
    const now = new Date();
    if (day !== U.dayKeyFor(now)) return day !== "" && D.days.indexOf(day) < D.days.indexOf(U.dayKeyFor(now));
    const m = now.getHours() * 60 + now.getMinutes();
    const [, b] = U.parseTimeRange(item.time);
    return m >= b;
  }

  // Returns { current: {item,index} | null, next: {item,index} | null, allDone: bool }
  function todayStatus() {
    const day = U.dayKeyFor(new Date());
    const items = D.schedule[day];
    let current = null, next = null;
    for (let i = 0; i < items.length; i++) {
      if (isCurrent(day, items[i])) current = { item: items[i], index: i };
      if (!S.isDone(day, i) && !next && !isPast(day, items[i])) next = { item: items[i], index: i };
    }
    // if current exists but somehow marked done, still show it as current-in-progress
    const doneCount = items.filter((_, i) => S.isDone(day, i)).length;
    return { day, items, current, next, allDone: doneCount === items.length };
  }

  function remainingLabel(item) {
    const now = new Date();
    const [, b] = U.parseTimeRange(item.time);
    const secs = Math.max(0, b * 60 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()));
    return U.fmtClock(secs) + " còn lại";
  }

  function minutesUntil(item) {
    const now = new Date();
    const [a] = U.parseTimeRange(item.time);
    return Math.max(0, a - (now.getHours() * 60 + now.getMinutes()));
  }

  function typeTag(type) {
    const meta = D.typeMeta[type] || { label: type, color: "var(--muted)" };
    return `<span class="tag" style="--tag-c:${meta.color}">${meta.label}</span>`;
  }

  function eventRow(day, item, i) {
    const done = S.isDone(day, i);
    const cur = isCurrent(day, item);
    const cls = ["event"];
    if (done) cls.push("is-done");
    if (cur) cls.push("is-now");
    return `<li class="${cls.join(" ")}" data-day="${U.escapeHTML(day)}" data-i="${i}">
      <button class="event-check" aria-label="${done ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}" data-action="toggle-session" data-day="${U.escapeHTML(day)}" data-i="${i}">
        ${done ? checkIcon() : ""}
      </button>
      <div class="event-time">${item.time}</div>
      <div class="event-body">
        <h3>${U.escapeHTML(item.title)}</h3>
        <p>${U.escapeHTML(item.desc)}</p>
      </div>
      ${typeTag(item.type)}
    </li>`;
  }

  function checkIcon() {
    return `<svg viewBox="0 0 20 20" width="13" height="13"><path d="M4 10.5l4 4 8-8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderTimeline(mountId, day) {
    const el = document.getElementById(mountId);
    if (!el) return;
    const items = D.schedule[day] || [];
    el.innerHTML = `<ul class="timeline">${items.map((it, i) => eventRow(day, it, i)).join("")}</ul>`;
  }

  function renderDayStrip(mountId, activeDay, onSelect) {
    const el = document.getElementById(mountId);
    if (!el) return;
    el.innerHTML = D.days.map(d => {
      const items = D.schedule[d];
      const doneCount = items.filter((_, i) => S.isDone(d, i)).length;
      const isToday = d === U.dayKeyFor(new Date());
      return `<button class="day-chip ${d === activeDay ? "is-active" : ""} ${isToday ? "is-today" : ""}" data-day="${U.escapeHTML(d)}">
        <b>${d.replace("Thứ ", "T").replace("Chủ Nhật", "CN")}</b>
        <small>${doneCount}/${items.length}</small>
      </button>`;
    }).join("");
    el.querySelectorAll(".day-chip").forEach(btn => {
      btn.addEventListener("click", () => onSelect(btn.dataset.day));
    });
  }

  return { setScheduleViewDay, getScheduleViewDay, isCurrent, isPast, todayStatus, remainingLabel, minutesUntil, renderTimeline, renderDayStrip, typeTag };
})();

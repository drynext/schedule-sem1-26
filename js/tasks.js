/* ============================================================
   SEM 1 OS — smart task system
   ============================================================ */
window.Tasks = (function () {
  const S = window.Store, U = window.Utils;
  let filter = "today";   // today | upcoming | completed | all
  let sortBy = "priority"; // priority | deadline | created

  const priorityRank = { high: 0, medium: 1, low: 2 };
  const priorityLabel = { high: "Cao", medium: "Trung bình", low: "Thấp" };
  const categoryLabel = { study: "Học tập", ielts: "IELTS", school: "Lớp học", project: "Project", other: "Khác" };

  function setFilter(f) { filter = f; }
  function getFilter() { return filter; }
  function setSort(s) { sortBy = s; }

  function visibleTasks() {
    const all = S.get().tasks;
    const todayISO = U.isoDate();
    let list = all;
    if (filter === "today") {
      list = all.filter(t => !t.done && (!t.deadline || t.deadline <= todayISO));
    } else if (filter === "upcoming") {
      list = all.filter(t => !t.done && t.deadline && t.deadline > todayISO);
    } else if (filter === "completed") {
      list = all.filter(t => t.done);
    }
    return list.slice().sort((a, b) => {
      if (sortBy === "priority") return priorityRank[a.priority] - priorityRank[b.priority];
      if (sortBy === "deadline") return (a.deadline || "9999").localeCompare(b.deadline || "9999");
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  function deadlineLabel(iso) {
    if (!iso) return "Không hạn";
    const today = U.isoDate();
    if (iso === today) return "Hôm nay";
    if (iso === U.addDaysISO(today, 1)) return "Ngày mai";
    if (iso < today) return "Quá hạn " + iso.slice(5);
    return iso.slice(5).split("-").reverse().join("/");
  }

  function taskRow(t) {
    const overdue = t.deadline && t.deadline < U.isoDate() && !t.done;
    return `<li class="task ${t.done ? "is-done" : ""} ${overdue ? "is-overdue" : ""}" data-id="${t.id}">
      <button class="task-check" data-action="toggle-task" data-id="${t.id}" aria-label="Đánh dấu hoàn thành">
        ${t.done ? '<svg viewBox="0 0 20 20" width="12" height="12"><path d="M4 10.5l4 4 8-8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}
      </button>
      <div class="task-body">
        <div class="task-title-row">
          <span class="pill pill-${t.priority}">${priorityLabel[t.priority] || t.priority}</span>
          <h4>${U.escapeHTML(t.title)}</h4>
        </div>
        <div class="task-meta">
          <span>${categoryLabel[t.category] || t.category}</span>
          <span>·</span>
          <span class="${overdue ? "overdue-text" : ""}">${deadlineLabel(t.deadline)}</span>
          <span>·</span>
          <span>${U.fmtMinutes(t.estMin)}</span>
        </div>
      </div>
      <button class="icon-btn" data-action="delete-task" data-id="${t.id}" aria-label="Xoá task">
        <svg viewBox="0 0 20 20" width="14" height="14"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </li>`;
  }

  function render(mountId, tabsId, countsId) {
    const el = document.getElementById(mountId);
    if (!el) return;
    const list = visibleTasks();
    if (list.length === 0) {
      el.innerHTML = emptyState();
    } else {
      el.innerHTML = `<ul class="task-list">${list.map(taskRow).join("")}</ul>`;
    }
    if (tabsId) {
      document.querySelectorAll(`#${tabsId} [data-filter]`).forEach(b => {
        b.classList.toggle("is-active", b.dataset.filter === filter);
      });
    }
    if (countsId) {
      const all = S.get().tasks;
      const today = U.isoDate();
      document.getElementById(countsId).innerHTML = `
        <span data-filter="today" class="count-chip">${all.filter(t => !t.done && (!t.deadline || t.deadline <= today)).length} hôm nay</span>
        <span data-filter="upcoming" class="count-chip">${all.filter(t => !t.done && t.deadline && t.deadline > today).length} sắp tới</span>
        <span data-filter="completed" class="count-chip">${all.filter(t => t.done).length} hoàn thành</span>
      `;
    }
  }

  function emptyState() {
    return `<div class="empty-state">
      <div class="empty-glyph">✓</div>
      <p><strong>Không có task nào ở mục này.</strong></p>
      <p class="muted">Thêm việc cần làm bằng ô bên dưới, hoặc nhấn <kbd>N</kbd> để tạo nhanh.</p>
    </div>`;
  }

  return { setFilter, getFilter, setSort, visibleTasks, render, priorityLabel, categoryLabel, deadlineLabel };
})();

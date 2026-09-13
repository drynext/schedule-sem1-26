/* ============================================================
   SEM 1 OS — app bootstrap & orchestration
   ============================================================ */
(function () {
  const D = window.APP_DATA, U = window.Utils, S = window.Store, Sch = window.Schedule;
  let currentView = "home";
  let suggestionCache = { key: null, text: "" };

  // ---------------- Toast ----------------
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-show"), 2200);
  }

  // ---------------- View routing ----------------
  function showView(view) {
    currentView = view;
    document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
    const target = document.getElementById("view-" + view);
    if (target) target.classList.add("is-active");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("is-active", b.dataset.view === view));
    document.querySelectorAll(".bn-btn").forEach(b => b.classList.toggle("is-active", b.dataset.view === view));

    const titles = { home: "Hôm nay", schedule: "Lịch trình", tasks: "Tasks", focus: "Focus Mode", goals: "Mục tiêu", stats: "Thống kê" };
    document.getElementById("pageTitle").textContent = titles[view] || view;

    if (view === "schedule") {
      Sch.renderDayStrip("scheduleWeekStrip", Sch.getScheduleViewDay(), (d) => { Sch.setScheduleViewDay(d); renderSchedule(); });
      Sch.renderTimeline("scheduleTimeline", Sch.getScheduleViewDay());
    }
    if (view === "tasks") renderTasks();
    if (view === "goals") window.Goals.render("goalsGrid");
    if (view === "stats") renderStats();
    if (view === "focus") renderFocusHistory();
  }

  function renderSchedule() {
    Sch.renderDayStrip("scheduleWeekStrip", Sch.getScheduleViewDay(), (d) => { Sch.setScheduleViewDay(d); renderSchedule(); });
    Sch.renderTimeline("scheduleTimeline", Sch.getScheduleViewDay());
  }

  // ---------------- Home ----------------
  function pickMicroAction(type, keySeed) {
    if (suggestionCache.key === keySeed) return suggestionCache.text;
    const pool = D.microActions[type] || ["Tập trung vào việc quan trọng nhất."];
    const text = pool[Math.floor(Math.random() * pool.length)];
    suggestionCache = { key: keySeed, text };
    return text;
  }

  function renderHome() {
    const status = Sch.todayStatus();
    const heroTag = document.getElementById("heroTag");
    const heroEyebrow = document.getElementById("heroEyebrow");
    const heroTitle = document.getElementById("heroTitle");
    const heroDesc = document.getElementById("heroDesc");
    const heroTimer = document.getElementById("heroTimer");
    const startBtn = document.getElementById("heroStartBtn");
    const doneBtn = document.getElementById("heroDoneBtn");
    const leadEl = document.getElementById("nextActionLead");
    const subEl = document.getElementById("nextActionSub");

    if (status.current) {
      const { item, index } = status.current;
      heroEyebrow.textContent = "NOW";
      heroTag.innerHTML = "";
      heroTag.outerHTML = Sch.typeTag(item.type).replace("<span", '<span id="heroTag"');
      heroTitle.textContent = item.title;
      heroDesc.textContent = item.desc;
      heroTimer.textContent = Sch.remainingLabel(item);
      startBtn.textContent = "Bắt đầu Focus";
      startBtn.disabled = false;
      startBtn.onclick = () => { window.Focus.setLabel(item.title); showView("focus"); document.getElementById("focusLabel").textContent = item.title; };
      doneBtn.textContent = S.isDone(status.day, index) ? "Đã hoàn thành ✓" : "Đánh dấu xong";
      doneBtn.onclick = () => { S.toggleSession(status.day, index); toast("Đã cập nhật buổi học"); renderAll(); };

      leadEl.textContent = `Đang trong "${item.title}".`;
      subEl.textContent = "→ " + pickMicroAction(item.type, status.day + index);
    } else if (status.next) {
      const { item, index } = status.next;
      const mins = Sch.minutesUntil(item);
      heroEyebrow.textContent = "NEXT";
      const tagFresh = Sch.typeTag(item.type).replace("<span", '<span id="heroTag"');
      heroTag.outerHTML = tagFresh;
      heroTitle.textContent = item.title;
      heroDesc.textContent = mins > 0 ? `Bắt đầu sau ${mins} phút · ${item.desc}` : item.desc;
      heroTimer.textContent = mins > 0 ? `${mins} phút nữa` : item.time;
      startBtn.textContent = "Bắt đầu sớm";
      startBtn.disabled = false;
      startBtn.onclick = () => { window.Focus.setLabel(item.title); showView("focus"); document.getElementById("focusLabel").textContent = item.title; };
      doneBtn.textContent = "Đánh dấu xong";
      doneBtn.onclick = () => { S.toggleSession(status.day, index); toast("Đã cập nhật buổi học"); renderAll(); };

      leadEl.textContent = mins > 0 ? `Còn ${mins} phút trước "${item.title}".` : `"${item.title}" sắp bắt đầu.`;
      subEl.textContent = "→ " + pickMicroAction(item.type, status.day + index);
    } else if (status.allDone) {
      heroEyebrow.textContent = "DAY COMPLETE";
      heroTag.outerHTML = '<span class="tag" id="heroTag"></span>';
      heroTitle.textContent = "Bạn đã hoàn thành lịch hôm nay 🎉";
      heroDesc.textContent = "Tận dụng thời gian rảnh để ôn goals hoặc nghỉ ngơi hợp lý.";
      heroTimer.textContent = "--:--";
      startBtn.textContent = "Mở Focus tự do";
      startBtn.disabled = false;
      startBtn.onclick = () => { window.Focus.setLabel("Free focus"); showView("focus"); document.getElementById("focusLabel").textContent = "Free focus"; };
      doneBtn.textContent = "—";
      doneBtn.onclick = null;

      leadEl.textContent = "Không còn buổi nào chưa hoàn thành hôm nay.";
      subEl.textContent = "→ Xem lại Goals hoặc chuẩn bị trước cho ngày mai.";
    } else {
      // Every remaining undone session's time window has already passed
      const missed = status.items.filter((_, i) => !S.isDone(status.day, i)).length;
      heroEyebrow.textContent = "CATCH UP";
      heroTag.outerHTML = '<span class="tag" id="heroTag"></span>';
      heroTitle.textContent = `Còn ${missed} buổi trong lịch chưa được đánh dấu`;
      heroDesc.textContent = "Xem lại timeline bên dưới và đánh dấu những buổi bạn đã hoàn thành.";
      heroTimer.textContent = "--:--";
      startBtn.textContent = "Xem lịch hôm nay";
      startBtn.disabled = false;
      startBtn.onclick = () => showView("schedule");
      doneBtn.textContent = "—";
      doneBtn.onclick = null;

      leadEl.textContent = `${missed} buổi đã qua giờ nhưng chưa được đánh dấu.`;
      subEl.textContent = "→ Cập nhật timeline để số liệu thống kê chính xác hơn.";
    }

    // progress
    const items = status.items;
    const doneCount = items.filter((_, i) => S.isDone(status.day, i)).length;
    const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
    document.getElementById("todayPct").textContent = pct + "%";
    document.getElementById("todayBar").style.width = pct + "%";
    document.getElementById("doneCount").textContent = doneCount;
    document.getElementById("totalCount").textContent = items.length;
    document.getElementById("focusTotal").textContent = U.fmtMinutes(S.totalFocusMinutes());
    document.getElementById("streakCount").textContent = S.get().streak;

    Sch.renderTimeline("homeTimeline", status.day);
    Sch.renderDayStrip("homeWeekStrip", status.day, (d) => { Sch.setScheduleViewDay(d); showView("schedule"); });
  }

  function renderLevel() {
    const info = S.xpIntoLevel();
    document.getElementById("levelLabel").textContent = "Lv " + S.level();
    document.getElementById("xpLabel").textContent = S.get().xp + " XP";
    document.getElementById("xpBar").style.width = info.pct + "%";
  }

  function renderTasks() {
    window.Tasks.render("taskList", "taskTabs", "taskCounts");
  }

  function renderStats() {
    window.Stats.renderSummary("statsSummary");
    window.Stats.renderCategoryBreakdown("statsCategory");
    window.Stats.renderHeatmap("statsHeatmap");
  }

  function renderFocusHistory() {
    const hist = S.get().focusHistory.slice(0, 12);
    const el = document.getElementById("focusHistory");
    if (!hist.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-glyph">◷</div><p><strong>Chưa có phiên focus nào.</strong></p><p class="muted">Bắt đầu một phiên để bắt đầu ghi nhận lịch sử.</p></div>`;
      return;
    }
    el.innerHTML = `<ul class="focus-history">${hist.map(f => `
      <li><span class="fh-date">${f.date.slice(5).split("-").reverse().join("/")}</span><span class="fh-label">${U.escapeHTML(f.label)}</span><span class="fh-min">${f.minutes} phút</span></li>
    `).join("")}</ul>`;
  }

  function renderAll() {
    renderHome();
    renderLevel();
    if (currentView === "schedule") renderSchedule();
    if (currentView === "tasks") renderTasks();
    if (currentView === "goals") window.Goals.render("goalsGrid");
    if (currentView === "stats") renderStats();
    if (currentView === "focus") renderFocusHistory();
  }

  // ---------------- Clock / header ----------------
  function tickClock() {
    const n = new Date();
    document.getElementById("clock").textContent = n.toLocaleTimeString("vi-VN");
    document.getElementById("dateText").textContent = n.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    document.getElementById("weekText").textContent = "Tuần " + U.weekNumber(n);
    document.getElementById("greeting").textContent = U.greeting(n);
    if (currentView === "home") renderHome();
  }

  // ---------------- Focus wiring ----------------
  function ringLength() { return 2 * Math.PI * 88; }
  function updateFocusUI(remaining, total, running) {
    document.getElementById("focusTimer").textContent = U.fmtClock(remaining);
    const ring = document.getElementById("focusRingProgress");
    const L = ringLength();
    const pct = total ? remaining / total : 0;
    ring.style.strokeDasharray = L;
    ring.style.strokeDashoffset = L * (1 - pct);
    document.getElementById("focusStartBtn").textContent = running ? "Đang chạy…" : (remaining < total ? "Tiếp tục" : "Bắt đầu");
    document.getElementById("focusStartBtn").disabled = running;
  }

  function initFocus() {
    window.Focus.onTickHandler = updateFocusUI;
    window.Focus.onStateChangeHandler = (running) => updateFocusUI(window.Focus.getRemaining(), window.Focus.getTotal(), running);
    window.Focus.onFinishHandler = (minutes, auto) => {
      toast(auto ? `Hoàn thành phiên ${minutes} phút 🎉` : `Đã lưu ${minutes} phút focus`);
      renderAll();
      renderFocusHistory();
    };
    updateFocusUI(window.Focus.getRemaining(), window.Focus.getTotal(), false);

    document.querySelectorAll("#focusPresets .chip").forEach(chip => {
      chip.addEventListener("click", () => {
        if (chip.dataset.min === "custom") {
          const val = prompt("Nhập số phút cho phiên focus tuỳ chỉnh:", "45");
          const n = parseInt(val, 10);
          if (!n || n < 1) return;
          document.querySelectorAll("#focusPresets .chip").forEach(c => c.classList.remove("is-active"));
          chip.classList.add("is-active");
          window.Focus.setPreset(n);
        } else {
          document.querySelectorAll("#focusPresets .chip").forEach(c => c.classList.remove("is-active"));
          chip.classList.add("is-active");
          window.Focus.setPreset(Number(chip.dataset.min));
        }
      });
    });

    document.getElementById("focusStartBtn").addEventListener("click", () => window.Focus.start());
    document.getElementById("focusPauseBtn").addEventListener("click", () => window.Focus.pause());
    document.getElementById("focusFinishBtn").addEventListener("click", () => window.Focus.finish(false));
  }

  // ---------------- Task form ----------------
  function initTaskForm() {
    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("taskTitle").value.trim();
      if (!title) return;
      S.addTask({
        title,
        category: document.getElementById("taskCategory").value,
        priority: document.getElementById("taskPriority").value,
        deadline: document.getElementById("taskDeadline").value,
        estMin: Number(document.getElementById("taskEst").value) || 30
      });
      e.target.reset();
      document.getElementById("taskEst").value = 30;
      renderTasks();
      renderLevel();
      toast("Đã thêm task");
    });

    document.getElementById("taskTabs").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      window.Tasks.setFilter(btn.dataset.filter);
      document.querySelectorAll("#taskTabs .tab").forEach(t => t.classList.toggle("is-active", t === btn));
      renderTasks();
    });
    document.getElementById("taskSort").addEventListener("change", (e) => { window.Tasks.setSort(e.target.value); renderTasks(); });
    document.getElementById("taskCounts").addEventListener("click", (e) => {
      const chip = e.target.closest("[data-filter]");
      if (!chip) return;
      window.Tasks.setFilter(chip.dataset.filter);
      document.querySelectorAll("#taskTabs .tab").forEach(t => t.classList.toggle("is-active", t.dataset.filter === chip.dataset.filter));
      renderTasks();
    });
  }

  // ---------------- Global click delegation (checkboxes etc) ----------------
  function initDelegation() {
    document.addEventListener("click", (e) => {
      const sessionToggle = e.target.closest('[data-action="toggle-session"]');
      if (sessionToggle) {
        S.toggleSession(sessionToggle.dataset.day, Number(sessionToggle.dataset.i));
        renderAll();
        return;
      }
      const eventRow = e.target.closest(".event");
      if (eventRow && !e.target.closest(".event-check")) {
        S.toggleSession(eventRow.dataset.day, Number(eventRow.dataset.i));
        renderAll();
        return;
      }
      const taskToggle = e.target.closest('[data-action="toggle-task"]');
      if (taskToggle) { S.toggleTaskDone(taskToggle.dataset.id); renderTasks(); renderLevel(); return; }
      const taskRow = e.target.closest(".task");
      if (taskRow && !e.target.closest(".icon-btn") && e.target.closest(".task-body")) {
        S.toggleTaskDone(taskRow.dataset.id); renderTasks(); renderLevel(); return;
      }
      const delTask = e.target.closest('[data-action="delete-task"]');
      if (delTask) { S.deleteTask(delTask.dataset.id); renderTasks(); toast("Đã xoá task"); return; }

      const updGoal = e.target.closest('[data-action="update-goal"]');
      if (updGoal) {
        const id = updGoal.dataset.id;
        const input = document.getElementById("goal-input-" + id);
        const v = parseFloat(input.value);
        if (!isNaN(v)) { S.updateGoalCurrent(id, v); window.Goals.render("goalsGrid"); toast("Đã cập nhật mục tiêu"); }
        return;
      }
    });
  }

  // ---------------- Nav wiring ----------------
  function initNav() {
    document.querySelectorAll(".nav-btn, .bn-btn").forEach(btn => {
      btn.addEventListener("click", () => showView(btn.dataset.view));
    });
    document.getElementById("openCmdBtn").addEventListener("click", () => window.Command.open());
  }

  // ---------------- Command palette commands ----------------
  function initCommands() {
    window.Command.register([
      { label: "Đi tới Hôm nay", keywords: "home today", hint: "H", run: () => showView("home") },
      { label: "Đi tới Lịch trình", keywords: "schedule", hint: "S", run: () => showView("schedule") },
      { label: "Đi tới Tasks", keywords: "tasks todo", hint: "T", run: () => showView("tasks") },
      { label: "Đi tới Focus Mode", keywords: "focus deep work", hint: "F", run: () => showView("focus") },
      { label: "Đi tới Mục tiêu", keywords: "goals", run: () => showView("goals") },
      { label: "Đi tới Thống kê", keywords: "stats analytics", run: () => showView("stats") },
      { label: "Thêm task mới", keywords: "add task new", hint: "N", run: () => { showView("tasks"); setTimeout(() => document.getElementById("taskTitle").focus(), 50); } },
      { label: "Bắt đầu Focus 25 phút", keywords: "focus 25", run: () => { showView("focus"); window.Focus.setPreset(25); window.Focus.start(); document.querySelectorAll("#focusPresets .chip").forEach(c => c.classList.toggle("is-active", c.dataset.min === "25")); } },
      { label: "Bắt đầu Focus 50 phút", keywords: "focus 50", run: () => { showView("focus"); window.Focus.setPreset(50); window.Focus.start(); document.querySelectorAll("#focusPresets .chip").forEach(c => c.classList.toggle("is-active", c.dataset.min === "50")); } },
      { label: "Bắt đầu Focus 90 phút", keywords: "focus 90", run: () => { showView("focus"); window.Focus.setPreset(90); window.Focus.start(); document.querySelectorAll("#focusPresets .chip").forEach(c => c.classList.toggle("is-active", c.dataset.min === "90")); } }
    ]);
    window.Command.init();
  }

  // ---------------- Keyboard shortcuts ----------------
  function initShortcuts() {
    document.addEventListener("keydown", (e) => {
      const inField = /input|textarea|select/i.test(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); window.Command.toggle(); return;
      }
      if (window.Command.isOpen()) return;
      if (e.key === "Escape") { document.getElementById("cmdOverlay").classList.remove("is-open"); return; }
      if (inField) return;
      switch (e.key.toLowerCase()) {
        case "h": showView("home"); break;
        case "s": showView("schedule"); break;
        case "t": showView("tasks"); break;
        case "f": showView("focus"); break;
        case "n": showView("tasks"); setTimeout(() => document.getElementById("taskTitle").focus(), 50); break;
      }
    });
  }

  // ---------------- Init ----------------
  function init() {
    S.load();
    if (S.isBroken()) toast("Không thể lưu dữ liệu — trình duyệt đang chặn localStorage.");
    initNav();
    initFocus();
    initTaskForm();
    initDelegation();
    initCommands();
    initShortcuts();

    tickClock();
    renderAll();
    setInterval(tickClock, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();

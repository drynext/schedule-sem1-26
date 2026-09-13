/* ============================================================
   SEM 1 OS — application state & persistence (localStorage)
   ============================================================ */
window.Store = (function () {
  const KEY = "sem1os:v3";
  const U = window.Utils;

  const defaults = () => ({
    doneSessions: {},        // "Thứ 2-0": true
    tasks: [],                // {id,title,category,priority,deadline,estMin,status,done,linkedDay,linkedIndex,createdAt}
    focusHistory: [],         // {id, date, label, minutes, taskId}
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastCompletedDate: null,  // last ISO date the user completed ≥1 session or focus block
    dailyLog: {},             // "2026-09-13": { completedSessions, totalSessions, focusMinutes, tasksDone }
    goals: null,              // set from APP_DATA.goals on first load
    settings: { theme: "dark" }
  });

  let state = null;
  let broken = false; // true if localStorage is unavailable

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) {
      broken = true;
      state = defaults();
    }
    if (!state.goals) state.goals = JSON.parse(JSON.stringify(window.APP_DATA.goals));
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      broken = false;
      return true;
    } catch (e) {
      broken = true;
      return false;
    }
  }

  function get() { return state; }
  function isBroken() { return broken; }

  function itemKey(day, i) { return day + "-" + i; }
  function isDone(day, i) { return !!state.doneSessions[itemKey(day, i)]; }

  function ensureDailyLog(iso) {
    if (!state.dailyLog[iso]) state.dailyLog[iso] = { completedSessions: 0, totalSessions: 0, focusMinutes: 0, tasksDone: 0 };
    return state.dailyLog[iso];
  }

  function bumpStreakOn(iso) {
    if (state.lastCompletedDate === iso) return; // already counted today
    const yesterday = U.addDaysISO(iso, -1);
    if (state.lastCompletedDate === yesterday) {
      state.streak += 1;
    } else if (state.lastCompletedDate !== iso) {
      state.streak = 1;
    }
    state.lastCompletedDate = iso;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
  }

  function addXP(n) {
    state.xp = Math.max(0, state.xp + n);
  }

  function level() {
    // simple escalating curve: level n requires 50*n(n-1)/2 xp
    let lvl = 1;
    while (state.xp >= 50 * lvl * (lvl + 1) / 2) lvl++;
    return lvl;
  }

  function xpIntoLevel() {
    const lvl = level();
    const floor = 50 * (lvl - 1) * lvl / 2;
    const ceil = 50 * lvl * (lvl + 1) / 2;
    return { floor, ceil, current: state.xp, pct: U.clamp((state.xp - floor) / (ceil - floor) * 100, 0, 100) };
  }

  // ---- Sessions ----
  function toggleSession(day, i) {
    const k = itemKey(day, i);
    const nowDone = !state.doneSessions[k];
    state.doneSessions[k] = nowDone;
    const iso = U.isoDate();
    const log = ensureDailyLog(iso);
    log.totalSessions = window.APP_DATA.schedule[day].length;
    log.completedSessions += nowDone ? 1 : -1;
    log.completedSessions = Math.max(0, log.completedSessions);
    if (nowDone) { addXP(10); bumpStreakOn(iso); }
    save();
    return nowDone;
  }

  // ---- Tasks ----
  function addTask(task) {
    const t = Object.assign({
      id: "t" + Date.now() + Math.random().toString(36).slice(2, 6),
      title: "", category: "study", priority: "medium",
      deadline: "", estMin: 30, status: "todo", done: false,
      createdAt: U.isoDate()
    }, task);
    state.tasks.unshift(t);
    save();
    return t;
  }
  function updateTask(id, patch) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return null;
    Object.assign(t, patch);
    save();
    return t;
  }
  function deleteTask(id) {
    state.tasks = state.tasks.filter(x => x.id !== id);
    save();
  }
  function toggleTaskDone(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.status = t.done ? "done" : "todo";
    if (t.done) {
      addXP(15);
      const iso = U.isoDate();
      ensureDailyLog(iso).tasksDone += 1;
      bumpStreakOn(iso);
    }
    save();
  }

  // ---- Focus ----
  function logFocusSession(minutes, label, taskId) {
    const iso = U.isoDate();
    state.focusHistory.unshift({ id: "f" + Date.now(), date: iso, label: label || "Focus Session", minutes, taskId: taskId || null });
    ensureDailyLog(iso).focusMinutes += minutes;
    addXP(Math.round(minutes / 5)); // ~1xp per 5 min
    bumpStreakOn(iso);
    save();
  }

  function totalFocusMinutes() {
    return state.focusHistory.reduce((s, f) => s + f.minutes, 0);
  }

  // ---- Goals ----
  function updateGoalCurrent(id, value) {
    const g = state.goals.find(x => x.id === id);
    if (!g) return;
    g.current = value;
    g.history.push({ date: U.isoDate(), value });
    if (g.history.length > 60) g.history.shift();
    save();
  }

  // ---- Daily score (0-100) ----
  function dailyScore(iso) {
    const log = state.dailyLog[iso];
    if (!log) return 0;
    const sessionPct = log.totalSessions ? (log.completedSessions / log.totalSessions) * 55 : 0;
    const focusPct = U.clamp(log.focusMinutes / 120, 0, 1) * 30;
    const taskPct = U.clamp(log.tasksDone / 3, 0, 1) * 15;
    return Math.round(sessionPct + focusPct + taskPct);
  }

  return {
    load, save, get, isBroken,
    itemKey, isDone, toggleSession,
    addTask, updateTask, deleteTask, toggleTaskDone,
    logFocusSession, totalFocusMinutes,
    updateGoalCurrent,
    addXP, level, xpIntoLevel, dailyScore, ensureDailyLog
  };
})();

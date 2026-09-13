/* ============================================================
   SEM 1 OS — shared utilities
   ============================================================ */
window.Utils = (function () {

  function parseTimeRange(s) {
    const [a, b] = s.split("–").map(x => x.trim());
    return [a, b].map(x => {
      const [h, m] = x.split(":").map(Number);
      return h * 60 + m;
    });
  }

  function nowMinutes(d) {
    d = d || new Date();
    return d.getHours() * 60 + d.getSeconds() / 60 + d.getMinutes();
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function fmtMinutes(mins) {
    mins = Math.round(mins);
    if (mins < 60) return `${mins} phút`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h${m}p` : `${h}h`;
  }

  function dayKeyFor(date) {
    return window.APP_DATA.jsDayMap[date.getDay()] || "Thứ 2";
  }

  function isoDate(date) {
    date = date || new Date();
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return d.toISOString().slice(0, 10);
  }

  function greeting(date) {
    const h = date.getHours();
    if (h < 5) return "Khuya rồi, nghỉ sớm nhé";
    if (h < 11) return "Chào buổi sáng";
    if (h < 13) return "Chào buổi trưa";
    if (h < 18) return "Chào buổi chiều";
    if (h < 22) return "Chào buổi tối";
    return "Khuya rồi, nghỉ sớm nhé";
  }

  function weekNumber(date) {
    const one = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - one) / 86400000) + one.getDay() + 1) / 7);
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Adds `n` days to a plain YYYY-MM-DD string, returns YYYY-MM-DD
  function addDaysISO(iso, n) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  return { parseTimeRange, nowMinutes, fmtClock, fmtMinutes, dayKeyFor, isoDate, greeting, weekNumber, clamp, escapeHTML, addDaysISO, pad };
})();

/* ============================================================
   SEM 1 OS — Focus Mode
   ============================================================ */
window.Focus = (function () {
  const S = window.Store, U = window.Utils;

  let totalSeconds = 50 * 60;
  let remaining = totalSeconds;
  let interval = null;
  let running = false;
  let label = "Focus Session";
  let linkedTaskId = null;
  let onTick = null;
  let onFinish = null;
  let onStateChange = null;

  function setLabel(l) { label = l || "Focus Session"; }
  function getLabel() { return label; }
  function setLinkedTask(id) { linkedTaskId = id; }

  function setPreset(minutes) {
    stop(false);
    totalSeconds = minutes * 60;
    remaining = totalSeconds;
    tick();
  }

  function start() {
    if (running) return;
    running = true;
    interval = setInterval(() => {
      remaining -= 1;
      tick();
      if (remaining <= 0) {
        finish(true);
      }
    }, 1000);
    notifyState();
  }

  function pause() {
    running = false;
    clearInterval(interval);
    interval = null;
    notifyState();
  }

  function stop(reset = true) {
    running = false;
    clearInterval(interval);
    interval = null;
    if (reset) remaining = totalSeconds;
    notifyState();
  }

  function finish(auto = false) {
    const minutesDone = Math.max(1, Math.round((totalSeconds - remaining) / 60));
    stop(false);
    if (minutesDone >= 1) {
      S.logFocusSession(minutesDone, label, linkedTaskId);
    }
    remaining = totalSeconds;
    if (onFinish) onFinish(minutesDone, auto);
    notifyState();
    tick();
  }

  function tick() {
    if (onTick) onTick(remaining, totalSeconds, running);
  }

  function notifyState() {
    if (onStateChange) onStateChange(running);
  }

  function isRunning() { return running; }
  function getRemaining() { return remaining; }
  function getTotal() { return totalSeconds; }

  return {
    setLabel, getLabel, setLinkedTask, setPreset,
    start, pause, stop, finish, isRunning, getRemaining, getTotal,
    set onTickHandler(fn) { onTick = fn; },
    set onFinishHandler(fn) { onFinish = fn; },
    set onStateChangeHandler(fn) { onStateChange = fn; }
  };
})();

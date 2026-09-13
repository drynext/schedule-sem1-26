/* ============================================================
   SEM 1 OS — command palette & keyboard shortcuts
   ============================================================ */
window.Command = (function () {
  let items = [];
  let activeIndex = 0;
  let overlayEl, inputEl, listEl;

  function register(commands) { items = commands; }

  function init() {
    overlayEl = document.getElementById("cmdOverlay");
    inputEl = document.getElementById("cmdInput");
    listEl = document.getElementById("cmdList");

    inputEl.addEventListener("input", () => renderList(inputEl.value));
    inputEl.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); runActive(); }
      else if (e.key === "Escape") { close(); }
    });
    overlayEl.addEventListener("click", e => { if (e.target === overlayEl) close(); });
  }

  function filtered(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter(c => c.label.toLowerCase().includes(q) || (c.keywords || "").includes(q));
  }

  function renderList(query) {
    const list = filtered(query);
    activeIndex = 0;
    listEl.innerHTML = list.length ? list.map((c, i) => `
      <li class="cmd-item ${i === 0 ? "is-active" : ""}" data-index="${i}">
        <span>${c.label}</span>${c.hint ? `<kbd>${c.hint}</kbd>` : ""}
      </li>`).join("") : `<li class="cmd-empty">Không tìm thấy lệnh phù hợp.</li>`;
    listEl.querySelectorAll(".cmd-item").forEach(li => {
      li.addEventListener("mouseenter", () => setActive(Number(li.dataset.index)));
      li.addEventListener("click", () => { setActive(Number(li.dataset.index)); runActive(); });
    });
    listEl._current = list;
  }

  function setActive(i) {
    activeIndex = i;
    listEl.querySelectorAll(".cmd-item").forEach(li => li.classList.toggle("is-active", Number(li.dataset.index) === i));
  }

  function move(delta) {
    const list = listEl._current || [];
    if (!list.length) return;
    activeIndex = (activeIndex + delta + list.length) % list.length;
    setActive(activeIndex);
    const el = listEl.querySelector(`.cmd-item[data-index="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  function runActive() {
    const list = listEl._current || [];
    const cmd = list[activeIndex];
    if (!cmd) return;
    close();
    cmd.run();
  }

  function open() {
    overlayEl.classList.add("is-open");
    inputEl.value = "";
    renderList("");
    setTimeout(() => inputEl.focus(), 10);
  }
  function close() {
    overlayEl.classList.remove("is-open");
  }
  function isOpen() { return overlayEl.classList.contains("is-open"); }
  function toggle() { isOpen() ? close() : open(); }

  return { register, init, open, close, toggle, isOpen };
})();

// Print-edition reader: progress bar, print button, chapter position.
(function () {
  var btn = document.querySelector("[data-print-now]");
  if (btn) btn.addEventListener("click", function () { window.print(); });

  var bar = document.querySelector("[data-print-progress]");
  var pos = document.querySelector("[data-print-pos]");
  var chapters = Array.prototype.slice.call(
    document.querySelectorAll(".book-chapter[id]"));
  if (!chapters.length && !bar && !pos) return;

  function currentIndex() {
    var mid = window.scrollY + window.innerHeight * 0.3;
    var idx = 0;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].offsetTop <= mid) idx = i;
    }
    return idx;
  }

  var ticking = false;
  function update() {
    ticking = false;
    var h = document.documentElement;
    var max = h.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
    if (pos && chapters.length) {
      pos.textContent = "Ch. " + (currentIndex() + 1) +
        " / " + chapters.length;
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();

  // Deep-link highlight when jumping from the TOC.
  function flash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }
  window.addEventListener("hashchange", flash);
  flash();
})();

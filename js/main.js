document.addEventListener("DOMContentLoaded", () => {
  if (window.katex) {
    document.querySelectorAll(".math-inline, .math-display").forEach((element) => {
      const source = element.textContent.trim();
      const displayMode = element.classList.contains("math-display");
      element.innerHTML = katex.renderToString(source, {
        displayMode,
        throwOnError: false,
      });
    });
  }

  console.log("GitHub Pages site is ready.");
});

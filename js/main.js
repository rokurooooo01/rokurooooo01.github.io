document.addEventListener("DOMContentLoaded", () => {
  if (window.katex) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  }

  console.log("GitHub Pages site is ready.");
});

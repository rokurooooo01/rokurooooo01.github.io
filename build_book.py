"""Build Foundational Mathematics print edition + PDF.
Usage:
  pip install fpdf2
  python build_book.py
Outputs:
  foundational-mathematics-print.html
  assets/foundational-mathematics-v0.1.0.pdf
"""
from pathlib import Path
import html as htmlmod

ROOT = Path(__file__).resolve().parent
VERSION = "0.1.0"
DATE = "2026-09-20"
AUTHOR = "rokurooooo"
TITLE = "Foundational Mathematics"

CHAPTERS = [
    ("arithmetic.html", "Web preview - Arithmetic (Ch 1 material)"),
    ("number-system.html", "Web preview - Number System (Ch 1 + Ch 10 material)"),
    ("limits-and-continuity.html", "Web preview - Limits and Continuity (Ch 12 material)"),
    ("differential-equations.html", "Web preview - Differential Equations (Ch 14 material)"),
]

SYNOPSES = [
    ("Chapter 1 - The Real Number System",
     "Rational and irrational numbers, set and interval notation, indices, surds, and logarithms. "
     "Establishes the notation and algebraic vocabulary used throughout the book."),
    ("Chapter 2 - Functions",
     "Domains and ranges, common families of functions, transformations, composite and piecewise "
     "functions, and inverse functions. Algebraic rules and their graphical representations."),
    ("Chapter 3 - Polynomials",
     "Arithmetic operations, division, factorisation, the remainder and factor theorems, and partial "
     "fractions - needed again in integral calculus."),
    ("Chapter 4 - Inequalities",
     "Inequalities involving quadratic, cubic, rational, and absolute-value expressions."),
    ("Chapter 5 - Matrices",
     "Operations, determinants, inverses, and systems of simultaneous linear equations. "
     "Foundations of linear algebra for graphics and machine learning."),
    ("Chapter 6 - Trigonometry",
     "Angle measurement, the basic functions, graphs, identities, equations, and inverse functions."),
    ("Chapter 7 - Linear Law",
     "Transforming non-linear relationships into straight-line form: scatter plots, lines of best "
     "fit, gradients and intercepts in models."),
    ("Chapter 8 - Circles and Conic Sections",
     "Parabolas, ellipses, hyperbolas, and their parametric equations."),
    ("Chapter 9 - Probability and Statistics",
     "Permutations and combinations; the binomial, normal, Poisson, and exponential distributions."),
    ("Chapter 10 - Complex Numbers",
     "Algebraic, polar, exponential, and geometric forms, with De Moivre's theorem and Euler's "
     "formula. Numbers as points with geometric structure."),
    ("Chapter 11 - Hyperbolic Functions",
     "Identities, graphs, and inverse functions, compared with the circular functions of Chapter 6."),
    ("Chapter 12 - Differential Calculus",
     "Limits and first principles, the standard rules of differentiation, rates of change and "
     "optimisation."),
    ("Chapter 13 - Integral Calculus",
     "Integration as the inverse of differentiation: methods, definite integrals, accumulated "
     "quantities and areas."),
    ("Chapter 14 - Differential Equations",
     "First-order equations and models of growth, decay, mixing, and continuous change."),
    ("Chapter 15 - Sequences and Series",
     "Convergence, binomial and power series, Taylor and Maclaurin expansions."),
    ("Chapter 16 - Vectors",
     "Two and three dimensions: operations, products, relative motion, vector-valued "
     "differentiation and integration."),
    ("Chapter 17 - Graph Theory",
     "Vertices and edges, paths, cycles, trees, planar graphs, colouring, shortest paths, "
     "spanning trees. Discrete maths for CS and networks."),
    ("Chapter 18 - Logic and Proof",
     "Propositions, truth tables, implications, quantifiers, valid arguments, fallacies, and "
     "elementary proof methods."),
    ("Chapter 19 (bonus) - Computing with R",
     "Vectors, data frames, importing and visualising data, probability distributions, "
     "one-sample tests, matrix calculations. Applies Chapters 5 and 9 computationally."),
]

AFTERWORD = ("why-mathematics.html", "Afterword - Why Mathematics?")


def extract_article(path):
    text = path.read_text(encoding="utf-8")
    start = text.find("<article")
    end = text.find("</article>")
    if start == -1 or end == -1:
        return "<p>(missing content)</p>"
    chunk = text[start:end + len("</article>")]
    chunk = chunk.replace("\\(", "").replace("\\)", "")
    chunk = chunk.replace("\\[", "").replace("\\]", "")
    return chunk


def build_print_html():
    parts = []
    toc = []
    for i, (label, desc) in enumerate(SYNOPSES, 1):
        anchor = "ch" + str(i)
        toc.append('<li><a href="#' + anchor + '">' + label + "</a></li>")
        parts.append(
            '<section class="book-chapter" id="' + anchor + '">'
            '<h2 class="chapter-title">' + label + "</h2>"
            "<p>" + desc + "</p>"
            "<p><em>Full text ships in the First Edition, 20 Sept 2026.</em></p>"
            + "</section>"
        )
    toc.append('<li><a href="#previews">Web previews (read now)</a></li>')
    parts.append(
        '<section class="book-chapter" id="previews">'
        '<h2 class="chapter-title">Web previews (read now)</h2>'
        "<p>Four chapters are already readable on this site. "
        "The complete First Edition ships 20 Sept 2026.</p>"
        + "</section>"
    )
    for fname, label in CHAPTERS:
        anchor = fname.replace(".html", "")
        toc.append('<li><a href="#' + anchor + '">' + label + "</a></li>")
        body = extract_article(ROOT / fname)
        parts.append(
            '<section class="book-chapter" id="' + anchor + '">'
            '<h2 class="chapter-title">' + label + "</h2>"
            + body + "</section>"
        )
    fname, label = AFTERWORD
    anchor = "afterword"
    toc.append('<li><a href="#' + anchor + '">' + label + "</a></li>")
    parts.append(
        '<section class="book-chapter" id="' + anchor + '">'
        '<h2 class="chapter-title">' + label + "</h2>"
        + extract_article(ROOT / fname) + "</section>"
    )
    return "\n".join(toc), "\n".join(parts)


PRINT_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>__TITLE__ (print edition) | rokurooooo</title>
<meta name="description" content="Print edition of __TITLE__ v__VERSION__ - all chapters on one page. Save as PDF from your browser." />
<link rel="canonical" href="https://rokurooooo01.github.io/foundational-mathematics-print.html" />
<link rel="icon" href="images/favicon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="css/style.css" />
<link rel="stylesheet" href="css/print.css" />
</head>
<body class="print-book">
<a class="skip-link" href="#main-content">Skip to content</a>
<nav class="page-nav no-print" aria-label="Site pages">
<a class="button" href="index.html">Home</a>
<a class="button" href="mathematics.html">Math</a>
<a class="button" href="foundational-mathematics.html">Book hub</a>
</nav>
<main id="main-content">
<header class="book-cover">
<p class="eyebrow">rokurooooo presents</p>
<h1>__TITLE__</h1>
<p class="subtitle">First Edition - v__VERSION__ - 20 Sept 2026</p>
<p class="meta">by __AUTHOR__ - __DATE__ - CC BY-SA 4.0 - free to share and remix</p>
<p class="no-print meta">Press Ctrl+P and choose Save as PDF for a clean offline copy.</p>
</header>
<nav class="book-toc" aria-label="Contents">
<h2>Contents</h2>
<ol>
__TOC__
</ol>
</nav>
__BODY__
<section class="book-colophon">
<h2>Colophon</h2>
<p>__TITLE__ v__VERSION__ (__DATE__) by __AUTHOR__. Source chapters live at rokurooooo01.github.io. License CC BY-SA 4.0. Generated from the same HTML chapters - web and print never drift apart.</p>
</section>
</main>
</body>
</html>
"""


def html_to_text(fragment):
    import re
    s = re.sub(r"</(p|h\d|li|section|article|div|blockquote|ul|ol)>", "\n\n", fragment, flags=re.I)
    s = re.sub(r"<li[^>]*>", "- ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = htmlmod.unescape(s)
    s = s.replace("\\(", "").replace("\\)", "")
    lines = [ln.strip() for ln in s.splitlines()]
    out = []
    for ln in lines:
        if ln == "" :
            if out and out[-1] != "":
                out.append("")
        else:
            out.append(ln)
    return "\n".join(out).strip()


def build_pdf(toc_html, body_html):
    try:
        from fpdf import FPDF
    except ImportError:
        print("fpdf2 not installed. Run: pip install fpdf2")
        return False
    import re
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(18, 20, 18)
    pdf.set_auto_page_break(True, margin=22)
    pdf.set_title(TITLE + " v" + VERSION)
    pdf.set_author(AUTHOR)
    pdf.add_page()
    pdf.set_y(20)
    pdf.set_font("Helvetica", "B", 26)
    pdf.multi_cell(w=0, h=12, text=TITLE, align="C",
                   new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 13)
    pdf.multi_cell(w=0, h=8, text="First Edition - 20 Sept 2026", align="C",
                   new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(w=0, h=7, text="by " + AUTHOR + "  |  v" + VERSION + "  |  " + DATE,
                   align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.multi_cell(w=0, h=7, text="CC BY-SA 4.0 - free to share and remix",
                   align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(w=0, h=8, text="Contents", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 11)
    labels = re.findall(r"<a[^>]*>(.*?)</a>", toc_html)
    for i, lab in enumerate(labels, 1):
        pdf.multi_cell(w=0, h=7, text=str(i) + ". " + htmlmod.unescape(lab),
                       new_x="LMARGIN", new_y="NEXT")
    plain = html_to_text(body_html)
    pdf.set_font("Helvetica", "", 11)
    for para in plain.split("\n\n"):
        p = para.strip()
        if not p or len(p) < 2:
            continue
        is_head = len(p) < 90 and (p.startswith("Chapter") or p.startswith("Afterword"))
        if is_head:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 16)
            pdf.multi_cell(w=0, h=9, text=p, new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 11)
        else:
            safe = p.encode("latin-1", "replace").decode("latin-1")
            pdf.multi_cell(w=0, h=6.2, text=safe, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1)
    outdir = ROOT / "assets"
    outdir.mkdir(exist_ok=True)
    out = outdir / ("foundational-mathematics-v" + VERSION + ".pdf")
    pdf.output(str(out))
    print("Wrote " + str(out))
    return True


def main():
    toc, body = build_print_html()
    page = PRINT_TEMPLATE
    page = page.replace("__TITLE__", TITLE)
    page = page.replace("__VERSION__", VERSION)
    page = page.replace("__AUTHOR__", AUTHOR)
    page = page.replace("__DATE__", DATE)
    page = page.replace("__TOC__", toc)
    page = page.replace("__BODY__", body)
    (ROOT / "foundational-mathematics-print.html").write_text(page, encoding="utf-8")
    print("Wrote foundational-mathematics-print.html")
    build_pdf(toc, body)


if __name__ == "__main__":
    main()








/**
 * Utility to sanitize all LaTeX expressions, math notation, and dollar signs ($).
 * In Taiwan mathematics education, raw dollar signs ($) or LaTeX syntax like
 * `$V = L \times W \times H$` are strictly abnormal and should be transformed into
 * clean, professional Unicode mathematical typography (e.g. `V = L × W × H`).
 */
export function cleanAllDollarSignsAndLatex(text: string): string {
  if (!text) return "";

  let res = text;

  // 1. Convert block math $$ ... $$ into clean plain lines
  res = res.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    return `\n\n${inner.trim()}\n\n`;
  });

  // 2. Common LaTeX arithmetic & relational operators to Unicode
  res = res.replace(/\\times/g, "×");
  res = res.replace(/\\div/g, "÷");
  res = res.replace(/\\le(q)?(?![a-zA-Z])/g, "≤");
  res = res.replace(/\\ge(q)?(?![a-zA-Z])/g, "≥");
  res = res.replace(/\\neq/g, "≠");
  res = res.replace(/\\approx/g, "≈");
  res = res.replace(/\\pm/g, "±");
  res = res.replace(/\\mp/g, "∓");
  res = res.replace(/\\cdot/g, "·");
  res = res.replace(/\\implies/g, " ➔ ");
  res = res.replace(/\\iff/g, " ⟺ ");
  res = res.replace(/\\to/g, " ➔ ");
  res = res.replace(/\\(c)?dots/g, "...");

  // Greek letters & geometric symbols
  res = res.replace(/\\pi/g, "π");
  res = res.replace(/\\theta/g, "θ");
  res = res.replace(/\\alpha/g, "α");
  res = res.replace(/\\beta/g, "β");
  res = res.replace(/\\infty/g, "∞");
  res = res.replace(/\\triangle/g, "△");
  res = res.replace(/\\angle/g, "∠");
  res = res.replace(/\\perp/g, "⊥");
  res = res.replace(/\\sim/g, "∼");
  res = res.replace(/\\cong/g, "≅");
  res = res.replace(/\\degree|\^\\circ/g, "°");

  // Structural macros
  res = res.replace(/\\text\{([^}]*)\}/g, "$1");
  res = res.replace(/\\left|\\right/g, "");
  res = res.replace(/\\sqrt\{([^}]*)\}/g, "√($1)");

  // Handle \frac{a}{b}
  res = res.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, (_match, num, den) => {
    const cleanNum = num.trim();
    const cleanDen = den.trim();
    if (cleanNum.length <= 3 && cleanDen.length <= 3) {
      return `${cleanNum}/${cleanDen}`;
    }
    return `(${cleanNum} / ${cleanDen})`;
  });

  // Superscripts & Subscripts
  res = res.replace(/\^2(?![0-9])/g, "²");
  res = res.replace(/\^3(?![0-9])/g, "³");
  res = res.replace(/\^\{2\}/g, "²");
  res = res.replace(/\^\{3\}/g, "³");
  res = res.replace(/_1(?![0-9])/g, "₁");
  res = res.replace(/_2(?![0-9])/g, "₂");

  // 3. Strip inline math delimiters $ ... $
  res = res.replace(/\$([^$\n]+)\$/g, "$1");

  // 4. Strip any stray single or multiple $ signs
  res = res.replace(/\$/g, "");

  // 5. Clean up redundant spaces around math operators for visual polish
  res = res.replace(/\s*([×÷=≤≥≠+])\s*/g, " $1 ");
  // Do not add space inside fractions or negative signs if preceding is space
  res = res.replace(/[ \t]{2,}/g, " ");

  return res;
}

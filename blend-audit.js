// Blend audit: does every filled element stand apart from the surface it sits on, and does all
// text read? Paste into the page; window.__audit(routes) returns problems per route.
(() => {
  const parse = (s) => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const dark = () => (parse(getComputedStyle(document.body).backgroundColor) ? lum(parse(getComputedStyle(document.body).backgroundColor)) < 0.2 : false);
  const bgOf = (el) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) chain.push(c); if (c && c.a === 1) break; }
    let bg = dark() ? { r: 0, g: 0, b: 0, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
    for (let i = chain.length - 1; i >= 0; i--) bg = over(chain[i], bg);
    return bg;
  };
  // A visible line: a border, an outline or an inset box-shadow whose colour differs enough.
  const lineOf = (el, bg) => {
    const s = getComputedStyle(el);
    const cands = [];
    if (s.borderTopStyle !== "none" && parseFloat(s.borderTopWidth) > 0) cands.push(parse(s.borderTopColor));
    if (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) cands.push(parse(s.outlineColor));
    const m = s.boxShadow.match(/rgba?\([^)]+\)[^,]*inset|inset[^,]*rgba?\([^)]+\)/g);
    if (m) m.forEach((x) => cands.push(parse(x)));
    return Math.max(1, ...cands.filter(Boolean).map((c) => ratio(over(c, bg), bg)));
  };
  const name = (el) => `${el.className && typeof el.className === "string" ? (el.className.match(/Mui[A-Za-z]+-root/) || [el.tagName.toLowerCase()])[0] : el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 18)}"`;
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && +s.opacity > 0.05; };

  window.__blend = () => {
    const out = [];
    const sel = ".MuiCard-root, .MuiButton-root, .MuiChip-root, .MuiToggleButtonGroup-root, .MuiFilledInput-root, .MuiInputBase-root, .MuiTabs-indicator, [role='listitem'], .MuiAlert-root, .MuiIconButton-root";
    for (const el of document.querySelectorAll(sel)) {
      if (!vis(el) || el.closest(".Mui-disabled")) continue;
      const own = parse(getComputedStyle(el).backgroundColor);
      if (!own || own.a === 0) continue; // ghost / text-only: intentionally borderless
      const under = bgOf(el.parentElement);
      const fill = over(own, under);
      const tone = ratio(fill, under);
      const lineK = lineOf(el, under);
      if (tone < 1.08 && lineK < 1.3) out.push(`blend ${tone.toFixed(2)}/${lineK.toFixed(2)} ${name(el)}`);
    }
    // Text
    for (const el of document.querySelectorAll("main *, nav *, .MuiDrawer-paper *, .MuiDialog-paper *")) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      if (!vis(el) || el.closest(".Mui-disabled,[aria-disabled=true],:disabled")) continue;
      const s = getComputedStyle(el); const fg = parse(s.color); if (!fg) continue;
      const bg = bgOf(el); const k = ratio(over(fg, bg), bg);
      const min = el.classList.contains("material-symbols-rounded") || parseFloat(s.fontSize) >= 18.66 ? 3 : 4.5;
      if (k < min) out.push(`text ${k.toFixed(2)} "${el.textContent.trim().slice(0, 20)}"`);
    }
    return [...new Set(out)].slice(0, 10);
  };
  window.__audit = async (routes) => {
    const res = {};
    for (const r of routes) {
      history.pushState({}, "", r); dispatchEvent(new PopStateEvent("popstate"));
      await new Promise((x) => setTimeout(x, 1100));
      const a = window.__blend();
      if (a.length) res[r] = a;
    }
    return res;
  };
  return "ready";
})();

// 带路页：把它自己（也就是 magpie 页面那个框架）导航到插件的服务。
//
// 这里必须"直接跳"，不能先探测：
//   页面的 CSP 是 connect-src 'none'，fetch/XHR/WebSocket 全被禁止 ——
//   连 no-cors 的请求都会被直接拒绝。所以「先探一下服务在不在」这条路走不通，
//   alive() 永远返回 false，页面会永远停在等待页。
//   magpie 文档也明说了：这个页面唯一能做的联网动作就是把自己跳转到别处。
//
// 端口用固定的 3477。多个 magpie 实例同时在跑时，后来者会退到 3478…，
// 但页面一律跳 3477 —— 指向先起来的那个，行为反而更一致。
//
// 顺手把窗口的主题和设计令牌一起带上（magpie 的 bridge 已经把它们算好了），
// 这样对话页的配色和字体跟窗口完全一致，连用户的自定义主题也算在内。
(async () => {
  const DEFAULT_PORT = 3477;
  let port = DEFAULT_PORT;
  let theme = "";
  let tokens = null;

  try {
    const t = await window.magpie?.ready;           // { dark, lang, tokens }
    if (t) {
      if (typeof t.dark === "boolean") theme = t.dark ? "dark" : "light";
      if (t.tokens && typeof t.tokens === "object") tokens = t.tokens;
    }
  } catch { /* 没有 bridge 就退回默认主题 */ }

  try {
    const o = await window.magpie?.options?.get?.();
    if (o && Number.isFinite(Number(o.port)) && Number(o.port) > 0) port = Number(o.port);
  } catch { /* 没有 options 就用默认端口 */ }

  // 字体：跟着 magpie 设置里选的那个走。
  // magpie 的 CSS 里，用户设的字体是 --ui-font（回退 --font），粗细是 --ui-weight（回退 400），
  // 代码字体是 --code-font（回退 --code）。这里把它们的**实际值**读出来传给对话页，
  // 因为是跳转过去的，那边的页面拿不到 magpie 的 CSS 变量，只能靠这里带过去。
  const extra = {};
  try {
    const cs = getComputedStyle(document.documentElement);
    const pick = (...names) => {
      for (const n of names) {
        const v = cs.getPropertyValue(n).trim();
        if (v && v !== "initial" && v !== "inherit") return v;
      }
      return "";
    };
    // magpie 设的 --ui-font 形如 `"Noto Sans SC", var(--font)` —— 里面套着 var(--font)。
    // 原样带到对话页、又把它设成那边的 --font，就成了自己引用自己，
    // 整条栈会失效。所以先把内嵌的 var(--font) 换成实际的基础字体栈再传。
    const baseFont = pick("--font", "--magpie-font");
    const baseCode = pick("--code", "--magpie-code");
    const subst = (value, varName, replacement) => {
      if (!value) return "";
      if (!replacement) return value;
      return value.replace(new RegExp("var\\(\\s*" + varName + "\\s*\\)", "g"), replacement);
    };
    const font = subst(pick("--ui-font"), "--font", baseFont);
    const weight = pick("--ui-weight", "--magpie-font-weight");
    const style = pick("--ui-style");
    const code = subst(pick("--code-font", "--code"), "--code", baseCode);

    if (font) extra.font = font;
    else if (baseFont) extra.font = baseFont;
    if (weight) extra["font-weight"] = weight;
    if (style) extra["font-style"] = style;
    if (code) extra.code = code;
  } catch { /* 读不到就用页面自己的兜底字体 */ }

  const q = new URLSearchParams();
  if (theme) q.set("theme", theme);
  if (true) {
    // 只留非空的令牌，压成一个短串；令牌本身就是 magpie 自己的 CSS 变量值。
    // 自己读到的字体合并进去（上面 extra），覆盖 magpie 没给的那部分。
    const slim = {};
    for (const [k, v] of Object.entries(tokens || {})) {
      const s = String(v ?? "").trim();
      if (s) slim[k] = s;
    }
    for (const [k, v] of Object.entries(extra)) {
      const s = String(v ?? "").trim();
      if (s) slim[k] = s;
    }
    if (Object.keys(slim).length) {
      try { q.set("tokens", btoa(unescape(encodeURIComponent(JSON.stringify(slim))))); } catch { /* 编码不了就只带主题 */ }
    }
  }

  location.replace("http://127.0.0.1:" + port + "/?" + q.toString());
})();

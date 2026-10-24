// 带路页：把它自己（也就是 magpie 页面那个框架）导航到插件的服务。
// 页面运行在 sandbox="allow-scripts" 的框架里：没有网络、不能内嵌，只能这样跳出去。
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

  const q = new URLSearchParams();
  if (theme) q.set("theme", theme);
  if (tokens) {
    // 只留非空的令牌，压成一个短串；令牌本身就是 magpie 自己的 CSS 变量值
    const slim = {};
    for (const [k, v] of Object.entries(tokens)) {
      const s = String(v ?? "").trim();
      if (s) slim[k] = s;
    }
    if (Object.keys(slim).length) {
      try { q.set("tokens", btoa(unescape(encodeURIComponent(JSON.stringify(slim))))); } catch { /* 编码不了就只带主题 */ }
    }
  }
  location.replace("http://127.0.0.1:" + port + "/?" + q.toString());
})();

// 带路页：把它自己（也就是 magpie 页面那个框架）导航到插件的服务。
// 页面运行在 sandbox="allow-scripts" 的框架里：没有网络、不能内嵌，只能这样跳出去。
//
// 为什么"立刻跳"：界面（chat/index.html）是静态 HTML+CSS，不依赖服务就能画出来 ——
// 侧栏、输入框、空态都是 DOM。只有数据要等服务。所以先跳过去把界面亮出来，
// 缺的数据由界面自己重试，比在这里杵着"正在启动"好得多。
//
// 端口：默认 3477，但窗口里可能同时有命令行 magpie 和桌面 magpie 两个宿主，
// 它们会抢这个端口，抢输的那个会退到 3478/3479/3480。这里挨个探一遍，
// 哪个通就去哪个 —— 页面不能假设永远是 3477。
(async () => {
  const CANDIDATES = [3477, 3478, 3479, 3480];
  let theme = "";
  let tokens = null;
  let port = 0;

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

  const go = (p) => location.replace("http://127.0.0.1:" + p + "/?" + q.toString());

  // 探一下端口通不通：no-cors 拿不到内容，但"连上了"和"连接被拒"能分开
  async function alive(p) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 700);
      await fetch("http://127.0.0.1:" + p + "/api/ping", { mode: "no-cors", cache: "no-store", signal: ctl.signal });
      clearTimeout(timer);
      return true;
    } catch {
      return false;
    }
  }

  // 用户显式配了端口就只认它；否则按候选顺序找
  const list = port ? [port] : CANDIDATES;

  // 快速探一轮（每个 700ms 超时，但通常前几个立刻有结果）
  for (const p of list) {
    if (await alive(p)) { go(p); return; }
  }

  // 一个都没起来：托管给界面自己重试。先跳默认端口，
  // chat 页在数据拿不到时会每 600ms 重试一次，并提示"正在连接"。
  go(list[0]);
})();

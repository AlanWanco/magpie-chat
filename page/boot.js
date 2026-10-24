// 带路页：把它自己（也就是 magpie 页面那个框架）导航到插件的服务。
// 页面运行在 sandbox="allow-scripts" 的框架里：没有网络、不能内嵌，只能这样跳出去。
//
// 重要：插件的服务是在宿主加载插件时才起来的，而宿主可能还在等上一个进程松手
// （端口被占时最多重试 6 秒）。所以这里不能直接跳 —— 先探一下端口通不通，
// 通不过就等一会儿再试，实在起不来说明原因，别让人对着"拒绝连接"干瞪眼。
//
// 顺手把窗口的主题和设计令牌一起带上（magpie 的 bridge 已经把它们算好了），
// 这样对话页的配色和字体跟窗口完全一致，连用户的自定义主题也算在内。
(async () => {
  const DEFAULT_PORT = 3477;
  const WAIT_MS = 15000;      // 最多等这么久
  const STEP_MS = 400;         // 每次重试的间隔
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

  const url = "http://127.0.0.1:" + port + "/?" + q.toString();
  const base = "http://127.0.0.1:" + port + "/api/ping";

  // 探一下服务在不在。这个页面自己没有网络权限，但可以发一个 no-cors 请求：
  // 拿不到响应内容，但"连接被拒绝"和"连上了"在 fetch 的成功/失败上是能分开的
  // （服务在 127.0.0.1，同源策略下这里用的是 mode:no-cors，失败即抛异常）。
  async function alive() {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 1200);
      await fetch(base, { mode: "no-cors", cache: "no-store", signal: ctl.signal });
      clearTimeout(timer);
      return true;
    } catch {
      return false;
    }
  }

  function showWaiting() {
    const doc = document;
    doc.title = "对话 · 正在启动";
    const wrap = doc.createElement("div");
    wrap.style.cssText =
      "position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;" +
      "justify-content:center;gap:10px;font:13px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif;" +
      "color:#85858d;background:#f4f4f6";
    const title = doc.createElement("div");
    title.textContent = "正在启动对话服务…";
    title.style.cssText = "color:#1c1c21;font-size:14px";
    const hint = doc.createElement("div");
    hint.id = "hint";
    hint.textContent = "第一次打开会慢一两秒";
    wrap.appendChild(title);
    wrap.appendChild(hint);
    doc.body.appendChild(wrap);
    return hint;
  }

  let hint = null;
  const deadline = Date.now() + WAIT_MS;
  let ok = false;

  // 第一次探测前先不打扰界面：很多情况下服务已经就绪，直接跳走最干净
  ok = await alive();
  if (!ok) {
    hint = showWaiting();
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, STEP_MS));
      ok = await alive();
      if (ok) break;
      if (hint) hint.textContent = "还在等宿主把服务起来…";
    }
  }

  if (ok) {
    location.replace(url);
    return;
  }

  // 等不到就说清楚原因，给一个重试按钮，而不是停在浏览器的"拒绝连接"
  if (!hint) hint = showWaiting();
  hint.textContent = "";
  const box = hint.parentElement;
  const msg = document.createElement("div");
  msg.style.cssText = "max-width:420px;text-align:center;line-height:1.7";
  msg.textContent =
    "对话服务没有起来（127.0.0.1:" + port + "）。" +
    "可能是插件刚被重载、端口被上一个宿主占着，或者端口被别的程序用了。";
  const btn = document.createElement("button");
  btn.textContent = "重试";
  btn.style.cssText =
    "margin-top:6px;height:28px;padding:0 14px;border-radius:7px;border:1px solid #e3e3e8;" +
    "background:#fff;color:#1c1c21;font:13px system-ui;cursor:pointer";
  btn.onclick = () => location.reload();
  const tip = document.createElement("div");
  tip.style.cssText = "font-size:12px;color:#a0a0a8";
  tip.textContent = "若一直如此，在终端运行 magpie plugin 看看这个插件是否 on。";
  box.appendChild(msg);
  box.appendChild(btn);
  box.appendChild(tip);
})();

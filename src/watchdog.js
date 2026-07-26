// 服务器守望者：开发服务器掉线时给出明确提示，恢复后自动重连
// （网页 JS 无法启动外部进程，真正的自动重启由 keep-alive.cmd 守护脚本负责）

const PING_MS = 4000;

let offline = false;
let overlay = null;

function buildOverlay() {
  const el = document.createElement('div');
  el.id = 'offline-overlay';
  el.innerHTML = `
    <div id="offline-card">
      <div id="offline-emoji">🔌</div>
      <b>开发服务器断开了</b>
      <p>游戏画面还在，但改动和硬盘备份暂时停了。<br>
      服务器一恢复这里会<b>自动重连</b>，不用刷新。</p>
      <p class="hint">想彻底避免：双击项目里的 <code>keep-alive.cmd</code><br>它会守着服务器，掉了自动拉起来。</p>
      <div id="offline-dots">正在等待服务器…</div>
    </div>`;
  document.body.appendChild(el);
  return el;
}

async function ping() {
  try {
    // vite 的客户端脚本一定在；带时间戳防缓存
    const r = await fetch(`/@vite/client?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    return r.ok;
  } catch {
    return false;
  }
}

export function startWatchdog(game) {
  setInterval(async () => {
    const alive = await ping();
    if (!alive && !offline) {
      offline = true;
      // 断线时先落盘一次，防止这段时间的进度丢失
      try { game?.save?.(); } catch { /* 忽略 */ }
      overlay = overlay ?? buildOverlay();
      overlay.classList.remove('hidden');
    } else if (alive && offline) {
      offline = false;
      if (overlay) {
        overlay.querySelector('#offline-dots').textContent = '服务器回来了，正在重连…';
        setTimeout(() => location.reload(), 600);
      }
    }
  }, PING_MS);
}

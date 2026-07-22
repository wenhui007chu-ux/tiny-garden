import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// 开发用：页面可 POST /__shot 把画布截图存到项目根目录，方便无头环境下检查画面
const debugShot = {
  name: 'debug-shot',
  configureServer(server) {
    server.middlewares.use('/__shot', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        const b64 = String(body).replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(path.resolve('debug-shot.png'), Buffer.from(b64, 'base64'));
        res.end('ok');
      });
    });
  },
};

// 存档落盘：浏览器 localStorage 可能被清空，硬盘上的 save-backup.json 才是保险箱
// 覆盖前先轮换出带时间戳的历史副本，避免「新开的空档把好档冲掉」这种事故
const saveBackup = {
  name: 'save-backup',
  configureServer(server) {
    const file = path.resolve('save-backup.json');
    const histDir = path.resolve('saves');
    const ROTATE_MS = 10 * 60 * 1000; // 距上次归档超过 10 分钟就再存一份历史
    const KEEP = 24;

    const rotate = () => {
      if (!fs.existsSync(file)) return;
      if (!fs.existsSync(histDir)) fs.mkdirSync(histDir);
      const files = fs.readdirSync(histDir).filter(f => f.endsWith('.json')).sort();
      const newest = files.length ? fs.statSync(path.join(histDir, files[files.length - 1])).mtimeMs : 0;
      if (Date.now() - newest < ROTATE_MS) return;
      const t = new Date();
      const stamp = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}`
        + `-${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}${String(t.getSeconds()).padStart(2, '0')}`;
      fs.copyFileSync(file, path.join(histDir, `backup-${stamp}.json`));
      // 只留最近 KEEP 份
      const all = fs.readdirSync(histDir).filter(f => f.endsWith('.json')).sort();
      all.slice(0, Math.max(0, all.length - KEEP)).forEach(f => fs.unlinkSync(path.join(histDir, f)));
    };

    server.middlewares.use('/__save', (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try { rotate(); } catch { /* 归档失败不影响存档本身 */ }
          fs.writeFileSync(file, body);
          res.end('ok');
        });
      } else if (req.method === 'GET') {
        if (fs.existsSync(file)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(file));
        } else { res.statusCode = 404; res.end(); }
      } else { res.statusCode = 405; res.end(); }
    });
  },
};

export default defineConfig({
  plugins: [debugShot, saveBackup],
});

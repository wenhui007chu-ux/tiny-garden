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
const saveBackup = {
  name: 'save-backup',
  configureServer(server) {
    const file = path.resolve('save-backup.json');
    server.middlewares.use('/__save', (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => { fs.writeFileSync(file, body); res.end('ok'); });
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

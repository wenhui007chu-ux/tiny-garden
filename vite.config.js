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

export default defineConfig({
  plugins: [debugShot],
});

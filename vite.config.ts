import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

/**
 * Chỉ chạy khi dev: trang promo.html dựng video trong trình duyệt rồi POST file MP4/PNG về đây
 * để lưu vào thư mục promo/.
 */
function promoSaver(): Plugin {
  return {
    name: 'promo-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__promo/save', async (req, res) => {
        const name = basename(new URL(req.url ?? '/', 'http://local').searchParams.get('name') ?? '');
        if (req.method !== 'POST' || !/^[\w.-]+\.(mp4|png)$/.test(name)) {
          res.statusCode = 400;
          res.end('Cần POST với ?name=<tên>.mp4|png');
          return;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const dir = resolve(server.config.root, 'promo');
        await mkdir(dir, { recursive: true });
        const file = resolve(dir, name);
        await writeFile(file, Buffer.concat(chunks));
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ file, bytes: Buffer.concat(chunks).length }));
      });
    },
  };
}

export default defineConfig({
  plugins: [promoSaver()],
});

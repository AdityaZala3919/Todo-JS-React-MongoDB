import url, { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

// Load .env variables into process.env for Vite API middleware
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...values] = trimmed.split('=');
        const val = values.join('=').trim();
        if (key && val && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    });
  }
} catch (e) {
  console.warn('[Vite API] Could not load .env file:', e.message);
}

export function vercelApiPlugin() {
  return {
    name: 'vite-plugin-vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/api/')) {
          const routeName = pathname.replace('/api/', '').split('?')[0];
          req.query = parsedUrl.query;

          try {
            // Collect request body for POST/PUT requests
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const bodyText = Buffer.concat(buffers).toString();
              if (bodyText) {
                try {
                  req.body = JSON.parse(bodyText);
                } catch {
                  req.body = bodyText;
                }
              }
            }

            // Helper status & json methods matching Vercel/Express response format
            res.status = function (code) {
              res.statusCode = code;
              return res;
            };
            res.json = function (data) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };

            // Dynamically import the handler file from project root /api/<routeName>.js
            const filePath = path.resolve(process.cwd(), `api/${routeName}.js`);
            const fileUrl = pathToFileURL(filePath).href;
            const handlerModule = await import(/* @vite-ignore */ `${fileUrl}?t=${Date.now()}`);
            const handler = handlerModule.default || handlerModule;

            await handler(req, res);
            return;
          } catch (err) {
            console.error(`[Vite API Middleware Error] ${pathname}:`, err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            }
            return;
          }
        }
        next();
      });
    },
  };
}

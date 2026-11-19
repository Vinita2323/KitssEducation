import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Content-Security-Policy for production builds, added to index.html as a <meta> tag so it travels with the build
// whatever serves it (nginx, Vercel). Scripts may come only from this site and Razorpay Checkout, which is what
// blocks injected scripts. The other sources stay as wide as the app needs: API media and PDFs (including book
// sample previews in <object>), Google Fonts, Firebase push (googleapis.com), Razorpay's checkout frames, admin-
// entered image URLs and pdf.js WebAssembly decoders. The dev server is left alone: it relies on inline scripts.
export function contentSecurityPolicy(apiBase = '') {
  const api = /^https?:\/\//i.test(apiBase) ? new URL(apiBase).origin : '';
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'wasm-unsafe-eval'", 'https://checkout.razorpay.com', 'https://*.razorpay.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'media-src': ["'self'", 'blob:', api],
    'connect-src': ["'self'", 'data:', 'blob:', api, 'https://*.razorpay.com', 'https://*.googleapis.com'],
    'frame-src': ["'self'", 'blob:', 'https://*.razorpay.com'],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'self'", api],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://*.razorpay.com'],
  };
  return Object.entries(directives).map(([name, sources]) => [name, ...sources.filter(Boolean)].join(' ')).join('; ');
}

const cspPlugin = apiBase => ({
  name: 'kitss-content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy(apiBase) }, injectTo: 'head-prepend' }],
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [
      react(),
      tailwindcss(),
      cspPlugin(env.VITE_API_BASE_URL),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
  };
});

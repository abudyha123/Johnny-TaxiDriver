// Builds the site against the emulators, serves it, runs the e2e scenario. CI only.
import { execSync, spawn } from 'node:child_process';
const env = {
  ...process.env,
  VITE_FIREBASE_API_KEY: 'fake-api-key', VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
  VITE_FIREBASE_PROJECT_ID: 'demo-johnny-taxi-e2e', VITE_FIREBASE_APP_ID: '1:1:web:e2e', VITE_FIREBASE_EMULATOR: '1',
};
execSync('npx vite build --outDir dist-e2e --emptyOutDir', { stdio: 'inherit', env });
const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-e2e', '--port', '4300', '--strictPort', '--host', '127.0.0.1'], { stdio: 'inherit', env });
await new Promise((r) => setTimeout(r, 3000));
let code = 1;
try { execSync('node tests/e2e/tracking.e2e.mjs', { stdio: 'inherit', env }); code = 0; } catch { code = 1; }
server.kill();
process.exit(code);

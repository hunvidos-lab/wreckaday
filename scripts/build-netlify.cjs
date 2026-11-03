const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const api = process.env.EXPO_PUBLIC_API_URL || '/api';
const env = { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_API_URL: api };
// Netlify serves this app at its domain root rather than GitHub's /wreckaday.
delete env.WRECKADAY_WEB_BASE_URL;
for (const [command, args] of [
  ['pnpm', ['--filter', 'mobile', 'exec', 'expo', 'export', '--platform', 'web', '--max-workers', '1']],
  ['node', ['scripts/check-console-release.cjs']],
]) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
const output = path.join(root, 'apps/mobile/dist');
let redirects = '';
if (api === '/api') {
  fs.writeFileSync(path.join(output, 'preview-capabilities.json'), JSON.stringify({
    data: {
      generation_available: false,
      photo_processing: 'Live generation is not connected to this hosted preview. Selecting a photo keeps it in your browser; no model call is made.',
    },
  }));
  redirects += '/api/v2/capabilities /preview-capabilities.json 200\n';
}
fs.writeFileSync(path.join(output, '_redirects'), redirects + '/* /index.html 200\n');
console.log('Netlify web export ready. Live generation requires a separately configured backend.');

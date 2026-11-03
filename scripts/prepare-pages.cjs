// GitHub Pages has no SPA rewrites. Give each app route an index for refreshes.
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve('apps/mobile/dist');
const html = fs.readFileSync(path.join(output, 'index.html'));
for (const entry of fs.readdirSync('apps/mobile/app', { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.tsx') || /^(index|_|\+)/.test(entry.name)) continue;
  const route = path.join(output, path.basename(entry.name, '.tsx'));
  fs.mkdirSync(route, { recursive: true });
  fs.writeFileSync(path.join(route, 'index.html'), html);
}
fs.writeFileSync(path.join(output, '404.html'), html);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Prepared GitHub Pages route entry points.');

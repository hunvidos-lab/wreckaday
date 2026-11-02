/* Run after expo export. Console implementation must be absent, not merely hidden. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('apps/mobile/dist/_expo/static/js');
const markers = ['/v2/dev/keys', 'Keys are written to the .env', 'WRECKDAY_TEXT_API_KEY'];
let checked = 0;
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.(js|hbc)$/.test(entry.name)) {
      const bytes = fs.readFileSync(file);
      if (markers.some(marker => bytes.includes(Buffer.from(marker)))) throw new Error(`Local console implementation leaked into release artifact: ${file}`);
      checked++;
    }
  }
}
visit(root);
if (!checked) throw new Error('No release artifacts found; export first.');
console.log(`PASS: ${checked} release artifacts contain no local console implementation.`);

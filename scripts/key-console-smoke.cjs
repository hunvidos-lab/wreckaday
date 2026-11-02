/* Real local API + browser + temporary .env; server-side provider HTTP is mocked. */
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wreckaday-console-test-'));
const envFile = path.join(directory, 'fixture.env');
const before = '# Browser test only\nUNRELATED=keep-this\n';
fs.writeFileSync(envFile, before + [
  'WRECKDAY_TEXT_ENDPOINT=https://api.cloudflare.com/client/v4/accounts/fixture/ai/v1/chat/completions',
  'WRECKDAY_TEXT_API_KEY=old-test-text-ab12', 'WRECKDAY_TEXT_MODEL=@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  'WRECKDAY_IMAGE_PROVIDER=fal', 'WRECKDAY_IMAGE_ENDPOINT=https://fal.run/fal-ai/flux-2/klein/4b/edit',
  'WRECKDAY_IMAGE_API_KEY=old-test-image-ef56', 'WRECKDAY_SESSION_BUDGET_USD=1',
  'WRECKDAY_DAILY_BUDGET_USD=2', 'WRECKDAY_LIVE_GENERATION_ENABLED=false',
  'WRECKDAY_TEXT_COST_CEILING_USD=0.01', 'WRECKDAY_IMAGE_COST_CEILING_USD=0.05',
].join('\n') + '\n', { mode: 0o600 });
const children = [];
const apiPort = process.env.WRECKDAY_TEST_API_PORT || '8000';
const webPort = process.env.WRECKDAY_TEST_WEB_PORT || '8081';
const origin = `http://localhost:${webPort}`;
const apiOrigin = `http://localhost:${apiPort}`;
fs.appendFileSync(envFile, `WRECKDAY_CORS_ORIGINS=${origin}\n`);
function start(args, extra) {
  const child = spawn('.venv/bin/python', ['scripts/dev-process.py', ...args], { stdio: 'ignore', env: { ...process.env, ...extra } });
  children.push(child); return child;
}
async function waitFor(url, child) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (child.exitCode !== null) throw new Error('Browser-test server exited during startup.');
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Browser-test server timed out.');
}
(async () => {
  for (const url of [`${apiOrigin}/healthz`, origin]) {
    try { await fetch(url); throw new Error('Test ports are occupied; stop the owning dev servers first.'); }
    catch (error) { if (error.message.startsWith('Test ports')) throw error; }
  }
  let browser;
  try {
    const api = start(['.venv/bin/uvicorn', 'console_preview:app', '--host', '127.0.0.1', '--port', apiPort, '--no-access-log'],
      { PYTHONPATH: 'services/api:services/api/tests', WRECKDAY_ENV_FILE: envFile, WRECKDAY_TEST_ENV_FILE: envFile });
    await waitFor(`${apiOrigin}/healthz`, api);
    const web = start(['pnpm', '--filter', 'mobile', 'web', '--port', webPort], { EXPO_NO_DOTENV: '1', EXPO_PUBLIC_API_URL: apiOrigin });
    await waitFor(origin, web);
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const field = label => page.getByLabel(label, { exact: true }).filter({ visible: true });
    page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(120000);
    const errors = [], external = [], generations = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (/^https?:/.test(request.url()) && !['localhost', '127.0.0.1'].includes(new URL(request.url()).hostname)) external.push(request.url());
      if (request.url().endsWith('/v2/generate')) generations.push(request.method());
    });
    await page.goto(origin);
    await expect(page.getByRole('link', { name: 'Keys', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Setup', exact: true }).click();
    await page.waitForURL(`${origin}/dev-keys`);
    await expect(field('Text API key')).toHaveCount(0);
    await field('Console token').fill('wrong-test-password');
    await page.getByRole('button', { name: 'Unlock console', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await field('Console token').fill('test-console-password');
    await page.getByRole('button', { name: 'Unlock console', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Keys', exact: true })).toBeVisible();
    await expect(field('Text API key')).toHaveValue('');
    await field('Text API key').fill('new-fixture-text-cd34');
    await field('Image API key').fill('new-fixture-image-gh78');
    await expect(field('Text API key')).toHaveAttribute('type', 'password');
    await page.getByRole('checkbox', { name: 'Enable live generation', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved to this computer. Settings are active now.', { exact: true })).toBeVisible();
    await expect(field('Text API key')).toHaveValue('');
    await expect(field('Image API key')).toHaveValue('');
    expect(await page.locator('body').innerText()).not.toContain('new-fixture-text-cd34');
    expect(fs.readFileSync(envFile, 'utf8').startsWith(before)).toBe(true);
    expect(fs.statSync(envFile).mode & 0o777).toBe(0o600);
    await page.getByRole('button', { name: 'Test text key', exact: true }).click();
    await expect(page.getByText('Key accepted by the no-generation check. No story was generated.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Test image key', exact: true }).click();
    await expect(page.getByText('Key accepted by the no-generation check. No story was generated.', { exact: true })).toBeVisible();
    expect(generations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    fs.mkdirSync('work/browser', { recursive: true });
    await page.screenshot({ path: 'work/browser/key-console-mobile.png', fullPage: true });
    await field('Text API key').fill('unsaved-should-disappear');
    await page.getByRole('link', { name: 'Wreckaday home', exact: true }).click();
    await page.waitForURL(`${origin}/`);
    await expect(page.getByRole('button', { name: 'Choose Flicker', exact: true })).toBeVisible();
    await expect.poll(() => page.getByLabel('Text API key', { exact: true }).evaluateAll(nodes => nodes.every(node => node.value === ''))).toBe(true);
    await page.getByRole('link', { name: 'Keys', exact: true }).click();
    await page.waitForURL(`${origin}/dev-keys`);
    await expect(field('Text API key')).toHaveCount(1);
    await expect(field('Text API key')).toHaveValue('');
    await page.getByRole('link', { name: 'Wreckaday home', exact: true }).click();
    await page.waitForURL(`${origin}/`);
    await expect(page.getByRole('button', { name: 'Choose Flicker', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Choose Flicker', exact: true }).click();
    await page.waitForURL(`${origin}/compose`);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose my photo', exact: true }).click();
    await (await chooser).setFiles('apps/mobile/assets/examples/penthouse.png');
    await field('YOUR PAYBACK PREMISE').fill('Put me in a fictional penthouse with a throne of red roses.');
    for (const label of ['I’m 18 or older.', 'This photo is of me. I authorize its use in this prank.', 'I agree to that processing for this generation.']) await page.getByRole('checkbox', { name: label, exact: true }).click();
    await page.getByRole('button', { name: 'Generate my prank', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Scene 1', exact: true })).toBeVisible();
    expect(generations.filter(method => method === 'POST')).toHaveLength(1);
    await page.getByRole('link', { name: 'Keys', exact: true }).click();
    await page.waitForURL(`${origin}/dev-keys`);
    await page.getByRole('button', { name: 'Lock console', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Keys', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(field('Console token')).toHaveValue('');
    const stored = await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage));
    for (const privateValue of ['new-fixture-text-cd34', 'new-fixture-image-gh78', 'test-console-password']) expect(stored).not.toContain(privateValue);
    expect(errors).toEqual([]); expect(external).toEqual([]);
    console.log(JSON.stringify({ passed: true, authenticatedConsole: true, maskedReads: true, atomicSaveAndHotReload: true, emptySecretInputs: true, zeroGenerationKeyTests: true, oneScene: 'mocked provider HTTP', browserStorageHasNoKeys: true, externalRequests: 0, actualEnvAndDesktopUntouched: true }));
  } finally {
    if (browser) await browser.close();
    for (const child of children) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
    await new Promise(resolve => setTimeout(resolve, 1500));
    for (const child of children) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });

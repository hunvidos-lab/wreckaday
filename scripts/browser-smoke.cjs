/* Examples -> own photo -> premise -> consent -> generation -> result.
   Browser provider responses are explicitly mocked. No inference spend or real
   photo transfer to an external model is performed by this check. */
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const origin = process.env.WRECKADAY_WEB_ORIGIN || 'http://localhost:8081';
const apiOrigin = 'http://localhost:8000';
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(60000);
    const errors = [], unexpected = [], writes = [];
    const cors = { 'Access-Control-Allow-Origin': new URL(origin).origin };
    let available = true, hold = false, release = null;
    const resultPhoto = 'data:image/png;base64,' + fs.readFileSync('apps/mobile/assets/examples/upgrade.png').toString('base64');
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { const url = request.url(); if (/^https?:/.test(url) && ![new URL(origin).origin, apiOrigin].includes(new URL(url).origin)) unexpected.push(url); });
    await page.route(`${apiOrigin}/v2/**`, async route => {
      if (route.request().method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': new URL(origin).origin, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key' } }); return; }
      if (route.request().url().endsWith('/capabilities')) { await route.fulfill({ headers: cors, json: { data: { generation_available: available, photo_processing: 'Test provider: your photo is processed only after you agree and start generation.' } } }); return; }
      if (route.request().url().includes('/v2/dev/keys')) { await route.fulfill({ status: 404, headers: cors, json: { error: { message: 'Console disabled in this test.' } } }); return; }
      const body = route.request().postDataJSON();
      expect(body.photo_data_url).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
      expect(body.adult_confirmed && body.own_photo_confirmed && body.provider_processing_confirmed).toBe(true);
      writes.push({ package: body.package_id, premise: body.premise });
      const count = { flicker: 1, blaze: 3, inferno: 5 }[body.package_id];
      if (hold) await new Promise(resolve => { release = resolve; });
      try { await route.fulfill({ headers: cors, json: { data: { scenes: Array.from({ length: count }, (_, i) => ({ caption: `Test-generated scene ${i + 1}. Point made.`, image_data_url: resultPhoto })), cost_ceiling_usd: '0.00' } } }); } catch (error) { if (!hold) throw error; }
    });
    fs.mkdirSync('work/browser', { recursive: true });
    async function setup(name) {
      await page.goto(origin);
      await page.getByRole('button', { name: `Choose ${name}`, exact: true }).click();
      await page.waitForURL('**/compose');
      await expect(page.getByRole('button', { name: 'Generate my prank', exact: true })).toBeDisabled();
      const chooser = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Choose my photo', exact: true }).click();
      await (await chooser).setFiles('apps/mobile/assets/examples/penthouse.png');
      await expect(page.getByLabel('Your selected reference photo', { exact: true })).toBeVisible();
      await page.getByLabel('YOUR PAYBACK PREMISE', { exact: true }).fill('Put me in a penthouse on a throne of roses. A fictional payback reveal.');
      await page.getByRole('checkbox', { name: 'I’m 18 or older.', exact: true }).click();
      await page.getByRole('checkbox', { name: 'This photo is of me. I authorize its use in this prank.', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Generate my prank', exact: true })).toBeDisabled();
      await page.getByRole('checkbox', { name: 'I agree to that processing for this generation.', exact: true }).click();
    }
    await page.goto(origin);
    await expect(page.getByLabel(/^Photorealistic example:/)).toHaveCount(3);
    const examples = await page.getByText('SEE WHAT PAYBACK LOOKS LIKE', { exact: true }).boundingBox();
    const prices = await page.getByText('CHOOSE HOW FAR THE STORY GOES', { exact: true }).boundingBox();
    expect(examples.y).toBeLessThan(prices.y);
    await page.screenshot({ path: 'work/browser/payback-landing.png' });
    for (const [name, count] of [['Flicker', 1], ['Blaze', 3], ['Inferno', 5]]) {
      const before = writes.length;
      await setup(name);
      expect(writes.length).toBe(before);
      await page.getByRole('button', { name: 'Generate my prank', exact: true }).click();
      await expect(page.getByRole('button', { name: /^Scene \d+$/ })).toHaveCount(count);
      expect(writes.length).toBe(before + 1);
      await page.getByLabel('CAPTION 1', { exact: true }).fill('The punchline stays with this photo.');
      if (count > 1) { await page.getByRole('button', { name: 'Move later', exact: true }).click(); await expect(page.getByLabel('CAPTION 2', { exact: true })).toHaveValue('The punchline stays with this photo.'); }
      if (name === 'Inferno') await page.getByLabel('CAPTION 2', { exact: true }).fill('W'.repeat(140));
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download this scene as PNG', exact: true }).click();
      const file = `work/browser/payback-${name.toLowerCase()}.png`;
      await (await downloadPromise).saveAs(file);
      const png = fs.readFileSync(file);
      expect(png.readUInt32BE(16)).toBe(1080); expect(png.readUInt32BE(20)).toBe(1920);
      await page.getByText('THE RESULT / REVIEW BEFORE YOU SHARE', { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `work/browser/payback-${name.toLowerCase()}-desktop.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `work/browser/payback-${name.toLowerCase()}-mobile.png` });
      await page.setViewportSize({ width: 1280, height: 1000 });
      await page.getByRole('button', { name: 'Clear this session', exact: true }).click();
      await page.getByRole('button', { name: 'Clear draft & local cache', exact: true }).click();
      await page.waitForURL(origin + '/');
      await page.getByRole('button', { name: 'Design my payback →', exact: true }).click();
      await expect(page.getByLabel('YOUR PAYBACK PREMISE', { exact: true })).toHaveValue('');
      await expect(page.getByLabel('Your selected reference photo', { exact: true })).toHaveCount(0);
    }
    available = false;
    const before = writes.length;
    await setup('Flicker');
    await expect(page.getByText('Live generation is not connected. Your photo will stay here.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate my prank', exact: true })).toBeDisabled();
    expect(writes.length).toBe(before);
    await page.reload();
    await expect(page.getByLabel('YOUR PAYBACK PREMISE', { exact: true })).toHaveValue('');
    available = true; hold = true;
    await setup('Blaze');
    const pending = page.waitForRequest(request => request.method() === 'POST' && request.url().endsWith('/v2/generate'));
    await page.getByRole('button', { name: 'Generate my prank', exact: true }).click();
    await pending;
    await expect.poll(() => release !== null).toBe(true);
    await page.getByRole('button', { name: 'Clear this session', exact: true }).click();
    await page.getByRole('button', { name: 'Clear draft & local cache', exact: true }).click();
    await page.waitForURL(origin + '/');
    release();
    await page.getByRole('button', { name: 'Design my payback →', exact: true }).click();
    await expect(page.getByLabel('Generated photorealistic prank scene', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('YOUR PAYBACK PREMISE', { exact: true })).toHaveValue('');
    expect(unexpected).toEqual([]); expect(errors).toEqual([]);
    console.log(JSON.stringify({ passed: true, examplesBeforePrices: true, packages: 3, generation: 'mocked-provider responses', noAutomaticPhotoUpload: true, consentGate: true, disabledProviderGate: true, clearCancelsStaleResult: true, pngDimensions: '1080x1920', externalProviderRequests: unexpected, pageErrors: errors }));
  } catch (error) {
    const page = browser.contexts()[0]?.pages()[0];
    if (page) await page.screenshot({ path: "work/browser/payback-failure.png" }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

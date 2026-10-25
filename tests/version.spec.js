// @ts-check
const { test, expect } = require('@playwright/test');
const { readFileSync } = require('fs');
const { join } = require('path');

test.describe('G-8 version coherence', () => {
  test('VERSION.json swCache matches sw.js CACHE and register query', () => {
    const root = process.cwd();
    const version = JSON.parse(readFileSync(join(root, 'VERSION.json'), 'utf8'));
    const sw = readFileSync(join(root, 'sw.js'), 'utf8');
    const app = readFileSync(join(root, 'js/app.js'), 'utf8');
    const cache = (sw.match(/const CACHE = '([^']+)'/) || [])[1];
    const reg = (app.match(/sw\.js\?v=([^'"]+)/) || [])[1];
    expect(cache).toBe(version.swCache);
    expect(`steadycap-v${reg}`).toBe(version.swCache);
  });

  test('SW precaches HIG shell deps and local fonts', () => {
    const sw = readFileSync(join(process.cwd(), 'sw.js'), 'utf8');
    for (const asset of [
      './css/design/tokens.css',
      './css/cascade.css',
      './js/ui/scroll-lock.js',
      './js/cap-desktop-nav.js',
      './js/hig-dt.js',
      './assets/fonts/source-sans-3.woff2',
    ]) {
      expect(sw, asset).toContain(`'${asset}'`);
    }
  });
});

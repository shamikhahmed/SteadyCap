// @ts-check
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  workers: 1, // python http.server is not safe under parallel workers
  use: {
    baseURL: 'http://127.0.0.1:8768',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node scripts/qa-serve.mjs',
    cwd: __dirname,
    url: 'http://127.0.0.1:8768',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

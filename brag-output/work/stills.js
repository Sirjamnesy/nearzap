const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const times = process.argv.slice(3).map(Number), out = process.argv[2];
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto('file://' + path.resolve(__dirname, 'film.html')); await pg.evaluate(() => window.ready);
  for (const t of times) { await pg.evaluate(t => seek(t), t); await pg.screenshot({ path: `${out}/s_${t.toFixed(2)}.jpg`, quality: 70, type: 'jpeg' }); }
  await b.close();
})();

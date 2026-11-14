const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const FPS = 30, DUR = 22, out = process.argv[2];
  const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-',
    '-i','music_norm.wav','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k',
    '-movflags','+faststart','-shortest', out], { stdio: ['pipe','inherit','inherit'] });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto('file://' + path.resolve(__dirname, 'film.html')); await pg.evaluate(() => window.ready);
  for (let f = 0; f < FPS * DUR; f++) {
    await pg.evaluate(t => seek(t), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await b.close();
  await new Promise(r => ff.on('close', r)); console.log('done');
})();

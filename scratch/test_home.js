const { spawn } = require('child_process');
const fs = require('fs');

async function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === id) { ws.removeEventListener('message', h); resolve(m.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1000));
  const version = await (await fetch('http://127.0.0.1:9228/json/version')).json();
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => browserWs.addEventListener('open', r));

  const { targetId } = await cdp(browserWs, 'Target.createTarget', { url: 'about:blank' });
  const targets = await (await fetch('http://127.0.0.1:9228/json/list')).json();
  const pageWs = new WebSocket(targets.find(t => t.id === targetId).webSocketDebuggerUrl);
  await new Promise(r => pageWs.addEventListener('open', r));

  await cdp(pageWs, 'Page.enable');

  for (const w of [412, 980]) {
    await cdp(pageWs, 'Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w <= 768 });
    await cdp(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5050/' });
    await new Promise(r => setTimeout(r, 600));
    
    // Header screenshot
    const shot = await cdp(pageWs, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/home_fixed_' + w + '.png', Buffer.from(shot.data, 'base64'));

    // Scroll to values grid
    await cdp(pageWs, 'Runtime.evaluate', { expression: 'document.querySelector(".values-grid").scrollIntoView();' });
    await new Promise(r => setTimeout(r, 400));
    const shotValues = await cdp(pageWs, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/home_values_fixed_' + w + '.png', Buffer.from(shotValues.data, 'base64'));
    console.log('Saved home screenshots for ' + w + 'px');
  }

  await cdp(browserWs, 'Target.closeTarget', { targetId });
  chrome.kill();
  process.exit(0);
}
run().catch(console.error);

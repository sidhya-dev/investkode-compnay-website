const http = require('http');
const fs = require('fs');

async function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const version = await versionRes.json();
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => browserWs.addEventListener('open', r));

  const { targetId } = await cdp(browserWs, 'Target.createTarget', { url: 'about:blank' });
  const targetsRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.id === targetId);
  
  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => pageWs.addEventListener('open', r));

  await cdp(pageWs, 'Page.enable');

  const configs = [
    { page: '/contact.html', w: 980, name: 'contact_980.png' },
    { page: '/pricing.html', w: 980, name: 'pricing_980.png' },
    { page: '/', w: 980, name: 'home_980.png' },
    { page: '/contact.html', w: 412, name: 'contact_412.png' },
    { page: '/pricing.html', w: 412, name: 'pricing_412.png' },
    { page: '/', w: 412, name: 'home_412.png' }
  ];

  for (const c of configs) {
    await cdp(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: c.w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: c.w <= 768
    });

    await cdp(pageWs, 'Page.navigate', { url: `http://127.0.0.1:5050${c.page}` });
    await new Promise(r => setTimeout(r, 800));

    const shotRes = await cdp(pageWs, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/${c.name}`, Buffer.from(shotRes.data, 'base64'));
    console.log(`Saved scratch/${c.name}`);
  }

  await cdp(pageWs, 'Target.closeTarget', { targetId });
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

const { spawn } = require('child_process');

async function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === id) {
        ws.removeEventListener('message', h);
        if (m.error) reject(m.error);
        else resolve(m.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1000));
  const version = await (await fetch('http://127.0.0.1:9225/json/version')).json();
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => browserWs.addEventListener('open', r));

  const { targetId } = await cdp(browserWs, 'Target.createTarget', { url: 'about:blank' });
  const targets = await (await fetch('http://127.0.0.1:9225/json/list')).json();
  const pageTarget = targets.find(t => t.id === targetId);

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => pageWs.addEventListener('open', r));

  await cdp(pageWs, 'Page.enable');
  await cdp(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5050/' });
  await new Promise(r => setTimeout(r, 600));

  for (const w of [360, 390, 412]) {
    await cdp(pageWs, 'Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: true });
    await new Promise(r => setTimeout(r, 150));
    const res = await cdp(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('#apply a')).map(a => ({
          text: a.innerText,
          scrollWidth: a.scrollWidth,
          offsetWidth: a.offsetWidth,
          rectRight: Math.round(a.getBoundingClientRect().right),
          parentWidth: a.parentElement.offsetWidth
        }));
        const heroBadge = document.querySelector('.hero-badge');
        const heroBadgeW = heroBadge ? heroBadge.offsetWidth : 0;
        const heroBadgeRight = heroBadge ? Math.round(heroBadge.getBoundingClientRect().right) : 0;
        return {
          viewportW: ${w},
          btns,
          heroBadgeW,
          heroBadgeRight,
          bodyScrollW: document.body.scrollWidth,
          docScrollW: document.documentElement.scrollWidth
        };
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));
  }

  await cdp(browserWs, 'Target.closeTarget', { targetId });
  chrome.kill();
  process.exit(0);
}

run().catch(console.error);

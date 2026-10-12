const { spawn } = require('child_process');

async function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === id) {
        ws.removeEventListener('message', handler = h);
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
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1000));
  const version = await (await fetch('http://127.0.0.1:9224/json/version')).json();
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => browserWs.addEventListener('open', r));

  const { targetId } = await cdp(browserWs, 'Target.createTarget', { url: 'about:blank' });
  const targets = await (await fetch('http://127.0.0.1:9224/json/list')).json();
  const pageTarget = targets.find(t => t.id === targetId);

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => pageWs.addEventListener('open', r));

  await cdp(pageWs, 'Page.enable');

  const pages = ['/contact.html', '/about.html', '/pricing.html'];

  for (const p of pages) {
    console.log('\n--- Checking ' + p + ' ---');
    await cdp(pageWs, 'Page.navigate', { url: `http://127.0.0.1:5050${p}` });
    await new Promise(r => setTimeout(r, 600));

    for (const w of [360, 390, 412, 600, 768, 769, 820, 900, 980, 1024]) {
      await cdp(pageWs, 'Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: w <= 768 });
      await new Promise(r => setTimeout(r, 100));
      const res = await cdp(pageWs, 'Runtime.evaluate', {
        expression: `(() => {
          const links = document.querySelector('.nav-links');
          const toggle = document.querySelector('.nav-toggle');
          const cta = document.querySelector('.nav-cta');
          const actions = document.querySelector('.nav-actions');
          const logo = document.querySelector('.nav-logo');
          return {
            w: ${w},
            linksDisplay: links ? window.getComputedStyle(links).display : 'none',
            toggleDisplay: toggle ? window.getComputedStyle(toggle).display : 'none',
            docScrollW: document.documentElement.scrollWidth,
            docClientW: document.documentElement.clientWidth
          };
        })()`,
        returnByValue: true
      });
      console.log(JSON.stringify(res.result.value));
    }
  }

  await cdp(browserWs, 'Target.closeTarget', { targetId });
  chrome.kill();
  process.exit(0);
}

run().catch(console.error);

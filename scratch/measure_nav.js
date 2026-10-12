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
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1000));

  const version = await (await fetch('http://127.0.0.1:9223/json/version')).json();
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => browserWs.addEventListener('open', r));

  const { targetId } = await cdp(browserWs, 'Target.createTarget', { url: 'about:blank' });
  const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
  const pageTarget = targets.find(t => t.id === targetId);

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => pageWs.addEventListener('open', r));

  await cdp(pageWs, 'Page.enable');
  await cdp(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5050/' });
  await new Promise(r => setTimeout(r, 800));

  console.log('Testing breakpoints on Home Page:');
  for (const w of [360, 390, 412, 480, 600, 768, 769, 820, 900, 980, 1024, 1200]) {
    await cdp(pageWs, 'Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: w <= 768 });
    await new Promise(r => setTimeout(r, 150));
    const res = await cdp(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const logo = document.querySelector('.nav-logo');
        const links = document.querySelector('.nav-links');
        const actions = document.querySelector('.nav-actions');
        const toggle = document.querySelector('.nav-toggle');
        const navInner = document.querySelector('.nav-inner');
        return {
          width: ${w},
          logoW: logo ? Math.round(logo.getBoundingClientRect().width) : 0,
          linksW: links ? Math.round(links.getBoundingClientRect().width) : 0,
          linksDisplay: links ? window.getComputedStyle(links).display : 'none',
          actionsW: actions ? Math.round(actions.getBoundingClientRect().width) : 0,
          toggleDisplay: toggle ? window.getComputedStyle(toggle).display : 'none',
          totalNavItemsW: (logo ? logo.offsetWidth : 0) + (links && window.getComputedStyle(links).display !== 'none' ? links.offsetWidth : 0) + (actions ? actions.offsetWidth : 0),
          navInnerW: navInner ? navInner.clientWidth : 0,
          navInnerScrollW: navInner ? navInner.scrollWidth : 0
        };
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value));
  }

  await cdp(browserWs, 'Target.closeTarget', { targetId });
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

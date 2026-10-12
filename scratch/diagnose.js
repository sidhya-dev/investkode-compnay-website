const { spawn } = require('child_process');

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
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  const versionRes = await fetch('http://127.0.0.1:9229/json/version');
  const version = await versionRes.json();
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => browserWs.addEventListener('open', r));

  const { targetId } = await cdp(browserWs, 'Target.createTarget', { url: 'about:blank' });
  const targets = await (await fetch('http://127.0.0.1:9229/json/list')).json();
  const pageWs = new WebSocket(targets.find(t => t.id === targetId).webSocketDebuggerUrl);
  await new Promise(r => pageWs.addEventListener('open', r));

  await cdp(pageWs, 'Page.enable');

  const pages = [
    '/',
    '/about.html',
    '/contact.html',
    '/pricing.html',
    '/privacy.html',
    '/terms.html',
    '/refund-policy.html'
  ];

  const widths = [320, 360, 390, 412, 600, 768, 850, 980, 1024, 1200];
  let totalFails = 0;

  for (const pagePath of pages) {
    console.log(`\n========================================`);
    console.log(`VALIDATING: ${pagePath}`);
    console.log(`========================================`);

    for (const w of widths) {
      await cdp(pageWs, 'Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 850,
        deviceScaleFactor: 1,
        mobile: w <= 992
      });

      await cdp(pageWs, 'Page.navigate', { url: `http://127.0.0.1:5050${pagePath}` });
      await new Promise(r => setTimeout(r, 350));

      const evalRes = await cdp(pageWs, 'Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const bodyWidth = document.body.scrollWidth;
            const winWidth = window.innerWidth;
            const isOverflow = docWidth > winWidth || bodyWidth > winWidth;

            const navLinks = document.querySelector('.nav-links');
            const navToggle = document.querySelector('.nav-toggle');
            const navLinksDisplay = navLinks ? window.getComputedStyle(navLinks).display : 'none';
            const navToggleDisplay = navToggle ? window.getComputedStyle(navToggle).display : 'none';

            let overflowing = [];
            if (isOverflow) {
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const r = el.getBoundingClientRect();
                if (r.right > winWidth + 1) {
                  overflowing.push({
                    tag: el.tagName,
                    cls: (el.className || '').toString().slice(0, 30),
                    right: Math.round(r.right),
                    w: Math.round(r.width)
                  });
                }
              }
            }

            return {
              winWidth,
              docWidth,
              bodyWidth,
              isOverflow,
              navLinksDisplay,
              navToggleDisplay,
              overflowing: overflowing.slice(0, 3)
            };
          })()
        `,
        returnByValue: true
      });

      const res = evalRes.result.value;
      if (res.isOverflow) {
        totalFails++;
        console.log(`[FAIL] ${w}px: docWidth=${res.docWidth}px, bodyWidth=${res.bodyWidth}px > ${res.winWidth}px`);
        console.log(`       Overflow elements:`, res.overflowing);
      } else {
        const navState = w <= 992 ? `[Mobile: links=${res.navLinksDisplay}, toggle=${res.navToggleDisplay}]` : `[Desktop: links=${res.navLinksDisplay}]`;
        console.log(`[PASS] ${w}px: OK. ${navState}`);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`VALIDATION SUMMARY: ${totalFails === 0 ? 'ALL PASSED (0 failures)' : totalFails + ' FAILURES'}`);
  console.log(`========================================`);

  await cdp(browserWs, 'Target.closeTarget', { targetId });
  chrome.kill();
  process.exit(totalFails === 0 ? 0 : 1);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

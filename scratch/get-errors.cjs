const WebSocket = require('ws');
const http = require('http');

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const targets = JSON.parse(data);
    const page = targets.find(t => t.type === 'page');
    if (!page) return console.log('No page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));
      ws.send(JSON.stringify({ id: 4, method: 'Runtime.evaluate', params: { expression: 'location.reload()' } }));
      console.log('Connected to debugger. Triggered reload. Waiting for events (5 seconds)...');
      setTimeout(() => ws.close(), 5000);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id === 5) {
        console.log('HTML:', msg.result.result.value);
      }
      if (msg.method === 'Log.entryAdded') {
        console.log('LOG:', msg.params.entry.text);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.log('EXCEPTION:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
      } else if (msg.method === 'Network.loadingFailed') {
        console.log('NETWORK FAILED:', msg.params.errorText, 'URL:', msg.params.url);
      }
    });

    setTimeout(() => {
      ws.send(JSON.stringify({ id: 5, method: 'Runtime.evaluate', params: { expression: 'document.documentElement.outerHTML', returnByValue: true } }));
    }, 2000);
  });
});

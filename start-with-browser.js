const { spawn } = require('child_process');
const config = require('./config');

const url = `http://localhost:${config.PORT}`;

function openBrowser(targetUrl) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', targetUrl], {
      stdio: 'ignore',
      detached: true,
    }).unref();
    return;
  }

  const browserCommand = process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(browserCommand, [targetUrl], { stdio: 'ignore', detached: true }).unref();
}

const child = spawn(process.execPath, ['index.js'], {
  stdio: 'inherit',
  cwd: __dirname,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

setTimeout(() => {
  openBrowser(url);
}, 1000);

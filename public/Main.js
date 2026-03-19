'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const dns = require('dns');

require('electron-reload')(__dirname);

let win;
let monitorInterval;

const dnsCache = new Map();
const dnsInFlight = new Set();

function resolveDns(ip) {
  if (!ip || ip === '*' || dnsCache.has(ip) || dnsInFlight.has(ip)) return;
  dnsInFlight.add(ip);
  dns.reverse(ip, (err, hostnames) => {
    dnsInFlight.delete(ip);
    if (!err && hostnames && hostnames.length > 0) {
      dnsCache.set(ip, hostnames[0]);
    } else {
      dnsCache.set(ip, ip); // cache the IP itself to avoid retries
    }
  });
}

function parseLsofOutput(output) {
  const lines = output.split('\n').slice(1); // skip header line
  const connections = [];
  const seen = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;

    // lsof columns: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;

    const command = parts[0];
    const pid = parseInt(parts[1], 10);
    const user = parts[2];
    const fdType = parts[4]; // IPv4 or IPv6
    const protocol = parts[7]; // TCP or UDP

    if (!['TCP', 'UDP'].includes(protocol)) continue;
    if (isNaN(pid)) continue;

    // NAME field: "localAddr:port->remoteAddr:port (STATE)" or "localAddr:port (STATE)"
    const namePart = parts.slice(8).join(' ');
    const stateMatch = namePart.match(/\((\w+_?\w*)\)$/);
    const state = stateMatch ? stateMatch[1] : (protocol === 'UDP' ? 'UDP' : 'LISTEN');
    const nameClean = namePart.replace(/\s*\(\w+_?\w*\)$/, '').trim();

    let localAddress = '', localPort = '', remoteAddress = '', remotePort = '';

    if (nameClean.includes('->')) {
      const arrowIdx = nameClean.indexOf('->');
      const localStr = nameClean.slice(0, arrowIdx);
      const remoteStr = nameClean.slice(arrowIdx + 2);

      const parseAddr = (str) => {
        // Handle IPv6 [::1]:port and IPv4 addr:port
        const ipv6Match = str.match(/^\[(.+)\]:(\d+|\*)$/);
        if (ipv6Match) return { addr: ipv6Match[1], port: ipv6Match[2] };
        const lastColon = str.lastIndexOf(':');
        if (lastColon === -1) return { addr: str, port: '' };
        return { addr: str.slice(0, lastColon), port: str.slice(lastColon + 1) };
      };

      const local = parseAddr(localStr);
      const remote = parseAddr(remoteStr);
      localAddress = local.addr;
      localPort = local.port;
      remoteAddress = remote.addr;
      remotePort = remote.port;
    } else {
      const lastColon = nameClean.lastIndexOf(':');
      if (lastColon !== -1) {
        localAddress = nameClean.slice(0, lastColon).replace(/[\[\]]/g, '');
        localPort = nameClean.slice(lastColon + 1);
      }
    }

    if (!localAddress) continue;

    // Deduplicate by key
    const key = `${pid}-${protocol}-${localAddress}:${localPort}-${remoteAddress}:${remotePort}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Trigger async DNS lookup for remote address
    if (remoteAddress && remoteAddress !== '*' && !remoteAddress.startsWith('127.')) {
      resolveDns(remoteAddress);
    }

    connections.push({
      id: key,
      command,
      pid,
      user,
      protocol,
      fdType,
      localAddress,
      localPort,
      remoteAddress,
      remotePort,
      state,
      remoteHost: dnsCache.get(remoteAddress) || remoteAddress,
      timestamp: Date.now(),
    });
  }

  return connections;
}

function getConnections() {
  return new Promise((resolve) => {
    exec('lsof -i -n -P 2>/dev/null', { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (!stdout) {
        resolve([]);
        return;
      }
      resolve(parseLsofOutput(stdout));
    });
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d1117',
    title: 'Witness',
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadURL('http://localhost:3000/');

  win.on('closed', () => {
    win = null;
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
  });

  win.webContents.on('did-finish-load', () => {
    startMonitoring();
  });
}

function startMonitoring() {
  async function poll() {
    if (!win || !win.webContents) return;
    try {
      const connections = await getConnections();
      if (win && win.webContents) {
        win.webContents.send('connections-update', connections);
      }
    } catch (e) {
      console.error('Monitor poll error:', e);
    }
  }

  poll();
  monitorInterval = setInterval(poll, 2000);
}

ipcMain.on('request-connections', async (event) => {
  const connections = await getConnections();
  event.reply('connections-update', connections);
});

ipcMain.on('block-connection', (event, { remoteAddress, remotePort, protocol }) => {
  const proto = (protocol || 'tcp').toLowerCase();
  const cmd = `iptables -A OUTPUT -p ${proto} -d ${remoteAddress} --dport ${remotePort} -j DROP 2>&1`;
  exec(`sudo ${cmd}`, (err, stdout, stderr) => {
    const success = !err;
    event.reply('block-result', { success, remoteAddress, remotePort, error: stderr });
  });
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

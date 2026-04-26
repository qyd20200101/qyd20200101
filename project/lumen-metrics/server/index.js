const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Data
let rules = [
  { id: 1, name: '高频报错拦截 (Real API)', condition: 'ERROR_COUNT > 100 in 1m', level: 'CRITICAL', active: true },
  { id: 2, name: '接口响应超时 (Real API)', condition: 'RESPONSE_TIME > 500ms persist 3 times', level: 'WARNING', active: true },
  { id: 3, name: 'CPU 负载过高 (Real API)', condition: 'SYSTEM_CPU > 90% in 5m', level: 'CRITICAL', active: false },
];

let users = [
  { id: 1, username: 'admin@lumen.io (Real)', role: 'Super Admin', permissions: ['ALL_ACCESS', 'AUDIT_LOGS'], lastLogin: '2026-04-25 10:23' },
  { id: 2, username: 'dev_ops@lumen.io (Real)', role: 'Operator', permissions: ['VIEW_DASHBOARD', 'EDIT_RULES'], lastLogin: '2026-04-24 18:05' },
];

// Auth API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Simple mock check
  if (username === 'admin@lumen.io' && password === 'admin123') {
    res.json({
      code: 200,
      message: 'success',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: { username: 'admin@lumen.io', role: 'Super Admin' }
      }
    });
  } else {
    res.status(401).json({ code: 401, message: 'Invalid credentials' });
  }
});

// RESTful APIs
app.get('/api/rules', (req, res) => {
  res.json({ code: 200, message: 'success', data: rules });
});

app.post('/api/rules', (req, res) => {
  const newRule = { id: Date.now(), ...req.body };
  rules.push(newRule);
  res.json({ code: 200, message: 'created', data: newRule });
});

app.put('/api/rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = rules.findIndex(r => r.id === id);
  if (index !== -1) {
    rules[index] = { ...rules[index], ...req.body };
    res.json({ code: 200, message: 'updated', data: rules[index] });
  } else {
    res.status(404).json({ code: 404, message: 'not found' });
  }
});

app.delete('/api/rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  rules = rules.filter(r => r.id !== id);
  res.json({ code: 200, message: 'deleted' });
});

app.get('/api/rbac/users', (req, res) => {
  res.json({ code: 200, message: 'success', data: users });
});

app.put('/api/rbac/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json({ code: 200, message: 'updated', data: users[index] });
  } else {
    res.status(404).json({ code: 404, message: 'not found' });
  }
});

// Create HTTP Server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/metrics' });

wss.on('connection', (ws) => {
  console.log('[WS] Client connected to /metrics');
  
  let qpsBase = 200;
  let cpuBase = 30;
  
  // Push data every 100ms (10 times per sec) to simulate high frequency
  const timer = setInterval(() => {
    qpsBase = Math.max(50, Math.min(1000, qpsBase + (Math.random() - 0.5) * 50));
    cpuBase = Math.max(5, Math.min(95, cpuBase + (Math.random() - 0.5) * 5));
    
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const payload = {
      type: 'METRICS_TICK',
      payload: {
        time: timeStr,
        qps: Math.floor(qpsBase),
        cpu: Math.floor(cpuBase)
      }
    };
    
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, 100);
  
  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    clearInterval(timer);
  });
});

// Broadcast Real-time Logs with Tenant ID
setInterval(() => {
  const levels = ['INFO', 'WARN', 'ERROR'];
  const messages = ['User login', 'DB Query', 'API Call', 'Cache Hit', 'Disk usage high'];
  const tenants = ['tenant_alpha', 'tenant_beta'];
  
  const log = {
    id: Date.now(),
    timestamp: Date.now(),
    level: levels[Math.floor(Math.random() * levels.length)],
    message: `${messages[Math.floor(Math.random() * messages.length)]} [TraceID: ${Math.random().toString(36).substring(7)}]`,
    tenantId: tenants[Math.floor(Math.random() * tenants.length)]
  };

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'log', payload: log }));
    }
  });
}, 2000); 

// Simulate Alarm Rule Triggers with Tenant ID
setInterval(() => {
  const alarmRules = [
    { name: '高频报错拦截', level: 'CRITICAL', condition: 'ERROR_COUNT > 100 in 1m', tenantId: 'tenant_alpha' },
    { name: '接口响应超时', level: 'WARNING', condition: 'RESPONSE_TIME > 500ms', tenantId: 'tenant_beta' }
  ];
  
  if (Math.random() > 0.9) {
    const rule = alarmRules[Math.floor(Math.random() * alarmRules.length)];
    const alert = {
      id: Date.now(),
      title: `告警触发: ${rule.name}`,
      message: `检测到异常行为: ${rule.condition}`,
      level: rule.level,
      timestamp: new Date().toLocaleTimeString(),
      tenantId: rule.tenantId
    };
    
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'alert', payload: alert }));
      }
    });
  }
}, 5000);

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Backend Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket Server is running on ws://localhost:${PORT}/metrics`);
});

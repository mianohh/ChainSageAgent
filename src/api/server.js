import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAlerts, getAlertsByWallet, getStats } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createServer(agent) {
  const app = express();
  
  app.use(express.json());
  
  // Security headers
  app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Rate limiting middleware (simple implementation)
  const requestCounts = new Map();
  const RATE_LIMIT = 100; // requests per minute
  const RATE_WINDOW = 60000; // 1 minute
  
  app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const userRequests = requestCounts.get(ip) || [];
    const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);
    
    if (recentRequests.length >= RATE_LIMIT) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    next();
  });

  // Clean up old rate limit data every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, requests] of requestCounts.entries()) {
      const recent = requests.filter(time => now - time < RATE_WINDOW);
      if (recent.length === 0) {
        requestCounts.delete(ip);
      } else {
        requestCounts.set(ip, recent);
      }
    }
  }, 300000);
  
  app.use(express.static(join(__dirname, '../../public')));

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: Date.now(),
      agent: agent.getStatus()
    });
  });

  app.get('/api/agent/status', (req, res) => {
    res.json(agent.getStatus());
  });

  app.post('/api/agent/start', (req, res) => {
    try {
      agent.start();
      res.json({ success: true, message: 'Agent started', status: agent.getStatus() });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/agent/stop', (req, res) => {
    try {
      agent.stop();
      res.json({ success: true, message: 'Agent stopped', status: agent.getStatus() });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/alerts', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const alerts = getAlerts(limit, offset);
      res.json({ success: true, count: alerts.length, alerts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/alerts/wallet/:address', (req, res) => {
    try {
      const { address } = req.params;
      
      // Validate wallet address
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ success: false, error: 'Invalid wallet address format' });
      }
      
      const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
      const alerts = getAlertsByWallet(address, limit);
      res.json({ success: true, count: alerts.length, alerts });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.get('/api/stats', (req, res) => {
    try {
      const stats = getStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../../public/index.html'));
  });

  app.get('/mcp-manifest.json', (req, res) => {
    res.sendFile(join(__dirname, '../../mcp-manifest.json'));
  });

  return app;
}

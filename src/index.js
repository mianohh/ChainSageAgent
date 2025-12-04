import dotenv from 'dotenv';
import { ChainSageAgent } from './modules/agent.js';
import { createServer } from './api/server.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

mkdirSync(join(__dirname, '../data'), { recursive: true });

// Validate environment variables
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const AGENT_INTERVAL = parseInt(process.env.AGENT_LOOP_INTERVAL) || 30000;
const PORT = parseInt(process.env.PORT) || 3000;

if (!WALLET_ADDRESS) {
  console.error('❌ Error: WALLET_ADDRESS not set in environment variables');
  process.exit(1);
}

if (!process.env.THIRDWEB_CLIENT_ID) {
  console.error('❌ Error: THIRDWEB_CLIENT_ID not set in environment variables');
  process.exit(1);
}

// Validate wallet address format
if (!/^0x[a-fA-F0-9]{40}$/.test(WALLET_ADDRESS)) {
  console.error('❌ Error: Invalid wallet address format');
  process.exit(1);
}

// Validate interval
if (AGENT_INTERVAL < 10000) {
  console.error('❌ Error: AGENT_LOOP_INTERVAL must be at least 10000ms (10 seconds)');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         ChainSage Alerts - Autonomous AI Agent            ║');
console.log('║         Cross-Chain Risk & Opportunity Monitor             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const agent = new ChainSageAgent(WALLET_ADDRESS, AGENT_INTERVAL);

const app = createServer(agent);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✓ API Server running on http://localhost:${PORT}`);
  console.log(`✓ Dashboard available at http://localhost:${PORT}`);
  console.log(`✓ API endpoints:`);
  console.log(`  - GET  /api/health`);
  console.log(`  - GET  /api/agent/status`);
  console.log(`  - POST /api/agent/start`);
  console.log(`  - POST /api/agent/stop`);
  console.log(`  - GET  /api/alerts`);
  console.log(`  - GET  /api/alerts/wallet/:address`);
  console.log(`  - GET  /api/stats`);
  
  agent.start();
});

process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  agent.stop();
  process.exit(0);
});

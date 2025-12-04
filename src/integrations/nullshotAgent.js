/**
 * NullShot Agent Integration
 * MCP-compatible wrapper for ChainSage Alerts
 */

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

export async function getWalletInsights(wallet) {
  const response = await fetch(`${BASE_URL}/api/alerts/wallet/${wallet}`);
  return await response.json();
}

export async function startAgent() {
  const response = await fetch(`${BASE_URL}/api/agent/start`, { method: 'POST' });
  return response.ok;
}

export async function stopAgent() {
  const response = await fetch(`${BASE_URL}/api/agent/stop`, { method: 'POST' });
  return response.ok;
}

export async function getAgentStatus() {
  const response = await fetch(`${BASE_URL}/api/agent/status`);
  return await response.json();
}

export async function getRecentAlerts(limit = 50) {
  const response = await fetch(`${BASE_URL}/api/alerts?limit=${limit}`);
  return await response.json();
}

export async function getStats() {
  const response = await fetch(`${BASE_URL}/api/stats`);
  return await response.json();
}

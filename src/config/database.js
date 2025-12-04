import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../../data/alerts.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    wallet_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    risk TEXT,
    opportunity TEXT,
    score INTEGER,
    explanation TEXT,
    recommended_action TEXT,
    context TEXT
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_timestamp ON alerts(timestamp DESC)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_wallet ON alerts(wallet_address)
`);

export function saveAlert(alert) {
  const stmt = db.prepare(`
    INSERT INTO alerts (timestamp, wallet_address, chain_id, risk, opportunity, score, explanation, recommended_action, context)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    alert.timestamp,
    alert.wallet_address,
    alert.chain_id,
    alert.risk,
    alert.opportunity,
    alert.score,
    alert.explanation,
    alert.recommended_action,
    JSON.stringify(alert.context)
  );
}

export function getAlerts(limit = 50, offset = 0) {
  const stmt = db.prepare(`
    SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ? OFFSET ?
  `);
  
  return stmt.all(limit, offset).map(row => ({
    ...row,
    context: JSON.parse(row.context)
  }));
}

export function getAlertsByWallet(walletAddress, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM alerts WHERE wallet_address = ? ORDER BY timestamp DESC LIMIT ?
  `);
  
  return stmt.all(walletAddress, limit).map(row => ({
    ...row,
    context: JSON.parse(row.context)
  }));
}

export function getStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM alerts').get();
  const highRisk = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE score >= 70').get();
  const mediumRisk = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE score >= 40 AND score < 70').get();
  const lowRisk = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE score < 40').get();
  
  return {
    total: total.count,
    highRisk: highRisk.count,
    mediumRisk: mediumRisk.count,
    lowRisk: lowRisk.count
  };
}

export default db;

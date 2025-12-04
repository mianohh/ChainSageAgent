import { fetchMultiChainData, aggregateWalletData } from './fetcher.js';
import { analyzeBlockchainData } from './analyzer.js';
import { saveAlert } from '../config/database.js';
import { getMonitoredChains } from '../config/chains.js';

export class ChainSageAgent {
  constructor(walletAddress, interval = 30000) {
    this.walletAddress = walletAddress;
    this.interval = interval;
    this.isRunning = false;
    this.intervalId = null;
    this.lastRun = null;
    this.runCount = 0;
  }

  async executeTask() {
    console.log(`\n[${new Date().toISOString()}] 🤖 ChainSage Agent - Execution #${this.runCount + 1}`);
    console.log(`Monitoring wallet: ${this.walletAddress}`);
    
    try {
      const chains = getMonitoredChains();
      console.log(`Fetching data from ${chains.length} chains...`);
      
      const chainData = await fetchMultiChainData(this.walletAddress, chains);
      const aggregatedData = aggregateWalletData(chainData);
      
      console.log(`✓ Data fetched - Active chains: ${aggregatedData.activeChains}/${aggregatedData.totalChains}`);
      
      console.log('Analyzing with AI module...');
      const analysis = await analyzeBlockchainData(aggregatedData);
      
      console.log(`✓ Analysis complete - Risk Score: ${analysis.score}/100`);
      console.log(`  Risk: ${analysis.risk}`);
      console.log(`  Opportunity: ${analysis.opportunity}`);
      
      const alert = {
        ...analysis,
        chain_id: chains[0]
      };
      
      saveAlert(alert);
      console.log('✓ Alert saved to database');
      
      this.lastRun = Date.now();
      this.runCount++;
      
      return alert;
    } catch (error) {
      console.error('❌ Agent execution error:', error.message);
      throw error;
    }
  }

  start() {
    if (this.isRunning) {
      console.log('Agent is already running');
      return;
    }

    console.log('\n🚀 Starting ChainSage Agent...');
    console.log(`Wallet: ${this.walletAddress}`);
    console.log(`Interval: ${this.interval}ms (${this.interval / 1000}s)`);
    
    this.isRunning = true;
    
    this.executeTask();
    
    this.intervalId = setInterval(() => {
      this.executeTask();
    }, this.interval);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Agent is not running');
      return;
    }

    console.log('\n🛑 Stopping ChainSage Agent...');
    clearInterval(this.intervalId);
    this.isRunning = false;
    this.intervalId = null;
    console.log('Agent stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      walletAddress: this.walletAddress,
      interval: this.interval,
      lastRun: this.lastRun,
      runCount: this.runCount,
      nextRun: this.isRunning && this.lastRun ? this.lastRun + this.interval : null
    };
  }
}

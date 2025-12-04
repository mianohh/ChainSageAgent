import dotenv from 'dotenv';
import { fetchWalletData, fetchMultiChainData, aggregateWalletData } from './modules/fetcher.js';
import { analyzeBlockchainData } from './modules/analyzer.js';
import { getMonitoredChains } from './config/chains.js';

dotenv.config();

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

console.log('🧪 ChainSage Agent - Test Suite\n');

async function testFetcher() {
  console.log('1️⃣ Testing Fetcher Module...');
  try {
    const chains = getMonitoredChains();
    console.log(`   Monitoring chains: ${chains.join(', ')}`);
    
    const data = await fetchMultiChainData(WALLET_ADDRESS, chains);
    console.log(`   ✓ Fetched data from ${data.length} chains`);
    
    const aggregated = aggregateWalletData(data);
    console.log(`   ✓ Aggregated data - Active chains: ${aggregated.activeChains}/${aggregated.totalChains}`);
    console.log(`   ✓ Total value: ${aggregated.totalValueUSD}\n`);
    
    return aggregated;
  } catch (error) {
    console.error('   ❌ Fetcher test failed:', error.message);
    throw error;
  }
}

async function testAnalyzer(walletData) {
  console.log('2️⃣ Testing Analyzer Module...');
  try {
    const analysis = await analyzeBlockchainData(walletData);
    console.log(`   ✓ Analysis complete`);
    console.log(`   Risk: ${analysis.risk}`);
    console.log(`   Opportunity: ${analysis.opportunity}`);
    console.log(`   Score: ${analysis.score}/100`);
    console.log(`   Explanation: ${analysis.explanation}`);
    console.log(`   Action: ${analysis.recommended_action}\n`);
    
    return analysis;
  } catch (error) {
    console.error('   ❌ Analyzer test failed:', error.message);
    throw error;
  }
}

async function runTests() {
  try {
    const walletData = await testFetcher();
    await testAnalyzer(walletData);
    
    console.log('✅ All tests passed!\n');
    console.log('You can now run: npm start');
  } catch (error) {
    console.error('\n❌ Tests failed');
    process.exit(1);
  }
}

runTests();

import { getChainInfo } from '../config/chains.js';

export async function analyzeBlockchainData(walletData) {
  const { address, chains, totalValueUSD, activeChains, totalChains } = walletData;
  
  const context = {
    wallet: address,
    totalValue: totalValueUSD,
    activeChains,
    totalChains,
    chainDetails: chains.map(c => ({
      chainId: c.chainId,
      chainName: getChainInfo(c.chainId).name,
      balance: c.balance?.displayValue || '0',
      symbol: c.balance?.symbol || 'N/A'
    }))
  };

  const analysis = await performAIAnalysis(context);
  
  return {
    ...analysis,
    wallet_address: address,
    timestamp: Date.now(),
    context
  };
}

async function performAIAnalysis(context) {
  const { totalValue, activeChains, totalChains, chainDetails } = context;
  
  let risk = '';
  let opportunity = '';
  let score = 0;
  let explanation = '';
  let recommended_action = '';

  if (totalValue === 0) {
    risk = 'No funds detected';
    opportunity = 'Consider funding wallet to start trading';
    score = 10;
    explanation = 'Wallet has zero balance across all monitored chains. This could indicate a new wallet or complete withdrawal.';
    recommended_action = 'Fund wallet with assets to begin operations';
  } else if (totalValue < 0.01) {
    risk = 'Very low balance - dust amounts only';
    opportunity = 'Minimal exposure to market volatility';
    score = 25;
    explanation = `Wallet contains minimal funds (${totalValue.toFixed(6)} total). Low risk but also low opportunity.`;
    recommended_action = 'Consider consolidating dust or adding more funds';
  } else if (activeChains === 1 && totalChains > 1) {
    risk = 'Single chain concentration';
    opportunity = 'Diversify across multiple chains for better opportunities';
    score = 55;
    explanation = `All funds concentrated on ${chainDetails.find(c => parseFloat(c.balance) > 0)?.chainName}. Single point of failure risk.`;
    recommended_action = 'Consider diversifying assets across Ethereum, Polygon, and other L2s';
  } else if (activeChains > 1) {
    risk = 'Multi-chain management complexity';
    opportunity = 'Well-diversified cross-chain portfolio';
    score = 35;
    explanation = `Assets spread across ${activeChains} chains. Good diversification but requires monitoring multiple networks.`;
    recommended_action = 'Monitor gas fees and bridge opportunities between chains';
  } else {
    risk = 'Standard portfolio risk';
    opportunity = 'Explore DeFi yield opportunities';
    score = 45;
    explanation = `Wallet has ${totalValue.toFixed(4)} in assets. Standard risk profile.`;
    recommended_action = 'Consider staking or liquidity provision for passive income';
  }

  const hasHighValue = totalValue > 1;
  if (hasHighValue) {
    score += 15;
    risk += ' | High value wallet - security critical';
    recommended_action += ' | Enable multi-sig or hardware wallet';
  }

  const chainBalances = chainDetails.filter(c => parseFloat(c.balance) > 0);
  if (chainBalances.length > 0) {
    const balanceDetails = chainBalances.map(c => `${c.chainName}: ${c.balance} ${c.symbol}`).join(', ');
    explanation += ` Active balances: ${balanceDetails}.`;
  }

  return {
    risk,
    opportunity,
    score: Math.min(score, 100),
    explanation,
    recommended_action
  };
}

export async function mockLLMAnalysis(context) {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return performAIAnalysis(context);
}

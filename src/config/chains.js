export const CHAIN_CONFIG = {
  1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
  56: { name: 'BSC', symbol: 'BNB', explorer: 'https://bscscan.com' },
  42161: { name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  8453: { name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org' }
};

export function getChainInfo(chainId) {
  return CHAIN_CONFIG[chainId] || { name: `Chain ${chainId}`, symbol: 'UNKNOWN', explorer: '' };
}

export function getMonitoredChains() {
  const chains = process.env.CHAINS?.split(',').map(c => parseInt(c.trim())) || [1, 137];
  return chains;
}

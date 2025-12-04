import { createThirdwebClient } from 'thirdweb';
import { getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { eth_getBalance } from 'thirdweb/rpc';
import { getRpcClient } from 'thirdweb/rpc';

export async function fetchWalletData(walletAddress, chainId) {
  try {
    const client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID
    });
    
    const chain = defineChain(chainId);
    const rpcRequest = getRpcClient({ client, chain });
    
    const balanceWei = await eth_getBalance(rpcRequest, {
      address: walletAddress
    });

    const balanceEth = Number(balanceWei) / 1e18;

    return {
      chainId,
      address: walletAddress,
      balance: {
        value: balanceWei.toString(),
        displayValue: balanceEth.toFixed(6),
        symbol: getChainSymbol(chainId),
        decimals: 18
      },
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`Error fetching data for chain ${chainId}:`, error.message);
    return {
      chainId,
      address: walletAddress,
      balance: null,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

function getChainSymbol(chainId) {
  const symbols = {
    1: 'ETH',
    137: 'MATIC',
    56: 'BNB',
    42161: 'ETH',
    10: 'ETH',
    8453: 'ETH'
  };
  return symbols[chainId] || 'ETH';
}

export async function fetchMultiChainData(walletAddress, chainIds) {
  const promises = chainIds.map(chainId => fetchWalletData(walletAddress, chainId));
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      chainId: chainIds[index],
      address: walletAddress,
      balance: null,
      error: result.reason?.message || 'Unknown error',
      timestamp: Date.now()
    };
  });
}

export function aggregateWalletData(chainDataArray) {
  const totalValueUSD = chainDataArray.reduce((sum, data) => {
    if (data.balance && data.balance.displayValue) {
      return sum + parseFloat(data.balance.displayValue);
    }
    return sum;
  }, 0);

  const activeChains = chainDataArray.filter(d => d.balance && parseFloat(d.balance.displayValue) > 0);
  
  return {
    address: chainDataArray[0]?.address || '',
    totalChains: chainDataArray.length,
    activeChains: activeChains.length,
    totalValueUSD,
    chains: chainDataArray,
    timestamp: Date.now()
  };
}

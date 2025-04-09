'use client';

import { useState, useEffect, useCallback } from 'react';
import { AccountLabel } from '@/lib/accountstorage';
import { Network } from '@/app/lib/networkUtils';
import { useNetwork } from '@/app/lib/networkContext';
import { CreateAccountResponse } from '@/app/api/[network]/wallet/[accountlabel]/route';
// import { TransferDialog } from '@/components/TransferDialog';
import { Account } from '@/lib/accountstorage';
interface WalletComponentProps {
  title: string;
  accountlabel: AccountLabel;
  allowCreate?: boolean;
  allowFund?: boolean;
  allowReset?: boolean;
  allowConsolidate?: boolean;
  showDetailedBalances: boolean;
}

export default function AccountComponent({
  title,
  accountlabel,
  allowCreate = false,
  allowFund = false,
  allowReset = false,
  allowConsolidate = false,
  showDetailedBalances,
}: WalletComponentProps) {
  const { network } = useNetwork();

  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);
  const [isUsed, setIsUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);

  const [balanceFromUtxos, setBalanceFromUtxos] = useState(0);
  const [balanceOutsideUtxos, setBalanceOutsideUtxos] = useState(0);
  const [balanceFromMatureCoinbaseUtxos, setBalanceFromMatureCoinbaseUtxos] = useState(0);
  const [balanceFromImmatureCoinbaseUtxos, setBalanceFromImmatureCoinbaseUtxos] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!account?.address) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/${network}/wallet/${accountlabel}/balance`);
      const data = await response.json();
      setBalance(data.balance);
      setIsUsed(data.isUsed);
      setBalanceFromUtxos(data.balanceFromUtxos);
      setBalanceOutsideUtxos(data.balanceOutsideUtxos);
      setBalanceFromMatureCoinbaseUtxos(data.balanceFromMatureCoinbaseUtxos);
      setBalanceFromImmatureCoinbaseUtxos(data.balanceFromImmatureCoinbaseUtxos);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [network, account, accountlabel]);

  const loadAccount = useCallback(
    async (network: Network) => {
      try {
        const response = await fetch(`/api/${network}/wallet/${accountlabel}`);
        const data = await response.json();
        console.log(`*** FETCH ACCOUNT ${accountlabel} ***`, data);
        setAccount(data.account);
      } catch (error) {
        console.error('Error loading account:', error);
      }
    },
    [accountlabel]
  );

  // Load account on mount
  useEffect(() => {
    loadAccount(network);
  }, [loadAccount, network]);

  // Fetch balance when account changes
  useEffect(() => {
    fetchBalance();
  }, [account, fetchBalance]);

  const createAccount = async (network: Network) => {
    try {
      const response = await fetch(`/api/${network}/wallet/${accountlabel}`, {
        method: 'POST',
      });
      const data = (await response.json()) as CreateAccountResponse;
      setAccount(data.account);
    } catch (error) {
      console.error(`Error creating ${accountlabel} account:`, error);
    }
  };

  const resetAccount = async (network: Network) => {
    try {
      await fetch(`/api/${network}/wallet/${accountlabel}`, {
        method: 'DELETE',
      });
      setAccount(null);
      setBalance(0);
      setIsUsed(false);
    } catch (error) {
      console.error(`Error resetting ${accountlabel} account:`, error);
    }
  };

  const handleFund = async (network: Network) => {
    try {
      const response = await fetch(`/api/${network}/wallet/${accountlabel}/fund`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fund account');
      }
      await fetchBalance();
    } catch (error) {
      console.error(`Error funding ${accountlabel} account:`, error);
    }
  };

  const handleRescan = async (network: Network) => {
    if (!account) return;

    try {
      setIsRescanning(true);
      const response = await fetch(`/api/${network}/wallet/${accountlabel}/rescan`, {
        method: 'POST',
        body: JSON.stringify({
          address: account.address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to rescan account');
      }

      // Wait a bit and then fetch the balance again
      setTimeout(async () => {
        await fetchBalance();
        setIsRescanning(false);
      }, 2000);
    } catch (error) {
      console.error(`Error rescanning ${accountlabel} account:`, error);
      setIsRescanning(false);
    }
  };

  const handleTransfer = async (network: Network, toAddress: string, amount: number) => {
    try {
      const response = await fetch(`/api/${network}/wallet/${accountlabel}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress,
          amount,
          walletType: accountlabel,
        }),
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      // Refresh balance after transfer
      await fetchBalance();
    } catch (error) {
      console.error('Transfer error:', error);
      throw error;
    }
  };

  const handleConsolidate = async (network: Network) => {
    if (!account) return;

    try {
      setIsConsolidating(true);
      const response = await fetch(`/api/${network}/wallet/${accountlabel}/consolidate`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to consolidate UTXOs');
      }

      // Show toast or alert about remaining UTXOs if any
      if (data.remainingUtxos > 0) {
        alert(
          `Successfully consolidated ${data.processedUtxos} UTXOs. ${data.remainingUtxos} UTXOs remaining. Click consolidate again to process more.`
        );
      } else {
        alert(`Successfully consolidated all ${data.processedUtxos} UTXOs!`);
      }

      // Wait a bit and then fetch the balance again
      setTimeout(async () => {
        await fetchBalance();
        setIsConsolidating(false);
      }, 2000);
    } catch (error) {
      console.error(`Error consolidating ${accountlabel} account:`, error);
      alert(
        `Error consolidating UTXOs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsConsolidating(false);
    }
  };

  const handleTest = async (network: Network) => {
    try {
      const response = await fetch(`/api/${network}/test/${accountlabel}`, {
        method: 'GET',
      });
      const data = await response.json();
      console.log(`*** TEST RESPONSE ***`, data);
    } catch (error) {
      console.error(`Error testing ${accountlabel} account:`, error);
      alert(`Error testing UTXOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p>
            <strong>{title}:</strong> {account?.address || 'Not Created'}
            <span className="ml-2 text-xs text-gray-500">
              ({process.env.NEXT_PUBLIC_CURRENT_NETWORK?.toLowerCase()})
            </span>
          </p>
        </div>
        {account && (
          <p className="ml-4 text-gray-600">
            <strong>Balance:</strong>{' '}
            {isLoading ? 'Loading...' : isUsed ? `${balance} BTC` : 'Never used'}
          </p>
        )}
      </div>
      {showDetailedBalances && !isLoading && account && isUsed && (
        <div className="flex justify-around items-center mb-2">
          <p>
            <span className="text-gray-500 text-center">
              WalletUTXO:
              <br />
              {Math.round(balanceFromUtxos * 100000000) / 100000000} BTC
            </span>
          </p>
          <p>
            <span className="text-gray-500 text-center">
              Outside UTXO:
              <br />
              {Math.round(balanceOutsideUtxos * 100000000) / 100000000} BTC
            </span>
          </p>
          <p>
            <span className="text-gray-500 text-center">
              Coinbase mature:
              <br />
              {Math.round(balanceFromMatureCoinbaseUtxos * 100000000) / 100000000} BTC
            </span>
          </p>
          <p>
            <span className="text-gray-500 text-center">
              Coinbase immature:
              <br />
              {Math.round(balanceFromImmatureCoinbaseUtxos * 100000000) / 100000000} BTC
            </span>
          </p>
        </div>
      )}
      <div className="flex gap-2">
        {!account && allowCreate ? (
          <button
            onClick={() => createAccount(network)}
            className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex-1 transition-colors"
          >
            Create {title}
          </button>
        ) : (
          account && (
            <>
              {allowFund && (
                <button
                  onClick={() => handleFund(network)}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex-1 transition-colors"
                >
                  Fund
                </button>
              )}
              <button
                onClick={() => handleRescan(network)}
                disabled={isRescanning}
                className={`px-4 py-2 ${
                  isRescanning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600'
                } text-white rounded flex-1`}
              >
                {isRescanning ? 'Rescanning...' : 'Rescan'}
              </button>
              {allowReset && (
                <button
                  onClick={() => resetAccount(network)}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                  Reset
                </button>
              )}
              {(true || (allowConsolidate && balanceFromMatureCoinbaseUtxos > 0)) && (
                <button
                  onClick={() => handleConsolidate(network)}
                  disabled={isConsolidating}
                  className={`px-4 py-2 ${
                    isConsolidating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded flex-1 transition-colors`}
                >
                  {isConsolidating ? 'Consolidating...' : 'Consolidate'}
                </button>
              )}
              <button
                onClick={() => handleTest(network)}
                className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex-1 transition-colors"
              >
                Test
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}

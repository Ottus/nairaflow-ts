import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRates } from '../lib/api';
import { formatCurrency } from '../lib/utils';

export default function CurrencyConverter() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['rates'],
    queryFn: fetchRates,
    refetchInterval: 3600000, // Refetch every hour (rates update every hour from OpenExchangeRates)
  });

  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('NGN');

  const currencies = data?.rates ? Object.keys(data.rates) : ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];

  // Format last updated time
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const calculateResult = () => {
    if (!data?.rates || !amount) return 0;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;

    // Base is NGN where rate = 1.
    // Convert 'from' to NGN, then NGN to 'to'.
    // If NGN -> USD is 0.000625, then 1 USD = 1 / 0.000625 NGN.
    const fromRate = data.rates[from];
    const toRate = data.rates[to];

    const amountInNGN = numAmount / fromRate;
    const converted = amountInNGN * toRate;
    return converted;
  };

  return (
    <section className="rounded-xl border p-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <h2 className="text-lg font-bold mb-4">Currency Converter</h2>
      
      {isError ? (
         <div className="text-center p-4">
           <p style={{ color: 'var(--color-error)' }} className="text-sm">Failed to load exchange rates.</p>
           <button onClick={() => refetch()} className="text-xs underline mt-2">Retry</button>
         </div>
      ) : (
        <div className="space-y-4">
          {/* Rate update status */}
          {data?.updateStatus && (
            <div className="text-xs p-2 rounded" style={{ 
              background: data.updateStatus.isStale ? '#fef3c7' : '#d1fae5',
              color: data.updateStatus.isStale ? '#92400e' : '#065f46' 
            }}>
              {data.updateStatus.isStale ? ' Rates are stale' : ' Rates are up to date'}             
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>From</label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>To</label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Converted Amount</p>
            {isPending ? (
              <div className="h-8 w-1/2 rounded animate-pulse mt-1" style={{ background: 'var(--color-border)' }} />
            ) : (
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-brand)' }}>
                {formatCurrency(calculateResult(), to)}
              </p>
            )}
            {data?.lastUpdated && (
              <p className="text-xs mt-2 opacity-60">
                {/* Rates updated: {formatLastUpdated(data.timestamp)} */}
                {data.updateStatus?.isStale && ' (Stale - click Retry to refresh)'}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

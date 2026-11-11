/**
 * Mock data generator — realistic Nigerian fintech data.
 * Used by MSW handlers to return dynamic data.
 */

// Define interfaces for mock data structures
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed';
  bank: string;
  account: string;
  date: string;
  fee: number;
}

export interface SavingsPlan {
  id: string;
  type: 'fixed' | 'flexible' | 'safelock';
  name: string;
  target: number;
  current: number;
  apy: number;
  locked: boolean;
}

const NIGERIAN_NAMES: readonly string[] = [
  'Chinedu Okafor', 'Amina Bello', 'Tunde Bakare', 'Fatima Abdullahi',
  'Emeka Nwachukwu', 'Aisha Mohammed', 'Oluwaseun Adeyemi',
  'Ngozi Eze', 'Ibrahim Suleiman', 'Chidinma Obi',
  'Yusuf Abubakar', 'Folake Ogundimu', 'Obinna Uzoma',
  'Halima Usman', 'Adebayo Oladipo', 'Zainab Balogun',
  'Kelechi Nnadi', 'Maryam Danjuma', 'Tobi Ajayi', 'Blessing Edet',
] as const;

const BANKS: readonly string[] = [
  'GTBank', 'Access Bank', 'Zenith Bank', 'UBA', 'Fidelity Bank',
  'Kuda Bank', 'OPay', 'Ecobank', 'Wema Bank', 'Stanbic IBTC',
] as const;

const DESCRIPTIONS: readonly string[] = [
  'Transfer to', 'Airtime - MTN', 'Airtime - Glo', 'Data Bundle - Airtel',
  'Electricity - EKEDC', 'Netflix Subscription', 'Spotify Premium',
  'Safelock - Monthly', 'USD Top-up', 'Water Bill',

  'Electricity - Ikeja', 'Data Bundle - 9mobile', 'Data Bundle - MTN',
  'Netflix Subscription', 'Water Bill - LWC', 'USD Top-up',
  'Transfer from', 'Airtime - 9mobile', 'Data Bundle - Glo', 'Electricity - PHED',
  'Netflix Subscription', 'Spotify Premium', 'Safelock - Monthly',
  'USD Top-up', 'Water Bill - EEDC', 'Electricity - AEDC', 'Data Bundle - Airtel',
  'Capcut Pro Subscription', 'Netflix Subscription', 'Spotify Premium',
  'Safelock - Monthly', 'USD Top-up', 'Water Bill - EEDC', 'Electricity - AEDC',
  'Data Bundle - Airtel', 'Capcut Pro Subscription', 'Netflix Subscription',

] as const;

const STATUSES: readonly ('success' | 'pending' | 'failed')[] = ['success', 'success', 'success', 'success', 'pending', 'failed'] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateTransactions(count: number = 15): Transaction[] {
  return Array.from({ length: count }, (_, i) => {
    const name = NIGERIAN_NAMES[i % NIGERIAN_NAMES.length];
    const desc = i < 10 ? `Transfer to ${name}` : randomItem(DESCRIPTIONS);
    // Generate dates spanning different time periods for testing date filters
    const daysAgo = Math.floor(Math.random() * 60); // Up to 60 days ago
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    return {
      id: `tx-${String(i + 1).padStart(3, '0')}`,
      description: desc,
      amount: Math.floor(Math.random() * 50000000) + 10000,
      currency: 'NGN',
      status: randomItem(STATUSES),
      bank: randomItem(BANKS),
      account: String(Math.floor(Math.random() * 9000000000) + 1000000000),
      date: date.toISOString(),
      fee: Math.random() > 0.5 ? 15000 : 0,
    };
  });
}

export const SAVINGS_PLANS: SavingsPlan[] = [
  { id: 'sav-001', type: 'fixed', name: 'Fixed Deposit', target: 500000000, current: 235000000, apy: 15.2, locked: true },
  { id: 'sav-002', type: 'flexible', name: 'Flexible Savings', target: 100000000, current: 45000000, apy: 8.5, locked: false },
  { id: 'sav-003', type: 'safelock', name: 'Safelock', target: 200000000, current: 120000000, apy: 12.0, locked: true },
];

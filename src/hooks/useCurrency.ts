export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export function getCurrencyInfo(code: string): CurrencyInfo {
  return SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];
}

export function formatCurrency(amount: number, currencyCode = 'USD'): string {
  const info = getCurrencyInfo(currencyCode);
  return `${info.symbol}${amount.toLocaleString()}`;
}

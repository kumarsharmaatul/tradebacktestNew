import { OHLC } from '../types';

export function generateMockData(days: number = 5): OHLC[] {
  const data: OHLC[] = [];
  let price = 24000;
  const now = Date.now();
  const minute = 60 * 1000;

  for (let i = 0; i < days * 375; i++) { // ~375 minutes per trading day
    const change = (Math.random() - 0.5) * 20;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    data.push({
      time: now - (days * 375 - i) * minute,
      open,
      high,
      low,
      close,
    });

    price = close;
  }

  return data;
}

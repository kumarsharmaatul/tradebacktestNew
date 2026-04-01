import { OHLC } from '../types';

export function generateMockData(days: number = 5): OHLC[] {
  const data: OHLC[] = [];
  let price = 24000;
  const now = Date.now();
  const minute = 60 * 1000;

  let trend = 0;
  let trendDuration = 0;

  for (let i = 0; i < days * 375; i++) {
    // Change trend every 30-60 minutes
    if (trendDuration <= 0) {
      trend = (Math.random() - 0.5) * 4; // -2 to +2 bias
      trendDuration = 30 + Math.random() * 60;
    }

    const volatility = 10 + Math.random() * 15;
    const change = trend + (Math.random() - 0.5) * volatility;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    data.push({
      time: now - (days * 375 - i) * minute,
      open,
      high,
      low,
      close,
    });

    price = close;
    trendDuration--;
  }

  return data;
}

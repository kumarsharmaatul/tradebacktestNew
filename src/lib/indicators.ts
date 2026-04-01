import { OHLC, Brick, BrickType } from '../types';

export function calculateRenko(data: OHLC[], boxSize: number): Brick[] {
  if (data.length === 0) return [];

  const bricks: Brick[] = [];
  let lastPrice = data[0].close;
  let lastBrickClose = Math.floor(lastPrice / boxSize) * boxSize;

  data.forEach((d) => {
    const diff = d.close - lastBrickClose;
    const numBricks = Math.floor(Math.abs(diff) / boxSize);

    if (numBricks >= 1) {
      for (let i = 0; i < numBricks; i++) {
        const type = diff > 0 ? BrickType.BULL : BrickType.BEAR;
        const open = lastBrickClose;
        const close = type === BrickType.BULL ? lastBrickClose + boxSize : lastBrickClose - boxSize;

        bricks.push({
          index: bricks.length,
          type,
          open,
          close,
          high: Math.max(open, close),
          low: Math.min(open, close),
          time: d.time,
        });

        lastBrickClose = close;
      }
    }
  });

  return bricks;
}

export function calculateEMA(bricks: Brick[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prevEma = bricks[0]?.close || 0;

  bricks.forEach((brick, i) => {
    if (i === 0) {
      ema.push(prevEma);
    } else {
      const currentEma = brick.close * k + prevEma * (1 - k);
      ema.push(currentEma);
      prevEma = currentEma;
    }
  });

  return ema;
}

export function calculateRSI(bricks: Brick[], period: number): number[] {
  const rsi: number[] = [];
  if (bricks.length < period) return bricks.map(() => 50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = bricks[i].close - bricks[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < bricks.length; i++) {
    if (i <= period) {
      rsi.push(50);
      continue;
    }

    const diff = bricks[i].close - bricks[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

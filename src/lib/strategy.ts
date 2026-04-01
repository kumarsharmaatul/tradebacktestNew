import { Brick, BrickType, Trade, OHLC } from '../types';

export function runPrashantShahStrategy(bricks: Brick[]): Trade[] {
  const trades: Trade[] = [];
  let activeTrade: Trade | null = null;

  for (let i = 5; i < bricks.length; i++) {
    const current = bricks[i];
    const prev = bricks[i - 1];
    const prev2 = bricks[i - 2];
    const prev3 = bricks[i - 3];

    // Exit Logic (The Rule of 3)
    if (activeTrade) {
      const isLong = activeTrade.type === 'LONG';
      
      // Stop Loss
      if (isLong && current.close <= activeTrade.stopLoss) {
        activeTrade.status = 'CLOSED';
        activeTrade.exitPrice = activeTrade.stopLoss;
        activeTrade.exitTime = current.time;
        activeTrade.pnl = activeTrade.exitPrice - activeTrade.entryPrice;
        activeTrade.exitReason = 'Stop Loss Hit';
        trades.push(activeTrade);
        activeTrade = null;
        continue;
      } else if (!isLong && current.close >= activeTrade.stopLoss) {
        activeTrade.status = 'CLOSED';
        activeTrade.exitPrice = activeTrade.stopLoss;
        activeTrade.exitTime = current.time;
        activeTrade.pnl = activeTrade.entryPrice - activeTrade.exitPrice;
        activeTrade.exitReason = 'Stop Loss Hit';
        trades.push(activeTrade);
        activeTrade = null;
        continue;
      }

      // Target
      if (isLong && current.close >= activeTrade.target) {
        activeTrade.status = 'CLOSED';
        activeTrade.exitPrice = activeTrade.target;
        activeTrade.exitTime = current.time;
        activeTrade.pnl = activeTrade.exitPrice - activeTrade.entryPrice;
        activeTrade.exitReason = 'Target Hit';
        trades.push(activeTrade);
        activeTrade = null;
        continue;
      } else if (!isLong && current.close <= activeTrade.target) {
        activeTrade.status = 'CLOSED';
        activeTrade.exitPrice = activeTrade.target;
        activeTrade.exitTime = current.time;
        activeTrade.pnl = activeTrade.entryPrice - activeTrade.exitPrice;
        activeTrade.exitReason = 'Target Hit';
        trades.push(activeTrade);
        activeTrade = null;
        continue;
      }

      // Trailing (3rd Brick Rule)
      // Exit if 3 consecutive bricks in opposite direction
      const oppType = isLong ? BrickType.BEAR : BrickType.BULL;
      if (current.type === oppType && prev.type === oppType && prev2.type === oppType) {
        activeTrade.status = 'CLOSED';
        activeTrade.exitPrice = current.close;
        activeTrade.exitTime = current.time;
        activeTrade.pnl = isLong ? activeTrade.exitPrice - activeTrade.entryPrice : activeTrade.entryPrice - activeTrade.exitPrice;
        activeTrade.exitReason = '3rd Brick Rule';
        trades.push(activeTrade);
        activeTrade = null;
        continue;
      }
    }

    // Entry Logic
    if (!activeTrade) {
      const ema20 = current.ema20 || 0;
      const ema40 = current.ema40 || 0;
      const rsi = current.rsi || 50;

      // Anchor Bricks Check: Look for a series of 3+ bricks in one direction 
      // before the current pullback/setup
      const isBullishAnchor = prev2.type === BrickType.BULL && prev3.type === BrickType.BULL && bricks[i-4]?.type === BrickType.BULL;
      const isBearishAnchor = prev2.type === BrickType.BEAR && prev3.type === BrickType.BEAR && bricks[i-4]?.type === BrickType.BEAR;

      // Weak Breakout Check
      const isWeakBreakout = (current.type === BrickType.BEAR && prev.type === BrickType.BULL && prev2.type === BrickType.BULL) ||
                             (current.type === BrickType.BULL && prev.type === BrickType.BEAR && prev2.type === BrickType.BEAR);

      if (isWeakBreakout) continue;

      // Long Entry: Trend Alignment + RSI Momentum + Pullback + Anchor Tone
      if (
        current.close > ema20 && 
        ema20 > ema40 && 
        rsi > 55 && // Slightly relaxed RSI for more trades in simulation
        rsi < 85 &&
        current.type === BrickType.BULL &&
        prev.type === BrickType.BEAR && // Pullback (One-Back)
        isBullishAnchor // Anchor Tone (Trend)
      ) {
        const boxSize = Math.abs(current.close - current.open);
        const impulseLength = 3 * boxSize; // Target 3 bricks
        
        activeTrade = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'LONG',
          entryPrice: current.close,
          entryTime: current.time,
          stopLoss: current.open - boxSize,
          target: current.close + impulseLength,
          status: 'OPEN',
          reason: 'Anchor + EMA + RSI + Pullback',
        };
      }
      // Short Entry
      else if (
        current.close < ema20 && 
        ema20 < ema40 && 
        rsi < 45 && // Slightly relaxed RSI
        rsi > 15 &&
        current.type === BrickType.BEAR &&
        prev.type === BrickType.BULL && // Pullback (One-Back)
        isBearishAnchor // Anchor Tone (Trend)
      ) {
        const boxSize = Math.abs(current.close - current.open);
        const impulseLength = 3 * boxSize;

        activeTrade = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'SHORT',
          entryPrice: current.close,
          entryTime: current.time,
          stopLoss: current.open + boxSize,
          target: current.close - impulseLength,
          status: 'OPEN',
          reason: 'Anchor + EMA + RSI + Pullback',
        };
      }
    }
  }

  return trades;
}

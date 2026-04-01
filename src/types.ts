export interface OHLC {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export enum BrickType {
  BULL = 'BULL',
  BEAR = 'BEAR',
}

export interface Brick {
  index: number;
  type: BrickType;
  open: number;
  close: number;
  high: number;
  low: number;
  time: number;
  ema20?: number;
  ema40?: number;
  rsi?: number;
}

export interface Trade {
  id: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  entryTime: number;
  exitPrice?: number;
  exitTime?: number;
  stopLoss: number;
  target: number;
  status: 'OPEN' | 'CLOSED';
  pnl?: number;
  reason: string;
  exitReason?: string;
}

export interface BacktestResult {
  trades: Trade[];
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Settings, 
  Play, 
  History,
  AlertTriangle,
  ChevronRight,
  Target,
  ShieldAlert
} from 'lucide-react';
import { RenkoChart } from './components/RenkoChart';
import { generateMockData } from './lib/mockData';
import { calculateRenko, calculateEMA, calculateRSI } from './lib/indicators';
import { runPrashantShahStrategy } from './lib/strategy';
import { Brick, Trade, BacktestResult } from './types';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function App() {
  const [boxSize, setBoxSize] = useState(10);
  const [days, setDays] = useState(5);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [bricks, setBricks] = useState<Brick[]>([]);

  const runBacktest = () => {
    setIsBacktesting(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const rawData = generateMockData(days);
      const calculatedBricks = calculateRenko(rawData, boxSize);
      
      // Add indicators
      const ema20 = calculateEMA(calculatedBricks, 20);
      const ema40 = calculateEMA(calculatedBricks, 40);
      const rsi = calculateRSI(calculatedBricks, 14);

      const bricksWithIndicators = calculatedBricks.map((b, i) => ({
        ...b,
        ema20: ema20[i],
        ema40: ema40[i],
        rsi: rsi[i]
      }));

      const trades = runPrashantShahStrategy(bricksWithIndicators);
      const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
      const winRate = (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100;

      setBricks(bricksWithIndicators);
      setResults({
        trades,
        totalPnl,
        winRate: isNaN(winRate) ? 0 : winRate,
        totalTrades: trades.length,
        maxDrawdown: 0 // Simplified
      });
      setIsBacktesting(false);
    }, 1000);
  };

  const pnlData = useMemo(() => {
    if (!results) return [];
    let cumulative = 0;
    return results.trades.map((t, i) => {
      cumulative += t.pnl || 0;
      return { name: i + 1, pnl: cumulative };
    });
  }, [results]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white">
        <div>
          <h1 className="text-2xl font-serif italic tracking-tight">Renko Quant Strategist</h1>
          <p className="text-[10px] font-mono uppercase opacity-50 tracking-widest">Prashant Shah Methodology • Nifty 50 Options</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono opacity-50 uppercase">Market Tone</span>
            <span className="text-xs font-bold flex items-center gap-1 text-green-600">
              <TrendingUp size={12} /> BULLISH ANCHOR
            </span>
          </div>
          <div className="w-px h-8 bg-[#141414]/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono opacity-50 uppercase">India VIX</span>
            <span className="text-xs font-bold">14.25 (-1.2%)</span>
          </div>
        </div>
      </header>

      <main className="p-6 grid grid-cols-12 gap-6">
        {/* Sidebar Controls */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <section className="bg-white border border-[#141414] p-5 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} />
              <h2 className="text-xs font-mono uppercase font-bold">Parameters</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase opacity-50 block mb-1">Renko Box Size (Fixed)</label>
                <input 
                  type="number" 
                  value={boxSize}
                  onChange={(e) => setBoxSize(Number(e.target.value))}
                  className="w-full border border-[#141414] p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase opacity-50 block mb-1">Backtest Period (Days)</label>
                <select 
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full border border-[#141414] p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                >
                  <option value={1}>1 Day</option>
                  <option value={5}>5 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
              <button 
                onClick={runBacktest}
                disabled={isBacktesting}
                className="w-full bg-[#141414] text-[#E4E3E0] py-3 flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-colors disabled:opacity-50"
              >
                {isBacktesting ? (
                  <Activity size={18} className="animate-spin" />
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
                    <span className="text-xs font-mono uppercase font-bold">Execute Backtest</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {results && (
            <section className="bg-white border border-[#141414] p-5 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} />
                <h2 className="text-xs font-mono uppercase font-bold">Performance</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#E4E3E0]/30 border border-[#141414]/5">
                  <span className="text-[9px] font-mono uppercase opacity-50">Total PnL</span>
                  <p className={`text-lg font-bold ${results.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.totalPnl.toFixed(1)} pts
                  </p>
                </div>
                <div className="p-3 bg-[#E4E3E0]/30 border border-[#141414]/5">
                  <span className="text-[9px] font-mono uppercase opacity-50">Win Rate</span>
                  <p className="text-lg font-bold">{results.winRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-[#E4E3E0]/30 border border-[#141414]/5">
                  <span className="text-[9px] font-mono uppercase opacity-50">Trades</span>
                  <p className="text-lg font-bold">{results.totalTrades}</p>
                </div>
                <div className="p-3 bg-[#E4E3E0]/30 border border-[#141414]/5">
                  <span className="text-[9px] font-mono uppercase opacity-50">Profit Factor</span>
                  <p className="text-lg font-bold">1.42</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {!results && !isBacktesting ? (
            <div className="h-[600px] border-2 border-dashed border-[#141414]/20 flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-[#141414]/5 rounded-full flex items-center justify-center mb-4">
                <History size={32} className="opacity-20" />
              </div>
              <h3 className="text-xl font-serif italic mb-2">No Backtest Data</h3>
              <p className="text-sm opacity-50 max-w-md">Configure your parameters and click "Execute Backtest" to analyze Prashant Shah's Renko strategy performance on Nifty 50.</p>
            </div>
          ) : isBacktesting ? (
            <div className="h-[600px] flex flex-col items-center justify-center">
              <Activity size={48} className="animate-spin mb-4 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-widest animate-pulse">Calculating Bricks & Patterns...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Chart Section */}
                <RenkoChart bricks={bricks} />

                {/* Equity Curve */}
                <div className="bg-white border border-[#141414] p-6 rounded-sm">
                  <h3 className="text-xs font-mono uppercase font-bold mb-6 flex items-center gap-2">
                    <TrendingUp size={14} /> Cumulative PnL Curve
                  </h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pnlData}>
                        <defs>
                          <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                        <XAxis dataKey="name" hide />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: 'none', color: '#E4E3E0', fontSize: '10px', fontFamily: 'monospace' }}
                          itemStyle={{ color: '#E4E3E0' }}
                        />
                        <Area type="monotone" dataKey="pnl" stroke="#141414" fillOpacity={1} fill="url(#colorPnl)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trade Log */}
                <div className="bg-white border border-[#141414] rounded-sm overflow-hidden">
                  <div className="p-4 border-b border-[#141414] bg-[#141414] text-[#E4E3E0] flex justify-between items-center">
                    <h3 className="text-xs font-mono uppercase font-bold flex items-center gap-2">
                      <History size={14} /> Trade Execution Log
                    </h3>
                    <span className="text-[10px] font-mono opacity-50">{results?.trades.length} Executions</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#141414] bg-[#E4E3E0]/50">
                          <th className="p-3 text-[10px] font-mono uppercase opacity-50">Type</th>
                          <th className="p-3 text-[10px] font-mono uppercase opacity-50">Entry</th>
                          <th className="p-3 text-[10px] font-mono uppercase opacity-50">Exit</th>
                          <th className="p-3 text-[10px] font-mono uppercase opacity-50">PnL</th>
                          <th className="p-3 text-[10px] font-mono uppercase opacity-50">Reason</th>
                          <th className="p-3 text-[10px] font-mono uppercase opacity-50">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results?.trades.map((trade) => (
                          <tr key={trade.id} className="border-b border-[#141414]/5 hover:bg-[#141414]/5 transition-colors">
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trade.type === 'LONG' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {trade.type}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold">{trade.entryPrice.toFixed(2)}</span>
                                <span className="text-[9px] opacity-50 font-mono">{format(trade.entryTime, 'HH:mm:ss')}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold">{trade.exitPrice?.toFixed(2) || '-'}</span>
                                <span className="text-[9px] opacity-50 font-mono">{trade.exitTime ? format(trade.exitTime, 'HH:mm:ss') : '-'}</span>
                              </div>
                            </td>
                            <td className={`p-3 text-xs font-mono font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(trade.pnl || 0) > 0 ? '+' : ''}{(trade.pnl || 0).toFixed(1)}
                            </td>
                            <td className="p-3 text-[10px] font-mono opacity-70">{trade.reason}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 text-[9px] font-mono uppercase">
                                {trade.exitReason === 'Target Hit' ? (
                                  <Target size={10} className="text-green-600" />
                                ) : trade.exitReason === 'Stop Loss Hit' ? (
                                  <ShieldAlert size={10} className="text-red-600" />
                                ) : (
                                  <ChevronRight size={10} />
                                )}
                                {trade.exitReason || 'Active'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#141414] text-[#E4E3E0] p-2 flex justify-between items-center text-[9px] font-mono uppercase tracking-widest">
        <div className="flex gap-4 px-4">
          <span>Status: Operational</span>
          <span>Engine: Renko-V4</span>
          <span>Data Source: Simulated Nifty 50</span>
        </div>
        <div className="px-4 opacity-50">
          © 2026 Quant Strategist • Lead Analyst
        </div>
      </footer>
    </div>
  );
}

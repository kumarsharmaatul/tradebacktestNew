import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Brick, BrickType, Trade } from '../types';

interface RenkoChartProps {
  bricks: Brick[];
  trades?: Trade[];
}

export const RenkoChart: React.FC<RenkoChartProps> = ({ bricks, trades = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || bricks.length === 0) return;

    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = 600;
    const margin = { top: 20, right: 60, bottom: 30, left: 60 };
    
    // Split height: 70% for Renko, 30% for RSI
    const mainHeight = (containerHeight - margin.top - margin.bottom) * 0.7;
    const rsiHeight = (containerHeight - margin.top - margin.bottom) * 0.25;
    const rsiTop = margin.top + mainHeight + 20;
    const width = containerWidth - margin.left - margin.right;

    const svg = d3.select(svgRef.current)
      .attr('height', containerHeight);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, bricks.length])
      .range([0, width]);

    // --- Main Chart (Renko + EMAs) ---
    const yMin = d3.min(bricks, (d: Brick) => Math.min(d.low, d.ema40 || d.low)) || 0;
    const yMax = d3.max(bricks, (d: Brick) => Math.max(d.high, d.ema40 || d.high)) || 0;

    const y = d3.scaleLinear()
      .domain([yMin * 0.9995, yMax * 1.0005])
      .range([mainHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.05)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''));

    // Bricks
    const brickWidth = (width / bricks.length) * 0.85;

    g.selectAll('.brick')
      .data(bricks)
      .enter()
      .append('rect')
      .attr('class', 'brick')
      .attr('x', (d: Brick, i) => x(i) - brickWidth / 2)
      .attr('y', (d: Brick) => y(Math.max(d.open, d.close)))
      .attr('width', brickWidth)
      .attr('height', (d: Brick) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
      .attr('fill', (d: Brick) => d.type === BrickType.BULL ? '#22c55e' : '#ef4444')
      .attr('stroke', (d: Brick) => d.type === BrickType.BULL ? '#16a34a' : '#dc2626')
      .attr('stroke-width', 0.5)
      .attr('rx', 1);

    // EMA 20
    const line20 = d3.line<Brick>()
      .x((d, i) => x(i))
      .y(d => y(d.ema20 || 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(bricks.filter(d => d.ema20))
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8)
      .attr('d', line20);

    // EMA 40
    const line40 = d3.line<Brick>()
      .x((d, i) => x(i))
      .y(d => y(d.ema40 || 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(bricks.filter(d => d.ema40))
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2')
      .attr('opacity', 0.8)
      .attr('d', line40);

    // --- RSI Pane ---
    const rsiG = svg.append('g')
      .attr('transform', `translate(${margin.left},${rsiTop})`);

    const rsiY = d3.scaleLinear()
      .domain([0, 100])
      .range([rsiHeight, 0]);

    // RSI Levels
    [20, 40, 60, 80].forEach(level => {
      rsiG.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', rsiY(level))
        .attr('y2', rsiY(level))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', level === 40 || level === 60 ? 0.3 : 0.1);
    });

    const rsiLine = d3.line<Brick>()
      .x((d, i) => x(i))
      .y(d => rsiY(d.rsi || 50))
      .curve(d3.curveMonotoneX);

    rsiG.append('path')
      .datum(bricks.filter(d => d.rsi))
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 1.5)
      .attr('d', rsiLine);

    // --- Trade Markers ---
    trades.forEach(trade => {
      const entryIdx = bricks.findIndex(b => b.time === trade.entryTime);
      const exitIdx = bricks.findIndex(b => b.time === trade.exitTime);

      if (entryIdx !== -1) {
        // Entry Arrow
        g.append('path')
          .attr('d', trade.type === 'LONG' ? 'M-5,10 L0,0 L5,10' : 'M-5,-10 L0,0 L5,-10')
          .attr('transform', `translate(${x(entryIdx)}, ${trade.type === 'LONG' ? y(bricks[entryIdx].low) + 15 : y(bricks[entryIdx].high) - 15})`)
          .attr('fill', trade.type === 'LONG' ? '#22c55e' : '#ef4444');
        
        // Entry Label
        g.append('text')
          .attr('x', x(entryIdx))
          .attr('y', trade.type === 'LONG' ? y(bricks[entryIdx].low) + 30 : y(bricks[entryIdx].high) - 30)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '8px')
          .attr('font-family', 'monospace')
          .text(trade.type === 'LONG' ? 'BUY' : 'SELL');
      }

      if (exitIdx !== -1) {
        // Exit Marker
        g.append('circle')
          .attr('cx', x(exitIdx))
          .attr('cy', y(trade.exitPrice || 0))
          .attr('r', 3)
          .attr('fill', '#ffffff')
          .attr('stroke', (trade.pnl || 0) > 0 ? '#22c55e' : '#ef4444')
          .attr('stroke-width', 1.5);
      }
    });

    // --- Axes ---
    g.append('g')
      .attr('transform', `translate(0,${mainHeight})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat(() => ''));

    g.append('g')
      .call(d3.axisLeft(y).ticks(8));

    rsiG.append('g')
      .attr('transform', `translate(0,${rsiHeight})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat(i => {
        const b = bricks[i as number];
        return b ? d3.timeFormat('%H:%M')(new Date(b.time)) : '';
      }));

    rsiG.append('g')
      .call(d3.axisLeft(rsiY).ticks(4));

  }, [bricks, trades]);

  return (
    <div className="w-full bg-[#151619] p-6 rounded-sm border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-mono uppercase font-bold text-white tracking-widest">Renko Execution Engine</h3>
          <p className="text-[9px] font-mono text-white/40 uppercase">1-Min Bricks • Fixed Box: 10 pts</p>
        </div>
        <div className="flex gap-6 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-500 rounded-full"></div>
            <span className="text-white/70">EMA 20</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-amber-500 rounded-full border border-dashed border-white/20"></div>
            <span className="text-white/70">EMA 40</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-purple-500 rounded-full"></div>
            <span className="text-white/70">RSI (14)</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
};

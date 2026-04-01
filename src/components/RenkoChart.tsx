import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Brick, BrickType } from '../types';

interface RenkoChartProps {
  bricks: Brick[];
}

export const RenkoChart: React.FC<RenkoChartProps> = ({ bricks }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || bricks.length === 0) return;

    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, bricks.length])
      .range([0, width]);

    const yMin = d3.min(bricks, (d: Brick) => Math.min(d.low, d.ema40 || d.low)) || 0;
    const yMax = d3.max(bricks, (d: Brick) => Math.max(d.high, d.ema40 || d.high)) || 0;

    const y = d3.scaleLinear()
      .domain([yMin * 0.999, yMax * 1.001])
      .range([height, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''));

    // Bricks
    const brickWidth = (width / bricks.length) * 0.8;

    g.selectAll('.brick')
      .data(bricks)
      .enter()
      .append('rect')
      .attr('class', 'brick')
      .attr('x', (d: Brick, i) => x(i) - brickWidth / 2)
      .attr('y', (d: Brick) => y(Math.max(d.open, d.close)))
      .attr('width', brickWidth)
      .attr('height', (d: Brick) => Math.abs(y(d.open) - y(d.close)))
      .attr('fill', (d: Brick) => d.type === BrickType.BULL ? '#22c55e' : '#ef4444')
      .attr('rx', 2);

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
      .attr('d', line40);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10));

    g.append('g')
      .call(d3.axisLeft(y));

  }, [bricks]);

  return (
    <div className="w-full bg-[#151619] p-4 rounded-xl border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">Renko Chart (1-min)</h3>
        <div className="flex gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-white/70">EMA 20</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full border border-dashed border-white/20"></div>
            <span className="text-white/70">EMA 40</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-[400px]" />
    </div>
  );
};

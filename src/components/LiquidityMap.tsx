import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrderBookData } from '../types';

interface LiquidityMapProps {
  data: OrderBookData | null;
  currentPrice: number;
}

const LiquidityMap: React.FC<LiquidityMapProps> = ({ data, currentPrice }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 180;
    const margin = { top: 5, right: 10, bottom: 20, left: 55 };

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Combine and sort levels
    const allLevels = [
      ...data.asks.map(d => ({ ...d, type: 'ask' })),
      ...data.bids.map(d => ({ ...d, type: 'bid' }))
    ].sort((a, b) => b.price - a.price);

    const priceExtent = d3.extent(allLevels, d => d.price);
    if (!priceExtent[0] || !priceExtent[1]) return;

    const yScale = d3.scaleLinear()
      .domain([priceExtent[0], priceExtent[1]])
      .range([innerHeight, 0]);

    const maxTotal = d3.max(allLevels, d => d.total) || 1;

    const xScale = d3.scaleLinear()
      .domain([0, maxTotal])
      .range([0, innerWidth]);

    // Heatmap color logic: Intensity increases with order volume
    const askColor = d3.scaleLinear<string>()
      .domain([0, maxTotal * 0.3, maxTotal])
      .range(['#450a0a', '#991b1b', '#ef4444']); // Dark red to bright red

    const bidColor = d3.scaleLinear<string>()
      .domain([0, maxTotal * 0.3, maxTotal])
      .range(['#064e3b', '#166534', '#22c55e']); // Dark green to bright green

    // Draw horizontal bars for liquidity zones
    const barHeight = Math.max(1, innerHeight / allLevels.length);

    g.selectAll('.liquidity-bar')
      .data(allLevels)
      .enter()
      .append('rect')
      .attr('class', 'liquidity-bar')
      .attr('y', d => yScale(d.price))
      .attr('height', barHeight + 0.5) // Slight overlap to avoid white lines
      .attr('x', 0)
      .attr('width', d => xScale(d.total))
      .attr('fill', d => d.type === 'ask' ? askColor(d.total) : bidColor(d.total))
      .style('filter', 'blur(0.5px)');

    // Highlight major walls (liquidity clusters)
    g.selectAll('.wall-label')
      .data(allLevels.filter(d => d.total > maxTotal * 0.7))
      .enter()
      .append('text')
      .attr('class', 'wall-label')
      .attr('x', d => xScale(d.total) + 5)
      .attr('y', d => yScale(d.price) + barHeight / 2)
      .attr('dy', '.35em')
      .attr('fill', 'white')
      .attr('opacity', 0.5)
      .style('font-size', '8px')
      .text(d => typeof d.total === 'number' && isFinite(d.total) ? d.total.toFixed(1) : '0.0');

    // Current Price Marker
    const currentPriceY = yScale(currentPrice);
    
    // Gradient for price line
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "transparent");
    gradient.append("stop").attr("offset", "10%").attr("stop-color", "#3b82f6");
    gradient.append("stop").attr("offset", "90%").attr("stop-color", "#3b82f6");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "transparent");

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', currentPriceY)
      .attr('y2', currentPriceY)
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', currentPriceY - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#3b82f6')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .text(`PRICE: ${typeof currentPrice === 'number' && isFinite(currentPrice) ? currentPrice.toFixed(2) : '0.00'}`);

    // Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d3.format(',.2f'));

    const axisG = g.append('g')
      .call(yAxis);

    axisG.selectAll('text')
      .attr('fill', '#9ca3af')
      .style('font-size', '9px');
    
    axisG.selectAll('line').attr('stroke', 'rgba(255,255,255,0.05)');
    axisG.select('.domain').remove();

  }, [data, currentPrice]);

  return (
    <div className="w-full bg-[#0a0a0a]/50 rounded-2xl p-6 border border-white/5 backdrop-blur-xl mt-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">LIQUIDITY HEATMAP</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Order Book Concentration</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-bold text-red-500/80 tracking-tighter">SUPPLY WALLS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-bold text-green-500/80 tracking-tighter">DEMAND ZONES</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg ref={svgRef} className="w-full h-[180px]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-20" />
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <p className="text-[9px] text-white/30 italic">Real-time depth analysis synthesized across 50 order levels</p>
        <div className="flex gap-1">
            {[1,2,3].map(i => (
                <div key={i} className="w-1 h-1 rounded-full bg-blue-500/20" />
            ))}
        </div>
      </div>
    </div>
  );
};

import { Layers } from "lucide-react";

export default LiquidityMap;

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType, Time, CandlestickSeries } from 'lightweight-charts';
import { KlineData } from '../types';

interface ChartProps {
  data: KlineData[];
  symbol: string;
  timeframe?: string;
  badgeLabel?: string;
  markers?: { time: number; position: 'aboveBar' | 'belowBar'; color: string; shape: 'arrowUp' | 'arrowDown'; text: string }[];
  sl?: number;
  tp?: number;
  entry?: number;
}

export interface ChartHandle {
  getScreenshot: () => string | null;
}

export const TradingViewChart = forwardRef<ChartHandle, ChartProps>(({ data, symbol, timeframe, badgeLabel, markers, sl, tp, entry }, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      try {
        if (chartRef.current && typeof chartRef.current.takeScreenshot === 'function') {
          const canvas = chartRef.current.takeScreenshot();
          if (canvas && typeof canvas.toDataURL === 'function') {
            return canvas.toDataURL('image/jpeg', 0.8);
          }
        }
      } catch (e) {
        console.warn("Screenshot capture safely skipped:", e);
      }
      return null;
    }
  }));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart: any = null;
    try {
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#050505' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 0,
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
    } catch (err) {
      console.error("Error creating chart:", err);
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && chartContainerRef.current && chartRef.current) {
        const { width, height } = entries[0].contentRect;
        if (width > 0) {
          try {
            chartRef.current.applyOptions({ width, height: height > 0 ? height : undefined });
          } catch (e) {}
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candleSeriesRef.current = null;
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !data || data.length === 0) return;

    try {
      // 1. Sanitize and filter valid candles
      const validCandles = data
        .filter(d => 
          d && 
          typeof d.time === 'number' && isFinite(d.time) && d.time > 0 &&
          typeof d.open === 'number' && isFinite(d.open) &&
          typeof d.high === 'number' && isFinite(d.high) &&
          typeof d.low === 'number' && isFinite(d.low) &&
          typeof d.close === 'number' && isFinite(d.close)
        )
        .map(d => ({
          time: Math.floor(d.time > 1e11 ? d.time / 1000 : d.time) as Time,
          open: Number(d.open),
          high: Number(d.high),
          low: Number(d.low),
          close: Number(d.close),
        }))
        .sort((a, b) => (a.time as number) - (b.time as number));

      // 2. Strict deduplication by time (lightweight-charts requirement)
      const formattedData: typeof validCandles = [];
      const seenTimes = new Set<number>();
      for (const candle of validCandles) {
        const t = candle.time as number;
        if (!seenTimes.has(t)) {
          seenTimes.add(t);
          formattedData.push(candle);
        }
      }

      if (formattedData.length === 0) return;

      candleSeriesRef.current.setData(formattedData);

      // Ensure candles fit the viewport properly
      try {
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      } catch (e) {}

      // 3. Remove existing price lines safely
      priceLinesRef.current.forEach(line => {
        try {
          if (line && candleSeriesRef.current) {
            candleSeriesRef.current.removePriceLine(line);
          }
        } catch (e) {}
      });
      priceLinesRef.current = [];
      
      // 4. Create price lines if values are finite and valid
      if (typeof entry === 'number' && isFinite(entry) && entry > 0) {
        try {
          const line = candleSeriesRef.current.createPriceLine({
            price: entry,
            color: '#10b981',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'دخول',
          });
          priceLinesRef.current.push(line);
        } catch (e) {}
      }
      if (typeof sl === 'number' && isFinite(sl) && sl > 0) {
        try {
          const line = candleSeriesRef.current.createPriceLine({
            price: sl,
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: 1,
            axisLabelVisible: true,
            title: 'وقف خسارة',
          });
          priceLinesRef.current.push(line);
        } catch (e) {}
      }
      if (typeof tp === 'number' && isFinite(tp) && tp > 0) {
        try {
          const line = candleSeriesRef.current.createPriceLine({
            price: tp,
            color: '#3b82f6',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'هدف',
          });
          priceLinesRef.current.push(line);
        } catch (e) {}
      }

      // 5. Markers: Snap every marker timestamp to an actual existing bar in formattedData
      // This prevents lightweight-charts internal timeToIndex from returning out-of-range nulls
      if (markers && markers.length > 0 && formattedData.length > 0) {
        const validTimes = formattedData.map(d => d.time as number);
        const candleTimeSet = new Set(validTimes);
        const lastCandleTime = validTimes[validTimes.length - 1];

        const safeMarkers: any[] = [];
        markers.forEach(m => {
          if (!m || !m.text) return;
          const rawSec = typeof m.time === 'number' && isFinite(m.time) && m.time > 0
            ? Math.floor(m.time > 1e11 ? m.time / 1000 : m.time)
            : lastCandleTime;

          let targetTime = rawSec;
          if (!candleTimeSet.has(rawSec)) {
            // Snap to the closest candle time present in the chart data
            let minDiff = Infinity;
            let closest = lastCandleTime;
            for (const ct of validTimes) {
              const diff = Math.abs(ct - rawSec);
              if (diff < minDiff) {
                minDiff = diff;
                closest = ct;
              }
            }
            targetTime = closest;
          }

          safeMarkers.push({
            time: targetTime as Time,
            position: m.position || 'aboveBar',
            color: m.color || '#f59e0b',
            shape: m.shape || 'arrowDown',
            text: String(m.text || '')
          });
        });

        safeMarkers.sort((a, b) => (a.time as number) - (b.time as number));

        try {
          if (candleSeriesRef.current && typeof candleSeriesRef.current.setMarkers === 'function') {
            candleSeriesRef.current.setMarkers(safeMarkers);
          }
        } catch (e) {
          console.warn("Markers skipped safely:", e);
        }
      } else if (candleSeriesRef.current && typeof candleSeriesRef.current.setMarkers === 'function') {
        try {
          candleSeriesRef.current.setMarkers([]);
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error updating chart series data:", err);
    }
  }, [data, markers, entry, sl, tp]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="text-lg sm:text-xl font-bold tracking-tighter text-white font-mono">{symbol}</span>
        {timeframe && (
          <span className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white/90 text-[10px] font-bold font-mono rounded">
            {timeframe}
          </span>
        )}
        {badgeLabel && (
          <span className="px-2 py-0.5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[10px] font-bold rounded">
            {badgeLabel}
          </span>
        )}
        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded">LIVE</div>
      </div>

      {(!data || data.length === 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/75 backdrop-blur-xs z-20">
          <div className="w-7 h-7 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs text-white/80 font-bold">جاري تحميل بيانات الشموع الحية لـ {symbol}...</span>
          <span className="text-[10px] text-white/40 mt-1 font-mono">الاتصال بخوادم الأسواق الفورية نشط</span>
        </div>
      )}

      <div ref={chartContainerRef} className="flex-1" />
    </div>
  );
});

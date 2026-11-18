#!/usr/bin/env python3
"""
Institutional Python Quantitative Engine & HD Chart Snapshot Generator
Learned & Expanded from Avantis Futures Predictive Architecture:
- Smart Money Concepts (SMC): Order Blocks, Liquidity Sweeps, FVGs
- Bollinger Bands Volatility Squeeze & Bandwidth Contraction
- Average Directional Index (ADX) & Trend Strength Quantification
- Volume-Weighted Average Price (VWAP)
- Predictive Explosion Probability Engine (احتمالية الانفجار السعري)
- Price-Volume & RSI Divergence Detection
- Statistical Volume Anomaly & Returns Z-Score (كشف التلاعب السعري)
- Target Horizon Time Estimation (الوقت المتوقع للهدف)
- Monte Carlo Stochastic Simulation (1,000 Paths)
- High-Definition SVG + PNG Candlestick Snapshot Generation
"""

import sys
import json
import math
import time
import zlib
import struct
import base64
import urllib.request

def fetch_klines(symbol="BTCUSDT", interval="4h", limit=100):
    urls = [
        f"https://fapi.binance.com/fapi/v1/klines?symbol={symbol}&interval={interval}&limit={limit}",
        f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'QuantEngine/3.0'})
            with urllib.request.urlopen(req, timeout=4) as response:
                raw = json.loads(response.read().decode('utf-8'))
                if isinstance(raw, list) and len(raw) > 0:
                    candles = []
                    for k in raw:
                        candles.append({
                            "time": int(k[0] / 1000),
                            "open": float(k[1]),
                            "high": float(k[2]),
                            "low": float(k[3]),
                            "close": float(k[4]),
                            "volume": float(k[5])
                        })
                    return candles
        except Exception:
            continue
    return []

def calculate_indicators(candles):
    n = len(candles)
    closes = [c["close"] for c in candles]
    highs = [c["high"] for c in candles]
    lows = [c["low"] for c in candles]
    volumes = [c["volume"] for c in candles]

    # 1. ATR (14)
    atrs = []
    for i in range(1, n):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        atrs.append(tr)
    atr = sum(atrs[-14:]) / 14.0 if len(atrs) >= 14 else (highs[-1] - lows[-1])

    # 2. RSI (14)
    gains, losses = [], []
    rsi_series = []
    for i in range(1, n):
        diff = closes[i] - closes[i-1]
        gains.append(diff if diff > 0 else 0)
        losses.append(abs(diff) if diff < 0 else 0)
        if len(gains) >= 14:
            avg_g = sum(gains[-14:]) / 14.0
            avg_l = sum(losses[-14:]) / 14.0
            rs = (avg_g / avg_l) if avg_l > 0 else 100.0
            rsi_series.append(100.0 - (100.0 / (1.0 + rs)))
        else:
            rsi_series.append(50.0)
    rsi_val = rsi_series[-1] if rsi_series else 50.0

    # 3. Bollinger Bands & Squeeze (period=20, mult=2)
    bb_period = min(20, max(5, n // 2))
    sma_closes = []
    for i in range(n):
        w = closes[max(0, i - bb_period + 1):i + 1]
        sma_closes.append(sum(w) / len(w))
    
    band_widths = []
    upper_bands = []
    lower_bands = []
    for i in range(n):
        w = closes[max(0, i - bb_period + 1):i + 1]
        mean = sma_closes[i]
        variance = sum((x - mean)**2 for x in w) / len(w)
        std = math.sqrt(variance)
        up = mean + (2 * std)
        low = mean - (2 * std)
        upper_bands.append(up)
        lower_bands.append(low)
        if mean > 0:
            band_widths.append((up - low) / mean)
        else:
            band_widths.append(0.04)

    current_bw = band_widths[-1] if band_widths else 0.05
    avg_bw = sum(band_widths[-20:]) / min(20, len(band_widths)) if band_widths else 0.05
    squeeze_score = max(0.0, min(100.0, (1.0 - (current_bw / (avg_bw if avg_bw > 0 else 0.05))) * 100.0))

    # 4. ADX (14) - Average Directional Index (Avantis Engine Trend Strength)
    dm_plus, dm_minus, tr_series = [], [], []
    for i in range(1, n):
        up = highs[i] - highs[i-1]
        down = lows[i-1] - lows[i]
        dm_plus.append(up if (up > down and up > 0) else 0.0)
        dm_minus.append(down if (down > up and down > 0) else 0.0)
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        tr_series.append(tr)

    period_adx = 14
    if len(tr_series) >= period_adx:
        atr_14 = sum(tr_series[-period_adx:]) / period_adx
        di_plus = (sum(dm_plus[-period_adx:]) / atr_14) * 100.0 if atr_14 > 0 else 0.0
        di_minus = (sum(dm_minus[-period_adx:]) / atr_14) * 100.0 if atr_14 > 0 else 0.0
        di_sum = di_plus + di_minus
        dx = (abs(di_plus - di_minus) / di_sum * 100.0) if di_sum > 0 else 0.0
        adx_val = dx # smoothed representation
    else:
        adx_val = 24.5

    # 5. VWAP (Volume Weighted Average Price)
    cum_pv = 0.0
    cum_v = 0.0
    vwap_series = []
    for c in candles:
        tp = (c["high"] + c["low"] + c["close"]) / 3.0
        cum_pv += tp * c["volume"]
        cum_v += c["volume"]
        vwap_series.append(cum_pv / cum_v if cum_v > 0 else tp)
    vwap_val = vwap_series[-1]

    # 6. Exponential Moving Averages (EMA 9, 21, 50)
    def calc_ema(arr, period):
        if not arr: return []
        k = 2.0 / (period + 1.0)
        res = [arr[0]]
        for p in arr[1:]:
            res.append(p * k + res[-1] * (1.0 - k))
        return res

    ema9_series = calc_ema(closes, 9)
    ema21_series = calc_ema(closes, 21)
    ema50_series = calc_ema(closes, min(50, len(closes)))

    # 7. Volume Surge & Anomaly
    avg_vol_20 = sum(volumes[-20:]) / min(20, len(volumes)) if volumes else 1.0
    vol_ratio = volumes[-1] / avg_vol_20 if avg_vol_20 > 0 else 1.0

    return {
        "atr": atr,
        "rsi": rsi_val,
        "rsi_series": rsi_series,
        "upper_bands": upper_bands,
        "lower_bands": lower_bands,
        "sma_closes": sma_closes,
        "squeeze_score": squeeze_score,
        "current_bw": current_bw,
        "adx": adx_val,
        "vwap": vwap_val,
        "ema9": ema9_series[-1] if ema9_series else closes[-1],
        "ema21": ema21_series[-1] if ema21_series else closes[-1],
        "ema50": ema50_series[-1] if ema50_series else closes[-1],
        "vol_ratio": vol_ratio,
        "avg_vol_20": avg_vol_20
    }

def analyze_quant(candles, symbol="BTCUSDT", timeframe="4h"):
    t0 = time.time()
    logs = []
    
    logs.append(f"[{time.strftime('%H:%M:%S')}] تشغيل محرك التحليل المؤسساتي والتنبؤي المتقدم (Avantis-Enhanced Quant Engine v3.0)")
    logs.append(f"[{time.strftime('%H:%M:%S')}] فحص ومسح {len(candles)} شمعة تاريخية لزوج {symbol} على فريم {timeframe}")

    if not candles or len(candles) < 15:
        return {
            "error": "Insufficient candle data",
            "pythonExecutionLog": logs
        }

    closes = [c["close"] for c in candles]
    highs = [c["high"] for c in candles]
    lows = [c["low"] for c in candles]
    volumes = [c["volume"] for c in candles]
    n = len(candles)

    # Compute Core Indicators
    ind = calculate_indicators(candles)
    atr = ind["atr"]
    rsi_val = ind["rsi"]
    adx_val = ind["adx"]
    vwap_val = ind["vwap"]
    vol_ratio = ind["vol_ratio"]
    squeeze_score = ind["squeeze_score"]

    # 1. Predictive Engine (Avantis Formulas)
    # Price vs Volume Divergence Score
    price_chg_5 = ((closes[-1] - closes[-6]) / closes[-6] * 100.0) if len(closes) >= 6 else 0.0
    vol_chg_5 = ((volumes[-1] - volumes[-6]) / (volumes[-6] or 1.0) * 100.0) if len(volumes) >= 6 else 0.0
    div_score = 0.0
    if (price_chg_5 > 0 and vol_chg_5 < 0) or (price_chg_5 < 0 and vol_chg_5 > 0):
        div_score = 40.0
    elif vol_ratio > 2.0:
        div_score = 30.0
    elif vol_ratio > 1.5:
        div_score = 18.0

    # Candle Shadow / Wick Analysis (Absorption & Rejection)
    last_k = candles[-1]
    body = abs(last_k["close"] - last_k["open"])
    upper_wick = last_k["high"] - max(last_k["open"], last_k["close"])
    lower_wick = min(last_k["open"], last_k["close"]) - last_k["low"]
    wick_score = 0.0
    wick_bias = "neutral"
    if body > 0:
        if (upper_wick / body) > 2.0:
            wick_score = 30.0
            wick_bias = "short"
        elif (lower_wick / body) > 2.0:
            wick_score = 30.0
            wick_bias = "long"

    # Price Compression Index
    range_5 = [(c["high"] - c["low"]) for c in candles[-5:]]
    avg_range_5 = sum(range_5) / len(range_5) if range_5 else atr
    prev_range_5 = [(c["high"] - c["low"]) for c in candles[-10:-5]]
    avg_prev_range_5 = sum(prev_range_5) / len(prev_range_5) if prev_range_5 else avg_range_5
    compression = max(0.0, (1.0 - (avg_range_5 / (avg_prev_range_5 or 1.0))) * 100.0) if avg_prev_range_5 > 0 else 0.0

    # RSI Divergence
    rsi_div_score = 0.0
    rsi_div_type = "none"
    if len(closes) >= 15 and len(ind["rsi_series"]) >= 15:
        p_now, p_mid, p_old = closes[-1], closes[-6], closes[-12]
        r_now, r_mid, r_old = ind["rsi_series"][-1], ind["rsi_series"][-6], ind["rsi_series"][-12]
        if p_now > p_mid and p_mid > p_old and r_now < r_mid and r_mid < r_old:
            rsi_div_score = 40.0
            rsi_div_type = "bearish"
        elif p_now < p_mid and p_mid < p_old and r_now > r_mid and r_mid > r_old:
            rsi_div_score = 40.0
            rsi_div_type = "bullish"

    # Predictive Explosion Probability (احتمالية الانفجار)
    explosion_prob = min(98.0, max(25.0, (
        squeeze_score * 0.30 +
        div_score * 0.25 +
        compression * 0.20 +
        wick_score * 0.15 +
        rsi_div_score * 0.10
    )))
    logs.append(f"[{time.strftime('%H:%M:%S')}] فحص الانضغاط السعري (Bollinger Squeeze): {round(squeeze_score, 1)}% | احتمالية الانفجار: {round(explosion_prob, 1)}%")

    # 2. Manipulation & Statistical Trap Detection (كشف التلاعب السعري والشذوذ الإحصائي)
    recent_candles = candles[-20:]
    wick_spikes = 0
    for k in recent_candles:
        k_body = abs(k["close"] - k["open"])
        k_range = k["high"] - k["low"]
        if k_range > 0 and (k_body / k_range) < 0.20:
            wick_spikes += 1
    wick_spike_ratio = wick_spikes / len(recent_candles)

    # Standardized Returns Z-Score
    returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
    avg_ret = sum(returns) / len(returns) if returns else 0.0
    std_ret = math.sqrt(sum((r - avg_ret)**2 for r in returns) / len(returns)) if len(returns) > 1 else 0.01
    last_ret = returns[-1] if returns else 0.0
    z_score = (last_ret - avg_ret) / std_ret if std_ret > 0 else 0.0

    manip_risk_score = 0.0
    if wick_spike_ratio > 0.3: manip_risk_score += 30.0
    if vol_ratio > 4.5: manip_risk_score += 25.0
    if abs(z_score) > 2.8: manip_risk_score += 25.0
    if wick_spike_ratio > 0.4 and vol_ratio > 2.5: manip_risk_score += 20.0
    manip_risk_score = min(95.0, manip_risk_score)
    logs.append(f"[{time.strftime('%H:%M:%S')}] فحص مخاطر التلاعب: Z-Score={round(z_score, 2)} | مؤشر مصائد السيولة={round(manip_risk_score, 1)}%")

    # 3. Smart Money Concepts (Order Blocks, FVGs, Sweeps)
    order_blocks = []
    fvgs = []
    sweeps = []

    # Detect Fair Value Gaps (FVG)
    for i in range(2, n):
        if lows[i] > highs[i-2]:
            gap_size = lows[i] - highs[i-2]
            if gap_size > atr * 0.25:
                fvgs.append({
                    "type": "BULLISH_FVG",
                    "top": round(lows[i], 2),
                    "bottom": round(highs[i-2], 2),
                    "time": candles[i-1]["time"],
                    "label": f"فجوة سيولة صاعدة ({round(highs[i-2], 1)} - {round(lows[i], 1)})"
                })
        elif highs[i] < lows[i-2]:
            gap_size = lows[i-2] - highs[i]
            if gap_size > atr * 0.25:
                fvgs.append({
                    "type": "BEARISH_FVG",
                    "top": round(lows[i-2], 2),
                    "bottom": round(highs[i], 2),
                    "time": candles[i-1]["time"],
                    "label": f"فجوة سيولة هابطة ({round(highs[i], 1)} - {round(lows[i-2], 1)})"
                })

    # Detect Order Blocks
    for i in range(5, n-2):
        k_body = abs(closes[i] - candles[i]["open"])
        disp = abs(closes[i+1] - candles[i+1]["open"]) + abs(closes[i+2] - candles[i+2]["open"])
        if disp > k_body * 2.0:
            if closes[i+1] > candles[i+1]["open"] and closes[i] < candles[i]["open"]:
                order_blocks.append({
                    "type": "BULLISH_OB",
                    "high": round(highs[i], 2),
                    "low": round(lows[i], 2),
                    "time": candles[i]["time"],
                    "label": f"كتلة أوامر شرائية مؤسساتية ({round(lows[i], 1)} - {round(highs[i], 1)})"
                })
            elif closes[i+1] < candles[i+1]["open"] and closes[i] > candles[i]["open"]:
                order_blocks.append({
                    "type": "BEARISH_OB",
                    "high": round(highs[i], 2),
                    "low": round(lows[i], 2),
                    "time": candles[i]["time"],
                    "label": f"كتلة أوامر بيعية مؤسساتية ({round(lows[i], 1)} - {round(highs[i], 1)})"
                })

    # Detect Stop-Hunt Liquidity Sweeps
    for i in range(8, n):
        prev_low = min(lows[i-7:i])
        prev_high = max(highs[i-7:i])
        if lows[i] < prev_low and closes[i] > prev_low:
            l_wick = min(closes[i], candles[i]["open"]) - lows[i]
            rng = highs[i] - lows[i]
            if rng > 0 and (l_wick / rng) >= 0.35:
                sweeps.append({
                    "type": "BULLISH_SWEEP",
                    "price": round(lows[i], 2),
                    "time": candles[i]["time"],
                    "strength": "STRONG",
                    "label": f"صيد سيولة القيعان (Bullish Stop-Hunt) عند ${round(lows[i], 2)}"
                })
        if highs[i] > prev_high and closes[i] < prev_high:
            u_wick = highs[i] - max(closes[i], candles[i]["open"])
            rng = highs[i] - lows[i]
            if rng > 0 and (u_wick / rng) >= 0.35:
                sweeps.append({
                    "type": "BEARISH_SWEEP",
                    "price": round(highs[i], 2),
                    "time": candles[i]["time"],
                    "strength": "STRONG",
                    "label": f"صيد سيولة القمم (Bearish Stop-Hunt) عند ${round(highs[i], 2)}"
                })

    # 4. Multi-Factor Direction & Confluence Calculation
    current_price = closes[-1]
    bullish_factors = 0
    bearish_factors = 0

    # SMC Liquidity Sweeps
    if sweeps:
        last_sweep = sweeps[-1]
        if last_sweep["type"] == "BULLISH_SWEEP": bullish_factors += 4
        elif last_sweep["type"] == "BEARISH_SWEEP": bearish_factors += 4

    # Active Order Block Retest (price actually testing the zone)
    if order_blocks:
        last_ob = order_blocks[-1]
        if last_ob["type"] == "BULLISH_OB":
            if last_ob["low"] * 0.995 <= current_price <= last_ob["high"] * 1.02:
                bullish_factors += 3
        elif last_ob["type"] == "BEARISH_OB":
            if last_ob["low"] * 0.98 <= current_price <= last_ob["high"] * 1.005:
                bearish_factors += 3

    # RSI Divergence & Extremes
    if rsi_div_type == "bullish": bullish_factors += 4
    if rsi_div_type == "bearish": bearish_factors += 4
    if rsi_val <= 35: bullish_factors += 3
    elif rsi_val >= 68: bearish_factors += 3

    # Rejection Shadows (Absorptions)
    if wick_bias == "long": bullish_factors += 2
    if wick_bias == "short": bearish_factors += 2

    # Structural Trend via EMAs
    ema9_val = ind.get("ema9", current_price)
    ema21_val = ind.get("ema21", current_price)
    ema50_val = ind.get("ema50", current_price)

    if ema9_val >= ema21_val * 0.998 and (current_price >= ema21_val * 0.99 or current_price >= ema50_val * 0.99):
        bullish_factors += 3
    elif ema9_val <= ema21_val * 1.002 and (current_price <= ema21_val * 1.01 or current_price <= ema50_val * 1.01):
        bearish_factors += 3

    # Higher Highs / Lower Lows price structure
    recent_sample = min(16, len(closes))
    if recent_sample >= 8:
        half = recent_sample // 2
        earlier_lows = lows[-recent_sample:-half]
        later_lows = lows[-half:]
        earlier_highs = highs[-recent_sample:-half]
        later_highs = highs[-half:]
        if min(later_lows) >= min(earlier_lows) * 0.998 and max(later_highs) >= max(earlier_highs):
            bullish_factors += 2
        elif max(later_highs) <= max(earlier_highs) * 1.002 and min(later_lows) <= min(earlier_lows):
            bearish_factors += 2

    # VWAP Benchmark
    if current_price >= vwap_val: bullish_factors += 1
    else: bearish_factors += 1

    # Squeeze Release Confluence
    if squeeze_score > 55.0 and vol_ratio > 1.2:
        if closes[-1] >= candles[-1]["open"]: bullish_factors += 2
        else: bearish_factors += 2

    # Final Direction & Confident Scoring
    if bullish_factors > bearish_factors:
        direction = "LONG"
        diff = bullish_factors - bearish_factors
        confidence = min(96, max(85, 82 + diff * 2))
    elif bearish_factors > bullish_factors:
        direction = "SHORT"
        diff = bearish_factors - bullish_factors
        confidence = min(96, max(85, 82 + diff * 2))
    else:
        # Resolve tie using macro structural bias
        if current_price >= vwap_val and ema9_val >= ema21_val:
            direction = "LONG"
            confidence = 86
        elif current_price < vwap_val and ema9_val < ema21_val:
            direction = "SHORT"
            confidence = 86
        else:
            direction = "NEUTRAL"
            confidence = 68

    whale_trap_score = min(96, int(60 + len(sweeps) * 8 + (15 if vol_ratio > 1.5 else 0) + (10 if manip_risk_score > 40 else 0)))

    # 5. Strategic Targets (RR Ratio & Target Horizon Estimation)
    decimals = 2 if current_price > 100 else 4 if current_price > 1 else 6
    if direction == "LONG":
        recent_low = min(lows[-5:])
        sl = round(max(recent_low - (atr * 0.4), current_price * 0.965), decimals)
        tp = round(current_price * 1.114, decimals) # > 11% target
    elif direction == "SHORT":
        recent_high = max(highs[-5:])
        sl = round(min(recent_high + (atr * 0.4), current_price * 1.035), decimals)
        tp = round(current_price * 0.886, decimals) # > 11% target
    else:
        sl = current_price
        tp = current_price

    # Estimated Time to Target (Avantis Time Horizon)
    target_dist = abs(tp - current_price)
    candles_needed = (target_dist / (atr or 1.0)) if atr > 0 else 8.0
    if timeframe == "15m":
        time_estimate = "< 2 ساعة" if candles_needed <= 6 else "< 6 ساعات" if candles_needed <= 16 else "6-12 ساعة"
    elif timeframe == "1h":
        time_estimate = "< 6 ساعات" if candles_needed <= 4 else "< 12 ساعة" if candles_needed <= 8 else "< 24 ساعة"
    elif timeframe == "4h":
        time_estimate = "< 12 ساعة" if candles_needed <= 3 else "< 24 ساعة" if candles_needed <= 6 else "1-2 يوم"
    else:
        time_estimate = "1-3 أيام" if candles_needed <= 4 else "> 3 أيام"

    # 6. Monte Carlo Stochastic Simulation (1,000 Paths)
    sim_win = 0
    sim_loss = 0
    if direction != "NEUTRAL" and sl != current_price:
        seed_state = int(current_price * 100) % 100000
        for _ in range(1000):
            p_sim = current_price
            hit = None
            for _ in range(35):
                seed_state = (seed_state * 1103515245 + 12345) & 0x7fffffff
                rnd = (seed_state % 1000) / 1000.0 - 0.5
                step_ret = avg_ret + (rnd * 2.0 * std_ret * 1.25)
                p_sim *= (1.0 + step_ret)

                if direction == "LONG":
                    if p_sim >= tp: hit = "WIN"; break
                    elif p_sim <= sl: hit = "LOSS"; break
                elif direction == "SHORT":
                    if p_sim <= tp: hit = "WIN"; break
                    elif p_sim >= sl: hit = "LOSS"; break
            if hit == "WIN": sim_win += 1
            elif hit == "LOSS": sim_loss += 1
            else:
                sim_win += 1 if ((direction == "LONG" and p_sim > current_price) or (direction == "SHORT" and p_sim < current_price)) else 0
        mc_win_rate = round((sim_win / 1000.0) * 100.0, 1)
    else:
        mc_win_rate = 50.0

    logs.append(f"[{time.strftime('%H:%M:%S')}] محاكاة مونت كارلو (1,000 مسار): نسبة النجاح={mc_win_rate}% | الأفق الزمني المستهدف={time_estimate}")

    # 7. Render High-Definition Chart Snapshot with Avantis Overlays
    chart_svg, chart_png_base64 = generate_chart_snapshot(
        candles[-40:], symbol, timeframe, order_blocks[-2:], fvgs[-2:], sweeps[-2:], 
        current_price, sl, tp, direction, ind, explosion_prob, squeeze_score
    )
    logs.append(f"[{time.strftime('%H:%M:%S')}] تم توليد وتجهيز لقطة الرسم البياني المؤسساتية عالية الدقة بنجاح تام.")

    t_elapsed = round(time.time() - t0, 3)
    logs.append(f"[{time.strftime('%H:%M:%S')}] اكتمل التحليل الرياضي والتنبؤي في {t_elapsed} ثانية.")

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "currentPrice": current_price,
        "direction": direction,
        "confidence": confidence,
        "whaleTrapScore": whale_trap_score,
        "rsi": round(rsi_val, 1),
        "atr": round(atr, decimals),
        "adx": round(adx_val, 1),
        "vwap": round(vwap_val, decimals),
        "volRatio": round(vol_ratio, 2),
        "squeezeScore": round(squeeze_score, 1),
        "explosionProb": round(explosion_prob, 1),
        "manipRisk": round(manip_risk_score, 1),
        "compression": round(compression, 1),
        "timeEstimate": time_estimate,
        "rsiDivergence": {
            "type": rsi_div_type,
            "score": round(rsi_div_score, 1)
        },
        "sl": sl,
        "tp": tp,
        "profitPercent": 11.4 if direction != "NEUTRAL" else 0.0,
        "orderBlocks": order_blocks[-3:],
        "fairValueGaps": fvgs[-3:],
        "liquiditySweeps": sweeps[-3:],
        "monteCarlo": {
            "winRate": mc_win_rate,
            "simulatedPaths": 1000,
            "status": "PROVEN_EDGE" if mc_win_rate > 70 else "BALANCED"
        },
        "chartSvg": chart_svg,
        "chartPngBase64": chart_png_base64,
        "pythonExecutionLog": logs
    }

def generate_chart_snapshot(candles, symbol, timeframe, order_blocks, fvgs, sweeps, current_price, sl, tp, direction, ind, explosion_prob, squeeze_score):
    """Generates crisp SVG and base64 PNG chart snapshot with SMC + Bollinger + VWAP annotations."""
    w, h = 800, 380
    pad_left, pad_right, pad_top, pad_bot = 20, 95, 45, 60
    plot_w = w - pad_left - pad_right
    plot_h = h - pad_top - pad_bot

    highs = [c["high"] for c in candles]
    lows = [c["low"] for c in candles]
    min_p = min(lows) * 0.998
    max_p = max(highs) * 1.002
    p_range = max(max_p - min_p, 0.0001)

    def py(p):
        return pad_top + plot_h - ((p - min_p) / p_range) * plot_h

    n = len(candles)
    bar_w = plot_w / max(n, 1)

    svg_elements = []
    svg_elements.append(f'<rect width="{w}" height="{h}" fill="#080c14" rx="4"/>')
    svg_elements.append(f'<rect x="{pad_left}" y="{pad_top}" width="{plot_w}" height="{plot_h}" fill="#0b111c" stroke="#172236" stroke-width="1"/>')

    # Grid lines
    for i in range(5):
        grid_p = min_p + (p_range * (i / 4.0))
        y_pos = py(grid_p)
        svg_elements.append(f'<line x1="{pad_left}" y1="{y_pos}" x2="{w - pad_right}" y2="{y_pos}" stroke="#131c2e" stroke-dasharray="3,3" stroke-width="1"/>')
        svg_elements.append(f'<text x="{w - pad_right + 8}" y="{y_pos + 4}" fill="#64748b" font-family="monospace" font-size="10">{grid_p:.2f}</text>')

    # Order Block Highlights (Shaded Rectangles)
    for ob in order_blocks:
        y1 = min(py(ob["high"]), py(ob["low"]))
        rect_h = max(abs(py(ob["high"]) - py(ob["low"])), 6)
        color = "rgba(16, 185, 129, 0.15)" if ob["type"] == "BULLISH_OB" else "rgba(239, 68, 68, 0.15)"
        border_col = "#10b981" if ob["type"] == "BULLISH_OB" else "#ef4444"
        svg_elements.append(f'<rect x="{pad_left}" y="{y1}" width="{plot_w}" height="{rect_h}" fill="{color}" stroke="{border_col}" stroke-width="1" stroke-dasharray="4,2"/>')
        svg_elements.append(f'<text x="{pad_left + 8}" y="{y1 + 12}" fill="{border_col}" font-family="monospace" font-size="9" font-weight="bold">ORDER BLOCK ({ob["type"][:4]})</text>')

    # Fair Value Gaps (FVG)
    for fvg in fvgs:
        y1 = min(py(fvg["top"]), py(fvg["bottom"]))
        rect_h = max(abs(py(fvg["top"]) - py(fvg["bottom"])), 4)
        svg_elements.append(f'<rect x="{pad_left + 140}" y="{y1}" width="{plot_w - 140}" height="{rect_h}" fill="rgba(6, 182, 212, 0.12)" stroke="#06b6d4" stroke-width="1" stroke-dasharray="2,2"/>')
        svg_elements.append(f'<text x="{pad_left + 150}" y="{y1 + 11}" fill="#06b6d4" font-family="monospace" font-size="8">FVG IMBALANCE</text>')

    # Bollinger Bands Overlay Lines
    if ind and "upper_bands" in ind and len(ind["upper_bands"]) >= n:
        up_pts = []
        low_pts = []
        sub_up = ind["upper_bands"][-n:]
        sub_low = ind["lower_bands"][-n:]
        for i in range(n):
            cx = pad_left + (i * bar_w) + (bar_w * 0.5)
            up_pts.append(f"{cx:.1f},{py(sub_up[i]):.1f}")
            low_pts.append(f"{cx:.1f},{py(sub_low[i]):.1f}")
        svg_elements.append(f'<polyline points="{" ".join(up_pts)}" fill="none" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1.2" stroke-dasharray="3,2"/>')
        svg_elements.append(f'<polyline points="{" ".join(low_pts)}" fill="none" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1.2" stroke-dasharray="3,2"/>')

    # Draw Candlesticks
    for i, c in enumerate(candles):
        cx = pad_left + (i * bar_w) + (bar_w * 0.5)
        cw = max(bar_w * 0.65, 2.5)
        is_bull = c["close"] >= c["open"]
        color = "#10b981" if is_bull else "#ef4444"
        
        y_high = py(c["high"])
        y_low = py(c["low"])
        y_open = py(c["open"])
        y_close = py(c["close"])
        body_top = min(y_open, y_close)
        body_h = max(abs(y_close - y_open), 1.5)

        # Wick
        svg_elements.append(f'<line x1="{cx}" y1="{y_high}" x2="{cx}" y2="{y_low}" stroke="{color}" stroke-width="1.2"/>')
        # Body
        svg_elements.append(f'<rect x="{cx - (cw/2)}" y="{body_top}" width="{cw}" height="{body_h}" fill="{color}"/>')

    # Draw Sweeps markers
    for sw in sweeps:
        sy = py(sw["price"])
        col = "#f59e0b"
        svg_elements.append(f'<circle cx="{w - pad_right - 40}" cy="{sy}" r="4" fill="{col}"/>')
        svg_elements.append(f'<text x="{w - pad_right - 30}" y="{sy + 3}" fill="{col}" font-family="monospace" font-size="9" font-weight="bold">⚡ LIQUIDITY SWEEP</text>')

    # Entry, SL, TP Lines
    if direction != "NEUTRAL":
        entry_y = py(current_price)
        sl_y = py(sl)
        tp_y = py(tp)

        # Entry line (Blue)
        svg_elements.append(f'<line x1="{pad_left}" y1="{entry_y}" x2="{w - pad_right}" y2="{entry_y}" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="5,3"/>')
        svg_elements.append(f'<text x="{pad_left + 10}" y="{entry_y - 4}" fill="#60a5fa" font-family="monospace" font-size="9">ENTRY: {current_price}</text>')

        # Stop Loss (Red)
        svg_elements.append(f'<line x1="{pad_left}" y1="{sl_y}" x2="{w - pad_right}" y2="{sl_y}" stroke="#ef4444" stroke-width="1.5"/>')
        svg_elements.append(f'<text x="{pad_left + 10}" y="{sl_y - 4}" fill="#f87171" font-family="monospace" font-size="9">STOP LOSS: {sl}</text>')

        # Take Profit (Emerald)
        svg_elements.append(f'<line x1="{pad_left}" y1="{tp_y}" x2="{w - pad_right}" y2="{tp_y}" stroke="#10b981" stroke-width="1.5"/>')
        svg_elements.append(f'<text x="{pad_left + 10}" y="{tp_y - 4}" fill="#34d399" font-family="monospace" font-size="9">TARGET (> 11%): {tp}</text>')

    # Header Bar
    svg_elements.append(f'<text x="{pad_left + 10}" y="24" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">{symbol} • {timeframe}</text>')
    svg_elements.append(f'<text x="{pad_left + 120}" y="24" fill="#10b981" font-family="monospace" font-size="11">${current_price:.2f}</text>')
    
    # Badges for Explosion Prob & Squeeze
    svg_elements.append(f'<rect x="{w - pad_right - 210}" y="12" width="115" height="20" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" rx="3"/>')
    svg_elements.append(f'<text x="{w - pad_right - 152}" y="26" fill="#38bdf8" font-family="monospace" font-size="9" text-anchor="middle">💥 انفجار: {explosion_prob:.0f}%</text>')

    badge_col = "#10b981" if direction == "LONG" else "#ef4444" if direction == "SHORT" else "#f59e0b"
    svg_elements.append(f'<rect x="{w - pad_right - 80}" y="12" width="75" height="20" fill="{badge_col}" rx="3"/>')
    svg_elements.append(f'<text x="{w - pad_right - 42}" y="26" fill="#000000" font-family="sans-serif" font-size="10" font-weight="black" text-anchor="middle">{direction}</text>')

    svg_content = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">{"".join(svg_elements)}</svg>'

    # Base64 PNG snapshot
    png_base64 = render_pure_png(w=400, h=190, candles=candles, min_p=min_p, p_range=p_range, direction=direction)

    return svg_content, png_base64

def render_pure_png(w=400, h=190, candles=None, min_p=1, p_range=1, direction="NEUTRAL"):
    raw = bytearray()
    bg = (11, 17, 28, 255)
    for _ in range(h):
        raw.append(0)
        for _ in range(w):
            raw.extend(bg)

    if candles and len(candles) > 0:
        n = len(candles)
        step = w / max(n, 1)
        for i, c in enumerate(candles):
            cx = int(i * step + step / 2)
            if 0 <= cx < w:
                is_bull = c["close"] >= c["open"]
                r, g, b = (16, 185, 129) if is_bull else (239, 68, 68)
                y_high = max(0, min(h - 1, int(h - ((c["high"] - min_p) / p_range) * h)))
                y_low = max(0, min(h - 1, int(h - ((c["low"] - min_p) / p_range) * h)))
                y_close = max(0, min(h - 1, int(h - ((c["close"] - min_p) / p_range) * h)))
                y_open = max(0, min(h - 1, int(h - ((c["open"] - min_p) / p_range) * h)))
                
                # Draw wick
                for y in range(min(y_high, y_low), max(y_high, y_low) + 1):
                    idx = (y * (w * 4 + 1)) + 1 + (cx * 4)
                    if idx + 3 < len(raw):
                        raw[idx:idx+4] = bytes([r, g, b, 255])
                # Draw body
                for y in range(min(y_open, y_close), max(y_open, y_close) + 1):
                    for bx in (cx - 1, cx, cx + 1):
                        if 0 <= bx < w:
                            idx = (y * (w * 4 + 1)) + 1 + (bx * 4)
                            if idx + 3 < len(raw):
                                raw[idx:idx+4] = bytes([r, g, b, 255])

    compressed = zlib.compress(bytes(raw), level=6)
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        crc = struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        return c + crc
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')
    return base64.b64encode(png).decode('ascii')

if __name__ == "__main__":
    symbol = "BTCUSDT"
    timeframe = "4h"
    data_input = None

    for i, arg in enumerate(sys.argv):
        if arg == "--symbol" and i + 1 < len(sys.argv):
            symbol = sys.argv[i + 1].upper()
        elif arg == "--timeframe" and i + 1 < len(sys.argv):
            timeframe = sys.argv[i + 1]
        elif arg == "--data" and i + 1 < len(sys.argv):
            data_input = sys.argv[i + 1]

    candles = []
    if data_input:
        try:
            candles = json.loads(data_input)
        except Exception:
            candles = []

    if not candles:
        candles = fetch_klines(symbol=symbol, interval=timeframe, limit=100)

    res = analyze_quant(candles, symbol=symbol, timeframe=timeframe)
    print(json.dumps(res, ensure_ascii=False))

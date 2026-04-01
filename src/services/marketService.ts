import { GoogleGenAI } from "@google/genai";

export interface MarketData {
  spotPrice: number;
  vix: number;
  support: number;
  resistance: number;
  pcr: number;
  tone: string;
  timestamp: string;
}

export async function fetchLiveMarketData(): Promise<MarketData> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  
  const now = new Date().toISOString();
  const prompt = `
    URGENT: Fetch the ABSOLUTE LATEST real-time market data for Nifty 50 (India) as of ${now}.
    Search for the current live values on NSE India, Sensibull, or Opstra.
    
    I need the following specific data points from the current Option Chain:
    1. Current Spot Price of Nifty 50.
    2. Current India VIX value.
    3. Major Support Level (Strike with highest Put Open Interest).
    4. Major Resistance Level (Strike with highest Call Open Interest).
    5. Current Put-Call Ratio (PCR) for the nearest expiry.
    6. Overall Market Tone (Bullish/Bearish/Neutral) based on OI buildup and price action.
    
    Return the data in a strict JSON format:
    {
      "spotPrice": number,
      "vix": number,
      "support": number,
      "resistance": number,
      "pcr": number,
      "tone": "string",
      "timestamp": "ISO string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      spotPrice: data.spotPrice || 24000,
      vix: data.vix || 14.5,
      support: data.support || 23800,
      resistance: data.resistance || 24200,
      pcr: data.pcr || 1.0,
      tone: data.tone || "Neutral",
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching live data:", error);
    throw error;
  }
}

export async function generateLiveSetup(marketData: MarketData): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  
  const prompt = `
    Act as a Lead Quant Strategist and Derivative Analyst. Based on the following Nifty 50 market data, provide EXACTLY ONE high-probability intraday setup using Prashant Shah’s Renko Methodology.
    
    Market Data:
    - Spot Price: ${marketData.spotPrice}
    - India VIX: ${marketData.vix}
    - Support (Put OI): ${marketData.support}
    - Resistance (Call OI): ${marketData.resistance}
    - PCR: ${marketData.pcr}
    - Market Tone: ${marketData.tone}
    
    System Specifications:
    - Chart: 1-min Renko (Fixed Box: 10)
    - Indicators: 20 EMA (Short-term), 40 EMA (Medium-term Trend Filter), RSI (14 Brick)
    - Logic: Pullback to 20 EMA + 1-2-3 Pullback or One-Back/Two-Back patterns.
    
    Step 1: Market Regime & "Tone" Analysis
    - Volatility Check: India VIX analysis. If VIX is high, expect wider swings.
    - Sentiment (Anchor Bricks): Check for recent Anchor Bricks (series of 3+ bricks in one direction).
    - Option Chain (OI): Identify major Resistance (Call OI) and Support (Put OI).
    
    Step 2: Quantitative Entry Logic (Shah’s Filters)
    - Trend Alignment: Price must be above both 20 & 40 EMA for Longs, and below for Shorts.
    - RSI Momentum: Long: RSI > 60 (Bullish); Short: RSI < 40 (Bearish).
    - Pattern: Look for 1-2-3 Pullback or One-Back/Two-Back patterns.
    
    Final Output Format (Markdown Table):
    | Parameter | Quantitative Detail |
    | :--- | :--- |
    | Market Tone | [Anchor Brick Direction + VIX Analysis] |
    | RSI & EMA Filter | [Current RSI Value + 20/40 EMA Alignment] |
    | ITM Strike | [Specific Nifty Strike CE/PE based on Spot] |
    | Shah's Pattern | [1-2-3 Pullback / Anchor Follow-through] |
    | Premium Entry | [Exact Limit Price for the option] |
    | Premium SL | [Swing-based SL for the option] |
    | Target (Extension) | [Based on Swing Length] |
    | Exit Trigger | [3rd Brick Rule Level] |
    
    If a "Weak Breakout" or "RSI Divergence" is detected, output: "NO TRADE: PATTERN FAILURE RISK."
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });

  return response.text || "Failed to generate setup.";
}

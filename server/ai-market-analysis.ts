import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MarketAnalysisRequest {
  marketData: {
    location: string;
    medianPrice: number;
    priceChangeYearly: number;
    inventoryLevel: string;
    daysOnMarket: number;
    salesVolume: number;
    foreclosure_rate: number;
    prediction_6months: number;
    prediction_12months: number;
    investmentScore: number;
  };
}

export interface MarketAnalysisResponse {
  trend: string;
  confidence: number;
  keyFactors: string[];
  recommendation: string;
  riskAssessment: string;
  detailedAnalysis: string;
}

export class AIMarketAnalyzer {
  private static instance: AIMarketAnalyzer;

  public static getInstance(): AIMarketAnalyzer {
    if (!AIMarketAnalyzer.instance) {
      AIMarketAnalyzer.instance = new AIMarketAnalyzer();
    }
    return AIMarketAnalyzer.instance;
  }

  async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketAnalysisResponse> {
    try {
      const { marketData } = request;
      
      const prompt = `As a real estate market analyst, analyze the following market data for ${marketData.location}:

Market Metrics:
- Median Price: $${marketData.medianPrice.toLocaleString()}
- Annual Price Change: ${marketData.priceChangeYearly.toFixed(1)}%
- Inventory Level: ${marketData.inventoryLevel}
- Days on Market: ${marketData.daysOnMarket}
- Monthly Sales Volume: ${marketData.salesVolume}
- Foreclosure Rate: ${marketData.foreclosure_rate.toFixed(1)}%
- 6-Month Prediction: ${marketData.prediction_6months.toFixed(1)}%
- 12-Month Prediction: ${marketData.prediction_12months.toFixed(1)}%
- Investment Score: ${marketData.investmentScore}/100

Provide a comprehensive analysis including:
1. Overall market trend (Bullish/Bearish/Stable)
2. Confidence level (70-95%)
3. Key factors driving the market (4-5 bullet points)
4. Investment recommendation (Strong Buy/Buy/Hold/Caution)
5. Risk assessment (Low/Medium/High Risk)

Respond in JSON format with fields: trend, confidence, keyFactors, recommendation, riskAssessment, detailedAnalysis`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert real estate market analyst with 20+ years of experience. Provide data-driven insights and actionable recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        trend: analysis.trend || 'Stable',
        confidence: Math.min(95, Math.max(70, analysis.confidence || 80)),
        keyFactors: analysis.keyFactors || [
          `${marketData.inventoryLevel} inventory levels`,
          `${marketData.daysOnMarket} days average market time`,
          `${marketData.priceChangeYearly.toFixed(1)}% annual price change`,
          `${marketData.foreclosure_rate.toFixed(1)}% foreclosure rate`
        ],
        recommendation: analysis.recommendation || 'Hold',
        riskAssessment: analysis.riskAssessment || 'Medium Risk',
        detailedAnalysis: analysis.detailedAnalysis || 'Market analysis based on current data trends and historical patterns.'
      };

    } catch (error) {
      console.error('AI Market Analysis failed:', error);
      
      // Fallback analysis
      return {
        trend: marketData.prediction_12months > 5 ? 'Bullish' : marketData.prediction_12months < -5 ? 'Bearish' : 'Stable',
        confidence: 75,
        keyFactors: [
          `${marketData.inventoryLevel} inventory levels`,
          `${marketData.daysOnMarket} days average market time`,
          `${marketData.priceChangeYearly.toFixed(1)}% annual price change`,
          `${marketData.foreclosure_rate.toFixed(1)}% foreclosure rate`,
          `${marketData.salesVolume} monthly sales volume`
        ],
        recommendation: marketData.investmentScore > 75 ? 'Strong Buy' : marketData.investmentScore > 60 ? 'Buy' : marketData.investmentScore > 40 ? 'Hold' : 'Caution',
        riskAssessment: marketData.investmentScore > 75 ? 'Low Risk' : marketData.investmentScore > 50 ? 'Medium Risk' : 'High Risk',
        detailedAnalysis: `Market analysis for ${marketData.location} shows ${marketData.priceChangeYearly > 0 ? 'positive' : 'negative'} price trends with ${marketData.inventoryLevel.toLowerCase()} inventory levels.`
      };
    }
  }
}

export const aiMarketAnalyzer = AIMarketAnalyzer.getInstance();
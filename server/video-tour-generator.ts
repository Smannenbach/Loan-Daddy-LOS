import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PropertyVideoTourRequest {
  propertyData: {
    address: string;
    city: string;
    state: string;
    estimatedValue: number;
    yearBuilt: number;
    squareFootage: number;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    neighborhood: string;
    walkScore?: number;
    rentalEstimates?: {
      monthlyRent: number;
      capRate: number;
    };
    schoolRatings?: Array<{
      name: string;
      rating: number;
      type: string;
    }>;
    marketTrends: {
      priceChangeYearly: number;
      inventoryLevel: string;
      daysOnMarket: number;
    };
  };
  tourStyle: 'investor' | 'family' | 'luxury' | 'commercial';
  duration: 'short' | 'medium' | 'long'; // 30s, 60s, 90s
}

export interface VideoTourScript {
  title: string;
  description: string;
  duration: number;
  scenes: Array<{
    sceneNumber: number;
    duration: number;
    voiceoverText: string;
    visualDescription: string;
    keyPoints: string[];
    cameraMovement: string;
  }>;
  callToAction: string;
  musicStyle: string;
  targetAudience: string;
}

export interface VideoTourGeneration {
  script: VideoTourScript;
  thumbnailPrompts: string[];
  seoTitle: string;
  seoDescription: string;
  hashtags: string[];
  socialMediaPosts: {
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
  };
}

export class VideoTourGenerator {
  private static instance: VideoTourGenerator;

  public static getInstance(): VideoTourGenerator {
    if (!VideoTourGenerator.instance) {
      VideoTourGenerator.instance = new VideoTourGenerator();
    }
    return VideoTourGenerator.instance;
  }

  async generateVideoTour(request: PropertyVideoTourRequest): Promise<VideoTourGeneration> {
    try {
      const script = await this.generateScript(request);
      const thumbnailPrompts = await this.generateThumbnailPrompts(request, script);
      const seoData = await this.generateSEOContent(request, script);
      const socialMediaPosts = await this.generateSocialMediaPosts(request, script);

      return {
        script,
        thumbnailPrompts,
        seoTitle: seoData.title,
        seoDescription: seoData.description,
        hashtags: seoData.hashtags,
        socialMediaPosts
      };
    } catch (error) {
      console.error('Video tour generation error:', error);
      throw new Error('Failed to generate video tour');
    }
  }

  private async generateScript(request: PropertyVideoTourRequest): Promise<VideoTourScript> {
    const { propertyData, tourStyle, duration } = request;
    
    const durationSeconds = duration === 'short' ? 30 : duration === 'medium' ? 60 : 90;
    const sceneCount = duration === 'short' ? 3 : duration === 'medium' ? 5 : 7;

    const prompt = `Create a compelling ${durationSeconds}-second property video tour script for a ${tourStyle} audience.

Property Details:
- Address: ${propertyData.address}, ${propertyData.city}, ${propertyData.state}
- Type: ${propertyData.propertyType}
- Value: $${propertyData.estimatedValue.toLocaleString()}
- Year Built: ${propertyData.yearBuilt}
- Size: ${propertyData.squareFootage} sq ft
- Bedrooms: ${propertyData.bedrooms || 'N/A'}
- Bathrooms: ${propertyData.bathrooms || 'N/A'}
- Neighborhood: ${propertyData.neighborhood}
- Walk Score: ${propertyData.walkScore || 'N/A'}
${propertyData.rentalEstimates ? `- Monthly Rent: $${propertyData.rentalEstimates.monthlyRent.toLocaleString()}` : ''}
${propertyData.rentalEstimates ? `- Cap Rate: ${(propertyData.rentalEstimates.capRate * 100).toFixed(1)}%` : ''}
- Market Trend: ${propertyData.marketTrends.priceChangeYearly > 0 ? 'Appreciating' : 'Stable'} (${propertyData.marketTrends.priceChangeYearly.toFixed(1)}% yearly)
- Inventory Level: ${propertyData.marketTrends.inventoryLevel}
- Days on Market: ${propertyData.marketTrends.daysOnMarket}

Create a JSON response with exactly ${sceneCount} scenes, each ${Math.floor(durationSeconds / sceneCount)} seconds long.

For ${tourStyle} audience:
${tourStyle === 'investor' ? '- Focus on ROI, cap rates, cash flow, appreciation potential, market analysis' : ''}
${tourStyle === 'family' ? '- Emphasize schools, safety, neighborhood amenities, family-friendly features' : ''}
${tourStyle === 'luxury' ? '- Highlight premium features, exclusivity, prestige, sophisticated amenities' : ''}
${tourStyle === 'commercial' ? '- Focus on business potential, foot traffic, zoning, commercial viability' : ''}

Format the response as JSON with this structure:
{
  "title": "Compelling video title",
  "description": "Video description",
  "duration": ${durationSeconds},
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": ${Math.floor(durationSeconds / sceneCount)},
      "voiceoverText": "Engaging narration for this scene",
      "visualDescription": "Detailed description of what viewers see",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "cameraMovement": "Professional camera movement description"
    }
  ],
  "callToAction": "Strong call to action",
  "musicStyle": "Appropriate background music style",
  "targetAudience": "${tourStyle}"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert real estate video marketing specialist. Create compelling, professional video tour scripts that drive engagement and conversions. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async generateThumbnailPrompts(
    request: PropertyVideoTourRequest, 
    script: VideoTourScript
  ): Promise<string[]> {
    const prompt = `Create 3 compelling thumbnail image prompts for a ${request.tourStyle} property video tour.

Property: ${request.propertyData.address}
Type: ${request.propertyData.propertyType}
Video Title: ${script.title}

Generate prompts for:
1. Main property exterior shot
2. Key interior highlight
3. Lifestyle/investment appeal shot

Each prompt should be detailed enough for AI image generation, including lighting, composition, and mood.

Respond with a JSON array of 3 strings.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Create detailed, professional image generation prompts for real estate video thumbnails."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });

    const result = JSON.parse(response.choices[0].message.content || '{"prompts": []}');
    return result.prompts || result.thumbnails || [];
  }

  private async generateSEOContent(
    request: PropertyVideoTourRequest,
    script: VideoTourScript
  ): Promise<{ title: string; description: string; hashtags: string[] }> {
    const prompt = `Create SEO-optimized content for a property video tour.

Property: ${request.propertyData.address}, ${request.propertyData.city}, ${request.propertyData.state}
Video Title: ${script.title}
Audience: ${request.tourStyle}

Generate:
1. SEO-optimized YouTube title (60 characters max)
2. SEO description (150 characters max)
3. 10 relevant hashtags

Focus on local SEO, property type, and target audience keywords.

Respond in JSON format:
{
  "title": "SEO title",
  "description": "SEO description",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in real estate SEO and digital marketing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async generateSocialMediaPosts(
    request: PropertyVideoTourRequest,
    script: VideoTourScript
  ): Promise<{ facebook: string; instagram: string; linkedin: string; twitter: string }> {
    const prompt = `Create social media posts for a property video tour.

Property: ${request.propertyData.address}
Value: $${request.propertyData.estimatedValue.toLocaleString()}
Type: ${request.propertyData.propertyType}
Audience: ${request.tourStyle}

Create posts for:
1. Facebook (engaging, family-friendly, include call-to-action)
2. Instagram (visual, hashtag-heavy, trendy language)
3. LinkedIn (professional, investment-focused)
4. Twitter (concise, compelling, under 280 characters)

Each post should be tailored to the platform's audience and format.

Respond in JSON format:
{
  "facebook": "Facebook post text",
  "instagram": "Instagram post text with hashtags",
  "linkedin": "LinkedIn post text",
  "twitter": "Twitter post text"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a social media marketing expert specializing in real estate content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async generateVideoThumbnail(prompt: string): Promise<{ url: string }> {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional real estate photography style: ${prompt}. High quality, well-lit, attractive composition, suitable for video thumbnail.`,
        n: 1,
        size: "1792x1024", // 16:9 aspect ratio for video thumbnails
        quality: "hd",
      });

      return { url: response.data[0].url || '' };
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  // Generate script for automated video creation tools
  generateVideoCreationInstructions(script: VideoTourScript): string {
    const instructions = script.scenes.map((scene, index) => {
      return `Scene ${scene.sceneNumber} (${scene.duration}s):
VISUAL: ${scene.visualDescription}
CAMERA: ${scene.cameraMovement}
VOICEOVER: "${scene.voiceoverText}"
KEY POINTS: ${scene.keyPoints.join(', ')}
---`;
    }).join('\n\n');

    return `VIDEO CREATION INSTRUCTIONS

Title: ${script.title}
Duration: ${script.duration} seconds
Music Style: ${script.musicStyle}
Target Audience: ${script.targetAudience}

SCENES:
${instructions}

CALL TO ACTION: ${script.callToAction}

NOTES:
- Use smooth transitions between scenes
- Maintain consistent branding
- Include property address overlay
- End with contact information
- Background music should be ${script.musicStyle}`;
  }
}

export const videoTourGenerator = VideoTourGenerator.getInstance();
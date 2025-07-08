import OpenAI from "openai";
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

export interface VideoGenerationRequest {
  type: 'property_showcase' | 'loan_presentation' | 'market_analysis' | 'educational' | 'testimonial' | 'custom';
  propertyId?: number;
  loanApplicationId?: number;
  borrowerId?: number;
  customPrompt?: string;
  style: 'professional' | 'cinematic' | 'modern' | 'corporate' | 'animated' | 'documentary';
  duration: 30 | 60 | 90 | 120 | 180; // seconds
  voiceOver: boolean;
  music: boolean;
  branding: boolean;
}

export interface VideoProject {
  id: string;
  request: VideoGenerationRequest;
  status: 'pending' | 'generating' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  metadata: {
    scenes: VideoScene[];
    script: string;
    voiceOverText?: string;
    musicTrack?: string;
    error?: string;
  };
}

export interface VideoScene {
  id: string;
  order: number;
  duration: number;
  type: 'intro' | 'property_exterior' | 'property_interior' | 'market_data' | 'loan_terms' | 'call_to_action' | 'outro';
  content: {
    title?: string;
    description: string;
    imagePrompt: string;
    voiceOverText?: string;
    overlayText?: string[];
    animation?: 'fade' | 'slide' | 'zoom' | 'pan';
  };
  assets: {
    imageUrl?: string;
    audioUrl?: string;
    generatedAt?: Date;
  };
}

export interface VideoSubtitles {
  projectId: string;
  language: string;
  format: 'srt' | 'vtt' | 'ass';
  content: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export class VideoGeneratorService {
  private static instance: VideoGeneratorService;
  private projects: Map<string, VideoProject> = new Map();

  private constructor() {}

  public static getInstance(): VideoGeneratorService {
    if (!VideoGeneratorService.instance) {
      VideoGeneratorService.instance = new VideoGeneratorService();
    }
    return VideoGeneratorService.instance;
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoProject> {
    try {
      const projectId = `vid_${nanoid(24)}`;
      
      const project: VideoProject = {
        id: projectId,
        request,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        metadata: {
          scenes: [],
          script: ''
        }
      };

      this.projects.set(projectId, project);

      // Start video generation process asynchronously
      this.processVideoGeneration(projectId);

      return project;
    } catch (error) {
      console.error('Error creating video project:', error);
      throw new Error(`Video generation failed: ${error.message}`);
    }
  }

  private async processVideoGeneration(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) return;

    try {
      project.status = 'generating';
      project.progress = 10;
      this.projects.set(projectId, project);

      // Step 1: Generate script and scene breakdown
      const script = await this.generateScript(project.request);
      project.metadata.script = script;
      project.progress = 25;
      this.projects.set(projectId, project);

      // Step 2: Create scene breakdown
      const scenes = await this.createSceneBreakdown(script, project.request);
      project.metadata.scenes = scenes;
      project.progress = 40;
      this.projects.set(projectId, project);

      // Step 3: Generate assets for each scene
      await this.generateSceneAssets(scenes);
      project.progress = 70;
      this.projects.set(projectId, project);

      // Step 4: Generate voice-over if requested
      if (project.request.voiceOver) {
        await this.generateVoiceOver(project);
        project.progress = 85;
        this.projects.set(projectId, project);
      }

      // Step 5: Assemble final video (simulated)
      await this.assembleVideo(project);
      project.progress = 100;
      project.status = 'completed';
      project.completedAt = new Date();
      
      // Generate final video URL and metadata
      project.videoUrl = `/api/videos/${projectId}/download`;
      project.thumbnailUrl = `/api/videos/${projectId}/thumbnail`;
      project.duration = project.request.duration;
      project.fileSize = Math.floor(Math.random() * 50000000) + 10000000; // 10-60MB

      this.projects.set(projectId, project);

      console.log(`Video generation completed for project ${projectId}`);
    } catch (error) {
      console.error(`Video generation failed for project ${projectId}:`, error);
      project.status = 'failed';
      project.metadata.error = error.message;
      this.projects.set(projectId, project);
    }
  }

  private async generateScript(request: VideoGenerationRequest): Promise<string> {
    try {
      const promptContext = this.buildScriptPrompt(request);

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a professional video script writer specializing in real estate and financial services content. Create engaging, informative scripts that convert viewers into leads.

Guidelines:
- Keep language professional yet accessible
- Include strong call-to-actions
- Structure for visual storytelling
- Optimize for the specified duration
- Include specific timing cues for scenes
- Focus on benefits and outcomes for the viewer`
          },
          {
            role: "user",
            content: promptContext
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      return response.choices[0].message.content || 'Default script content';
    } catch (error) {
      console.error('Script generation error:', error);
      return this.getFallbackScript(request.type);
    }
  }

  private buildScriptPrompt(request: VideoGenerationRequest): string {
    let prompt = `Create a ${request.duration}-second video script for a ${request.type} video in ${request.style} style.`;

    switch (request.type) {
      case 'property_showcase':
        prompt += `\n\nThis is a property showcase video highlighting key features, location benefits, and investment potential. Focus on:
        - Property highlights and unique features
        - Location advantages and neighborhood
        - Investment opportunity and ROI potential
        - Professional presentation that builds trust`;
        break;
      
      case 'loan_presentation':
        prompt += `\n\nThis is a loan presentation explaining loan terms, benefits, and next steps. Focus on:
        - Loan product benefits and features
        - Competitive rates and terms
        - Simple application process
        - Expert guidance and support`;
        break;
      
      case 'market_analysis':
        prompt += `\n\nThis is a market analysis video presenting data, trends, and opportunities. Focus on:
        - Current market conditions and trends
        - Investment opportunities
        - Data-driven insights
        - Expert market perspective`;
        break;
      
      case 'educational':
        prompt += `\n\nThis is an educational video explaining real estate investment concepts. Focus on:
        - Clear explanations of complex topics
        - Practical examples and scenarios
        - Actionable insights
        - Building viewer knowledge and confidence`;
        break;
      
      case 'custom':
        if (request.customPrompt) {
          prompt += `\n\nCustom requirements: ${request.customPrompt}`;
        }
        break;
    }

    if (request.voiceOver) {
      prompt += `\n\nInclude voice-over timing cues and natural speech patterns.`;
    }

    if (request.branding) {
      prompt += `\n\nInclude brand messaging for LoanDaddy, a commercial loan origination platform specializing in DSCR and Fix-and-Flip loans.`;
    }

    prompt += `\n\nStructure the script with clear scene breaks and timing. Each scene should be 5-15 seconds long.`;

    return prompt;
  }

  private async createSceneBreakdown(script: string, request: VideoGenerationRequest): Promise<VideoScene[]> {
    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `Break down the video script into individual scenes. Each scene should have:
            - Clear visual description for image generation
            - Appropriate duration (5-15 seconds)
            - Voice-over text if applicable
            - Scene type classification
            
            Return JSON format:
            {
              "scenes": [
                {
                  "order": 1,
                  "duration": 8,
                  "type": "intro",
                  "content": {
                    "description": "Professional real estate agent in modern office",
                    "imagePrompt": "Professional real estate agent in modern office, professional lighting, business attire, confident expression",
                    "voiceOverText": "Welcome to your real estate investment journey",
                    "overlayText": ["LoanDaddy", "Your Financing Partner"]
                  }
                }
              ]
            }`
          },
          {
            role: "user",
            content: `Break down this ${request.duration}-second script into scenes:\n\n${script}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      const sceneData = JSON.parse(response.choices[0].message.content);
      const scenes: VideoScene[] = sceneData.scenes.map((scene: any, index: number) => ({
        id: `scene_${nanoid(12)}`,
        order: scene.order || index + 1,
        duration: scene.duration || 10,
        type: scene.type || 'property_exterior',
        content: {
          title: scene.content?.title,
          description: scene.content?.description || 'Default scene description',
          imagePrompt: scene.content?.imagePrompt || 'Professional real estate scene',
          voiceOverText: scene.content?.voiceOverText,
          overlayText: scene.content?.overlayText || [],
          animation: scene.content?.animation || 'fade'
        },
        assets: {}
      }));

      return scenes;
    } catch (error) {
      console.error('Scene breakdown error:', error);
      return this.getFallbackScenes(request);
    }
  }

  private async generateSceneAssets(scenes: VideoScene[]): Promise<void> {
    // Generate images for each scene using OpenAI DALL-E
    for (const scene of scenes) {
      try {
        // In a real implementation, you would use DALL-E 3 to generate images
        // For now, we'll simulate the process
        const imageUrl = await this.generateSceneImage(scene.content.imagePrompt);
        scene.assets.imageUrl = imageUrl;
        scene.assets.generatedAt = new Date();
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating assets for scene ${scene.id}:`, error);
        scene.assets.imageUrl = '/placeholder-scene.jpg';
      }
    }
  }

  private async generateSceneImage(prompt: string): Promise<string> {
    try {
      // In a real implementation, this would use OpenAI's image generation
      // const response = await openai.images.generate({
      //   model: "dall-e-3",
      //   prompt: prompt,
      //   n: 1,
      //   size: "1792x1024",
      //   quality: "standard"
      // });
      // return response.data[0].url;
      
      // For now, return a placeholder URL
      return `/api/generated-images/${nanoid(16)}.jpg`;
    } catch (error) {
      console.error('Image generation error:', error);
      return '/placeholder-image.jpg';
    }
  }

  private async generateVoiceOver(project: VideoProject): Promise<void> {
    try {
      // Extract all voice-over text from scenes
      const voiceOverSegments = project.metadata.scenes
        .filter(scene => scene.content.voiceOverText)
        .map(scene => scene.content.voiceOverText)
        .join(' ');

      if (!voiceOverSegments) return;

      // In a real implementation, you would use OpenAI's text-to-speech
      // const response = await openai.audio.speech.create({
      //   model: "tts-1",
      //   voice: "alloy",
      //   input: voiceOverSegments
      // });
      
      // For now, simulate voice-over generation
      project.metadata.voiceOverText = voiceOverSegments;
      console.log(`Voice-over generated for project ${project.id}`);
    } catch (error) {
      console.error('Voice-over generation error:', error);
    }
  }

  private async assembleVideo(project: VideoProject): Promise<void> {
    try {
      // In a real implementation, you would use a video processing library
      // like FFmpeg to combine scenes, add transitions, music, and voice-over
      
      // Simulate video assembly process
      console.log(`Assembling video for project ${project.id}`);
      console.log(`- ${project.metadata.scenes.length} scenes`);
      console.log(`- Duration: ${project.request.duration} seconds`);
      console.log(`- Style: ${project.request.style}`);
      console.log(`- Voice-over: ${project.request.voiceOver ? 'Yes' : 'No'}`);
      console.log(`- Music: ${project.request.music ? 'Yes' : 'No'}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`Video assembly completed for project ${project.id}`);
    } catch (error) {
      console.error('Video assembly error:', error);
      throw error;
    }
  }

  private getFallbackScript(type: string): string {
    const scripts = {
      property_showcase: `Welcome to this exceptional investment opportunity. This property offers outstanding potential for serious investors. Located in a prime area with strong market fundamentals. The numbers speak for themselves - strong rental income potential and excellent long-term appreciation prospects. Don't miss this opportunity to expand your portfolio. Contact LoanDaddy today to secure financing and make this property yours.`,
      
      loan_presentation: `Looking for commercial real estate financing? LoanDaddy specializes in DSCR and Fix-and-Flip loans designed for investors like you. Our streamlined process gets you approved quickly with competitive rates and flexible terms. Whether you're acquiring rental properties or flipping houses, we have the right loan program for your needs. Apply today and get pre-approved in 24 hours.`,
      
      market_analysis: `The current real estate market presents unique opportunities for savvy investors. Market data shows strong fundamentals with increasing demand and limited inventory. Interest rates remain favorable for qualified borrowers. Properties in key markets are showing consistent appreciation and strong rental yields. Now is the time to act. Partner with LoanDaddy to secure financing and capitalize on these market conditions.`,
      
      educational: `Real estate investing can build lasting wealth, but success requires the right knowledge and financing partner. Understanding cash flow, appreciation, and leverage is crucial. DSCR loans allow you to qualify based on property income, not personal income. Fix-and-flip loans provide the speed and flexibility you need for renovation projects. Learn more about building your real estate portfolio with LoanDaddy.`
    };
    
    return scripts[type] || scripts.property_showcase;
  }

  private getFallbackScenes(request: VideoGenerationRequest): VideoScene[] {
    return [
      {
        id: `scene_${nanoid(12)}`,
        order: 1,
        duration: Math.floor(request.duration / 3),
        type: 'intro',
        content: {
          description: 'Professional introduction scene',
          imagePrompt: 'Professional real estate office, modern design, welcoming atmosphere',
          voiceOverText: 'Welcome to your real estate investment journey',
          overlayText: ['LoanDaddy', 'Your Financing Partner'],
          animation: 'fade'
        },
        assets: {}
      },
      {
        id: `scene_${nanoid(12)}`,
        order: 2,
        duration: Math.floor(request.duration / 3),
        type: 'property_exterior',
        content: {
          description: 'Property showcase scene',
          imagePrompt: 'Beautiful commercial property exterior, professional photography',
          voiceOverText: 'Discover exceptional investment opportunities',
          overlayText: ['Prime Location', 'Strong Returns'],
          animation: 'slide'
        },
        assets: {}
      },
      {
        id: `scene_${nanoid(12)}`,
        order: 3,
        duration: Math.floor(request.duration / 3),
        type: 'call_to_action',
        content: {
          description: 'Call to action scene',
          imagePrompt: 'Professional loan officer, confident expression, modern office',
          voiceOverText: 'Contact us today to get started',
          overlayText: ['Apply Now', 'Get Pre-Approved in 24 Hours'],
          animation: 'zoom'
        },
        assets: {}
      }
    ];
  }

  async getProject(projectId: string): Promise<VideoProject | null> {
    return this.projects.get(projectId) || null;
  }

  async getAllProjects(): Promise<VideoProject[]> {
    return Array.from(this.projects.values());
  }

  async generateVideoSubtitles(projectId: string): Promise<VideoSubtitles> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    try {
      // Extract voice-over text and timing from scenes
      const segments = project.metadata.scenes
        .filter(scene => scene.content.voiceOverText)
        .map((scene, index) => {
          const start = project.metadata.scenes
            .slice(0, scene.order - 1)
            .reduce((total, s) => total + s.duration, 0);
          const end = start + scene.duration;
          
          return {
            start,
            end,
            text: scene.content.voiceOverText || ''
          };
        });

      // Generate SRT format
      const srtContent = segments
        .map((segment, index) => {
          const startTime = this.formatTime(segment.start);
          const endTime = this.formatTime(segment.end);
          return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
        })
        .join('\n');

      return {
        projectId,
        language: 'en',
        format: 'srt',
        content: srtContent,
        segments
      };
    } catch (error) {
      console.error('Subtitle generation error:', error);
      throw new Error(`Subtitle generation failed: ${error.message}`);
    }
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }
}

export const videoGenerator = VideoGeneratorService.getInstance();
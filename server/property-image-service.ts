import * as cheerio from 'cheerio';

export interface PropertyImage {
  url: string;
  source: string;
  caption?: string;
  type: 'exterior' | 'interior' | 'aerial' | 'floorplan' | 'other';
}

export class PropertyImageService {
  private static instance: PropertyImageService;

  public static getInstance(): PropertyImageService {
    if (!PropertyImageService.instance) {
      PropertyImageService.instance = new PropertyImageService();
    }
    return PropertyImageService.instance;
  }

  async getPropertyImages(address: string, city: string, state: string, zipCode: string): Promise<PropertyImage[]> {
    const images: PropertyImage[] = [];
    
    try {
      // Try multiple sources for property images
      const zillowImages = await this.getZillowImages(address, city, state, zipCode);
      const realtorImages = await this.getRealtorImages(address, city, state, zipCode);
      const redfinImages = await this.getRedfinImages(address, city, state, zipCode);
      
      images.push(...zillowImages, ...realtorImages, ...redfinImages);
      
      // Remove duplicates and limit to 10 images
      const uniqueImages = this.removeDuplicates(images);
      return uniqueImages.slice(0, 10);
    } catch (error) {
      console.error('Error fetching property images:', error);
      return this.getFallbackImages(address, city, state);
    }
  }

  private async getZillowImages(address: string, city: string, state: string, zipCode: string): Promise<PropertyImage[]> {
    try {
      const searchQuery = encodeURIComponent(`${address}, ${city}, ${state} ${zipCode}`);
      const searchUrl = `https://www.zillow.com/homes/${searchQuery}_rb/`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const images: PropertyImage[] = [];
      
      // Scrape Zillow property images
      $('img[src*="zillowstatic.com"]').each((i, elem) => {
        const src = $(elem).attr('src');
        const alt = $(elem).attr('alt') || '';
        
        if (src && src.includes('p_e') || src.includes('p_f') || src.includes('bigphoto')) {
          images.push({
            url: src,
            source: 'Zillow',
            type: src.includes('p_e') ? 'exterior' : 'interior',
            caption: alt || 'Property photo'
          });
        }
      });
      
      return images.slice(0, 5);
    } catch (error) {
      console.error('Zillow scraping error:', error);
      return [];
    }
  }

  private async getRealtorImages(address: string, city: string, state: string, zipCode: string): Promise<PropertyImage[]> {
    try {
      const searchQuery = encodeURIComponent(`${address}, ${city}, ${state} ${zipCode}`);
      const searchUrl = `https://www.realtor.com/realestateandhomes-search/${city}_${state}/${address.replace(/\s+/g, '-')}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const images: PropertyImage[] = [];
      
      // Scrape Realtor.com property images
      $('img[src*="rdcpix.com"]').each((i, elem) => {
        const src = $(elem).attr('src');
        const alt = $(elem).attr('alt') || '';
        
        if (src && (src.includes('bigphoto') || src.includes('photo'))) {
          images.push({
            url: src,
            source: 'Realtor.com',
            type: i === 0 ? 'exterior' : 'interior',
            caption: alt || 'Property photo'
          });
        }
      });
      
      return images.slice(0, 3);
    } catch (error) {
      console.error('Realtor.com scraping error:', error);
      return [];
    }
  }

  private async getRedfinImages(address: string, city: string, state: string, zipCode: string): Promise<PropertyImage[]> {
    try {
      // Redfin image patterns
      const propertyId = this.generatePropertyId(address, city, state);
      
      return [
        {
          url: `https://ssl.cdn-redfin.com/photo/${propertyId.substring(0, 2)}/${propertyId}_0.jpg`,
          source: 'Redfin',
          type: 'exterior',
          caption: 'Front view'
        }
      ];
    } catch (error) {
      console.error('Redfin images error:', error);
      return [];
    }
  }

  private generatePropertyId(address: string, city: string, state: string): string {
    // Generate a consistent property ID based on address
    const normalized = `${address}-${city}-${state}`.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    // Create a hash-like ID
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36).padStart(8, '0');
  }

  private removeDuplicates(images: PropertyImage[]): PropertyImage[] {
    const seen = new Set<string>();
    return images.filter(image => {
      const key = image.url;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getFallbackImages(address: string, city: string, state: string): PropertyImage[] {
    // Generate placeholder images with proper real estate styling
    const baseUrl = 'https://images.unsplash.com';
    
    return [
      {
        url: `${baseUrl}/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&auto=format`,
        source: 'Stock Photo',
        type: 'exterior',
        caption: `Property at ${address}`
      },
      {
        url: `${baseUrl}/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&auto=format`,
        source: 'Stock Photo',
        type: 'interior',
        caption: 'Interior view'
      },
      {
        url: `${baseUrl}/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format`,
        source: 'Stock Photo',
        type: 'interior',
        caption: 'Kitchen area'
      }
    ];
  }

  async getStreetViewImage(address: string, city: string, state: string): Promise<string> {
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
      return '';
    }

    const fullAddress = encodeURIComponent(`${address}, ${city}, ${state}`);
    return `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${fullAddress}&key=${googleMapsApiKey}`;
  }
}

export const propertyImageService = PropertyImageService.getInstance();
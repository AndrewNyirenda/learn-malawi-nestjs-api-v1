import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryStorageService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'news-images'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          transformation: [
            { width: 1200, height: 630, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else {
            resolve(result.secure_url);
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteFile(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(imageUrl);
      
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
  }

  async getOptimizedUrl(imageUrl: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}): Promise<string> {
    const publicId = this.extractPublicId(imageUrl);
    
    if (!publicId) {
      return imageUrl;
    }

    return cloudinary.url(publicId, {
      ...options,
      secure: true,
    });
  }

  private extractPublicId(imageUrl: string): string | null {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex !== -1) {
        const startIndex = pathParts[uploadIndex + 1].startsWith('v') 
          ? uploadIndex + 2 
          : uploadIndex + 1;
        
        const publicIdParts = pathParts.slice(startIndex);
        
        const lastPart = publicIdParts[publicIdParts.length - 1];
        const lastDotIndex = lastPart.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          publicIdParts[publicIdParts.length - 1] = lastPart.substring(0, lastDotIndex);
        }
        
        return publicIdParts.join('/');
      }
    } catch (error) {
      console.error('Error extracting public_id:', error);
    }
    
    return null;
  }

  async generateThumbnailUrl(imageUrl: string): Promise<string> {
    return this.getOptimizedUrl(imageUrl, {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto:good',
    });
  }

  async generateNewsImageUrl(imageUrl: string): Promise<string> {
    return this.getOptimizedUrl(imageUrl, {
      width: 800,
      height: 450,
      crop: 'limit',
      quality: 'auto:best',
    });
  }
}

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

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Determine resource type based on file mimetype
      const isImage = file.mimetype.startsWith('image/');
      const isPdf = file.mimetype === 'application/pdf';
      const isDocument = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ].includes(file.mimetype);
      
      const resourceType = isImage ? 'image' : (isPdf || isDocument ? 'raw' : 'auto');
      
      // For PDFs and documents, we need to add flags for proper download
      let uploadOptions: any = {
        folder,
        resource_type: resourceType,
      };
      
      if (folder.includes('thumbnail')) {
        // For thumbnails (images only)
        uploadOptions.transformation = [{ width: 300, height: 200, crop: 'fill' }, { quality: 'auto:good' }];
      } else if (isPdf || isDocument) {
        // For PDFs and documents - add format to preserve extension
        uploadOptions.format = file.originalname.split('.').pop();
      }
      
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else {
            // For raw files (PDFs, docs), we need to construct proper URL
            let finalUrl = result.secure_url;
            
            if (isPdf || isDocument) {
              // For raw files, we might need to add flags for download
              // Or return as-is since it already works for curl download
              finalUrl = result.secure_url;
            }
            
            resolve(finalUrl);
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(fileUrl);
      
      if (publicId) {
        // Determine resource type based on file extension
        const isPdf = fileUrl.includes('.pdf');
        const isDocument = fileUrl.match(/\.(doc|docx|ppt|pptx|txt)$/i);
        
        await cloudinary.uploader.destroy(publicId, {
          resource_type: (isPdf || isDocument) ? 'raw' : 'image',
          invalidate: true,
        });
      }
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
    }
  }

  private extractPublicId(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex !== -1) {
        const startIndex = pathParts[uploadIndex + 1].startsWith('v') 
          ? uploadIndex + 2 
          : uploadIndex + 1;
        
        const publicIdParts = pathParts.slice(startIndex);
        
        // Remove file extension
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
    const publicId = this.extractPublicId(imageUrl);
    
    if (!publicId) {
      return imageUrl;
    }

    return cloudinary.url(publicId, {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto:good',
      secure: true,
    });
  }

  // Helper method to generate download URL with proper flags
  generateDownloadUrl(fileUrl: string, fileName: string): string {
    const publicId = this.extractPublicId(fileUrl);
    
    if (!publicId) {
      return fileUrl;
    }

    // Check if it's a PDF/document
    const isPdf = fileName.includes('.pdf');
    const isDocument = fileName.match(/\.(doc|docx|ppt|pptx|txt)$/i);
    
    if (isPdf || isDocument) {
      // For raw files, generate URL with download flag
      return cloudinary.url(publicId, {
        resource_type: 'raw',
        flags: 'attachment',
        filename: fileName,
        secure: true,
      });
    }
    
    // For images, return regular URL
    return fileUrl;
  }
}
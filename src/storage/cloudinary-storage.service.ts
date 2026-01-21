// src/storage/cloudinary-storage.service.ts
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

  /* ===================== UPLOAD ===================== */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{
    url: string;
    publicId: string;
    resourceType: string;
  }> {
    return new Promise((resolve, reject) => {
      // IMPORTANT: PDFs MUST be uploaded as "image"
      const isImage =
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf';

      const resourceType = isImage ? 'image' : 'raw';

      const uploadOptions: any = {
        folder,
        resource_type: resourceType,
      };

      // Thumbnail transformations (images only)
      if (folder.includes('thumbnail')) {
        uploadOptions.transformation = [
          { width: 300, height: 200, crop: 'fill' },
          { quality: 'auto:good' },
        ];
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
            });
          }
        },
      );

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /* ===================== DELETE ===================== */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(fileUrl);
      if (!publicId) return;

      const isPdf = fileUrl.toLowerCase().endsWith('.pdf');

      await cloudinary.uploader.destroy(publicId, {
        resource_type: isPdf ? 'image' : 'raw',
        invalidate: true,
      });
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
    }
  }

  /* ===================== PUBLIC ID ===================== */
  private extractPublicId(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const parts = url.pathname.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;

      // Skip version segment (v123)
      const start =
        parts[uploadIndex + 1]?.startsWith('v')
          ? uploadIndex + 2
          : uploadIndex + 1;

      let publicId = parts.slice(start).join('/');

      // STRIP EXTENSION (jpg, png, pdf, etc.)
      publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|pdf)$/i, '');

      return publicId;
    } catch {
      return null;
    }
  }

  /* ===================== VIEW URL ===================== */
  generateViewUrl(fileUrl: string): string {
    const publicId = this.extractPublicId(fileUrl);
    if (!publicId) return fileUrl;

    // Opens inline in browser / iframe
    return cloudinary.url(publicId, {
      resource_type: 'image',
      format: 'pdf',
      secure: true,
    });
  }

  /* ===================== DOWNLOAD URL ===================== */
  generateDownloadUrl(fileUrl: string, _fileName: string): string {
    const publicId = this.extractPublicId(fileUrl);
    if (!publicId) return fileUrl;

    // Forces download
    return cloudinary.url(publicId, {
      resource_type: 'image',
      format: 'pdf',
      flags: 'attachment',
      secure: true,
    });
  }

  /* ===================== THUMBNAIL ===================== */
  generateThumbnailUrl(imageUrl: string): string {
    const publicId = this.extractPublicId(imageUrl);
    if (!publicId) return imageUrl;

    return cloudinary.url(publicId, {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto:good',
      secure: true,
    });
  }
}

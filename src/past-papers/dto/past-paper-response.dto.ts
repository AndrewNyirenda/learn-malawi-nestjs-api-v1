import { Expose, Transform } from 'class-transformer';
import { EducationLevel } from '../../books/entities/book.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PastPaperResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  thumbnailUrl: string;

  @ApiProperty()
  @Expose()
  fileUrl: string;

  @ApiProperty()
  @Expose()
  fileName: string;

  @ApiProperty()
  @Expose()
  category: string;

  @ApiProperty()
  @Expose()
  class: string;

  @ApiProperty({ enum: EducationLevel })
  @Expose()
  level: EducationLevel;

  @ApiProperty()
  @Expose()
  year: number;

  @ApiProperty()
  @Expose()
  subject: string;

  @ApiProperty()
  @Expose()
  examinationBody: string;

  @ApiProperty()
  @Expose()
  paperNumber: string;

  @ApiProperty()
  @Expose()
  paperType: string;

  @ApiProperty()
  @Expose()
  downloadCount: number;

  @ApiProperty()
  @Expose()
  viewCount: number;

  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => ({
    id: obj.uploadedBy?.id,
    firstName: obj.uploadedBy?.firstName,
    lastName: obj.uploadedBy?.lastName,
    email: obj.uploadedBy?.email,
  }))
  uploadedBy: any;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => obj.downloadName || obj.fileName)
  downloadName: string;
}
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EducationLevel } from '../entities/tutorial.entity';

export class TutorialResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  subject: string;

  @ApiProperty({ enum: EducationLevel })
  @Expose()
  level: EducationLevel;

  @ApiProperty()
  @Expose()
  class: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  videoUrl: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
import { EducationLevel } from '../../books/entities/book.entity';
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max 
} from 'class-validator';

export class CreatePastPaperDto {
  @ApiProperty({ example: 'Mathematics Paper 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Form 4 Mathematics paper from 2023', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Form 4' })
  @IsString()
  @IsNotEmpty()
  class: string;

  @ApiProperty({ 
    enum: EducationLevel,
    enumName: 'EducationLevel',
    example: EducationLevel.SECONDARY
  })
  @IsEnum(EducationLevel)
  level: EducationLevel;

  @ApiProperty({ example: 2023 })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  year: number;

  @ApiProperty({ example: 'Mathematics', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ example: 'Malawi National Examinations Board', required: false })
  @IsString()
  @IsOptional()
  examinationBody?: string;

  @ApiProperty({ example: 'Paper 1', required: false })
  @IsString()
  @IsOptional()
  paperNumber?: string;

  @ApiProperty({ example: 'Multiple Choice', required: false })
  @IsString()
  @IsOptional()
  paperType?: string;
}
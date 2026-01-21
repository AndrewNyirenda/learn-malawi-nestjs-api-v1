import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max, IsUrl } from 'class-validator';
import { EducationLevel } from '../entities/book.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  class: string;

  @ApiProperty({ enum: EducationLevel })
  @IsEnum(EducationLevel)
  level: EducationLevel;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  @IsOptional()
  year?: number;
}
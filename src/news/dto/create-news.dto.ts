import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { NewsCategory } from '../entities/news.entity';
import { Transform } from 'class-transformer';

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NewsCategory)
  category: NewsCategory;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  readTime?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

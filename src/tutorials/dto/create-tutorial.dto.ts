import { IsString, IsEnum, IsNotEmpty, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EducationLevel } from '../entities/tutorial.entity';

export class CreateTutorialDto {
  @ApiProperty({ example: 'Chemical Bonding' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Chemistry' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @ApiProperty({ enum: EducationLevel, example: EducationLevel.SECONDARY })
  @IsEnum(EducationLevel)
  level: EducationLevel;

  @ApiProperty({ example: 'Form 4' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  class: string;

  @ApiProperty({ example: 'Learn about different types of chemical bonds and how atoms combine to form molecules.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://www.youtube.com/embed/5gEWOh630b8' })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  videoUrl: string;
}
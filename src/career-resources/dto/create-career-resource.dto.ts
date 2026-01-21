// src/career-resources/dto/create-career-resource.dto.ts
import { IsString, IsUrl, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCareerResourceDto {
  @ApiProperty({ example: 'Goal Setting Tips' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Learn how to set achievable goals and track your progress effectively.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://www.nsls.org/goal-setting-techniques' })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  link: string;

  @ApiProperty({ example: 'FaBullseye' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  icon: string;
}
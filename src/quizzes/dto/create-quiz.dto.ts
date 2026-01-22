// src/quizzes/dto/create-quiz.dto.ts
import { IsString, IsEnum, IsArray, ValidateNested, IsNumber, Min, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EducationLevel, Difficulty } from '../entities/quiz.entity';
import { CreateQuestionDto } from './create-question.dto';

export class CreateQuizDto {
  @ApiProperty({ example: 'Mathematics Standard 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A quiz about basic mathematics', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: EducationLevel, example: EducationLevel.PRIMARY })
  @IsEnum(EducationLevel)
  level: EducationLevel;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ enum: Difficulty, example: Difficulty.EASY })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ example: 'Standard 1' })
  @IsString()
  @IsNotEmpty()
  class: string;

  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];

  @ApiProperty({ example: 55 })
  @IsNumber()
  @Min(1)
  totalTime: number;
}
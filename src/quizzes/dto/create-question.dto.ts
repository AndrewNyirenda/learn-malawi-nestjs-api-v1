import { IsString, IsArray, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is 1 + 1?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: ['1', '2', '3', '4'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ example: '2' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  @Max(300)
  timeLimit: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @Min(0)
  completionTimePerQuestion: number = 0;
}
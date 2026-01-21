// src/career-resources/dto/career-resource-response.dto.ts
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CareerResourceResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  link: string;

  @ApiProperty()
  @Expose()
  icon: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MessageStatus } from '../entities/message.entity';

export class MessageResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ required: false })
  @Expose()
  phone: string;

  @ApiProperty()
  @Expose()
  subject: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty({ enum: MessageStatus })
  @Expose()
  status: MessageStatus;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageStatus } from '../entities/message.entity';

export class UpdateMessageStatusDto {
  @ApiProperty({ enum: MessageStatus, example: MessageStatus.READ })
  @IsEnum(MessageStatus)
  @IsNotEmpty()
  status: MessageStatus;
}
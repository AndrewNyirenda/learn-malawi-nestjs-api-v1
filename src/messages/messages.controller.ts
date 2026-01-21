import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { MessageStatus } from './entities/message.entity';

@Controller('messages')
@UseInterceptors(ClassSerializerInterceptor)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  private toResponseDto(message: any): MessageResponseDto {
    return plainToInstance(MessageResponseDto, message, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @Public()
  async create(@Body() createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    const message = await this.messagesService.create(createMessageDto);
    return this.toResponseDto(message);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('status') status?: MessageStatus,
    @Query('search') search?: string,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.messagesService.findAll(status, search);
    return messages.map(message => this.toResponseDto(message));
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats() {
    return await this.messagesService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string): Promise<MessageResponseDto> {
    const message = await this.messagesService.findOne(+id);
    return this.toResponseDto(message);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateMessageStatusDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.updateStatus(+id, updateStatusDto);
    return this.toResponseDto(message);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.messagesService.remove(+id);
  }
}
import { PartialType } from '@nestjs/swagger';
import { CreatePastPaperDto } from './create-past-paper.dto';

export class UpdatePastPaperDto extends PartialType(CreatePastPaperDto) {}
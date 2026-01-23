// src/dashboard/dto/dashboard-stats.dto.ts
import { IsNumber, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SummaryStatsDto {
  @IsNumber()
  totalUsers: number;

  @IsNumber()
  totalResources: number;

  @IsNumber()
  totalDownloads: number;

  @IsNumber()
  totalViews: number;

  @IsNumber()
  pendingMessages: number;

  @IsNumber()
  activeSessions: number;
}

class QuickStatDto {
  @IsNumber()
  value: number;

  title: string;

  change: string;

  color: string;
}

class RecentActivityDto {
  id: string;
  user: string;
  action: string;
  resource: string;
  time: string;
  type: string;
}

class SystemStatsDto {
  @IsObject()
  booksByLevel: {
    primary: number;
    secondary: number;
  };

  @IsObject()
  pastPapersByLevel: {
    primary: number;
    secondary: number;
  };

  @IsNumber()
  activeUsersToday: number;

  @IsNumber()
  uploadsToday: number;
}

export class DashboardStatsResponseDto {
  @ValidateNested()
  @Type(() => SummaryStatsDto)
  summary: SummaryStatsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickStatDto)
  quickStats: QuickStatDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecentActivityDto)
  recentActivity: RecentActivityDto[];

  @ValidateNested()
  @Type(() => SystemStatsDto)
  systemStats: SystemStatsDto;
}
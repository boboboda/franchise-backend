// src/modules/crawler-scheduler/dto/webhook-complete.dto.ts

import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';

export class WorkflowCompleteDto {
  @IsString()
  task_id: string;

  @IsString()
  workflow_status: 'completed' | 'failed';

  @IsOptional()
  @IsObject()
  analysis?: {
    total_site_items: number;
    total_db_items: number;
    missing_count: number;
    coverage_percentage: number;
  };

  @IsOptional()
  @IsObject()
  crawling?: {
    skipped?: boolean;
    reason?: string;
    success_count?: number;
    total_attempted?: number;
    success_rate?: number;
  };

  @IsString()
  completed_at: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  failed_step?: string;
}
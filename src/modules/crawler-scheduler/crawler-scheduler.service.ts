// src/modules/crawler-scheduler/crawler-scheduler.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlerApiService } from './services/crawler-api/crawler-api.service';

@Injectable()
export class CrawlerSchedulerService {
  private readonly logger = new Logger(CrawlerSchedulerService.name);

  constructor(
    private readonly crawlerApiService: CrawlerApiService,  // ✅ 주입
  ) {}


  @Cron('0 2 * * *')
  async dailyMissingCheck(): Promise<void> {
    this.logger.log('🕐 매일 새벽 2시 - 누락 복구 워크플로우 시작');
    
    try {
      // ✅ 한 번만 호출하면 끝!
      const result = await this.crawlerApiService.startFullWorkflow();
      
      this.logger.log('✅ 워크플로우 시작됨', {
        taskId: result.task_id,
        estimatedTime: result.estimated_time
      });

    } catch (error) {
      this.logger.error('❌ 워크플로우 시작 실패', error.message);
    }
  }



}
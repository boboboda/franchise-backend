// src/modules/crawler-scheduler/crawler-scheduler.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlerApiService } from './services/crawler-api/crawler-api.service';

@Injectable()
export class CrawlerSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerSchedulerService.name);

  constructor(
    private readonly crawlerApiService: CrawlerApiService,
  ) {}

  // ⭐ 서비스 초기화 시 현재 시간 및 타임존 확인
  onModuleInit() {
    this.logger.log('✅ CrawlerSchedulerService 초기화됨');
    
    const now = new Date();
    this.logger.log(`⏰ 서버 현재 시간: ${now.toLocaleString('ko-KR')}`);
    this.logger.log(`🌏 서버 타임존: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    this.logger.log(`📅 ISO 시간: ${now.toISOString()}`);
    
    // 다음 실행 예정 시간 계산
    const nextRun = new Date(now);
    nextRun.setHours(2, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    this.logger.log(`🔔 다음 새벽 2시 크론 실행 예정: ${nextRun.toLocaleString('ko-KR')}`);
  }

  // ⭐ 테스트용: 매 분마다 실행 (테스트 후 삭제 가능)
  @Cron('* * * * *', { name: 'test-every-minute' })
  testEveryMinute() {
    const now = new Date();
    this.logger.log(`🧪 [테스트 크론] 실행됨: ${now.toLocaleString('ko-KR')}`);
  }

  // ⭐ 실제 크론: 매일 새벽 2시 (한국 시간 기준)
  @Cron('0 2 * * *', { 
    name: 'daily-missing-check',
    timeZone: 'Asia/Seoul' // 한국 시간 기준으로 명시
  })
  async dailyMissingCheck(): Promise<void> {
    const now = new Date();
    this.logger.log(`🕐 [실제 크론] 매일 새벽 2시 - 누락 복구 워크플로우 시작 (${now.toLocaleString('ko-KR')})`);
    
    try {
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
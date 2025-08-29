// src/modules/crawler-scheduler/test.controller.ts

import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { CrawlerApiService } from './services/crawler-api/crawler-api.service';
import { CrawlerSchedulerService } from './crawler-scheduler.service';

@Controller('test/crawler')
export class TestController {
  constructor(
    private readonly crawlerApiService: CrawlerApiService,
    private readonly crawlerScheduler: CrawlerSchedulerService,
  ) {}

  @Get('health')
  async testHealth() {
    const isHealthy = await this.crawlerApiService.healthCheck();
    return { 
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    };
  }

  @Post('start-full-workflow')
  async testStartFullWorkflow() {
    return this.crawlerApiService.startFullWorkflow();
  }
}
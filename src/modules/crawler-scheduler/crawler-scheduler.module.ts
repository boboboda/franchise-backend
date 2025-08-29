import { Module } from '@nestjs/common';
import { CrawlerSchedulerService } from './crawler-scheduler.service';
import { CrawlerWebhookController } from './controllers/crawler-webhook/crawler-webhook.controller';
import { CrawlerApiService } from './services/crawler-api/crawler-api.service';
import { CrawlLogService } from './services/crawl-log/crawl-log.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TestController } from './test.controller';

@Module({
  imports: [ConfigModule,HttpModule.register({
    timeout: 10000,
    maxRedirects: 5,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'NestJS-Crawler-Client/1.0.0',
    },
  })],
  providers: [CrawlerSchedulerService, CrawlerApiService, CrawlLogService],
   exports: [CrawlerApiService, CrawlerSchedulerService],
  controllers: [CrawlerWebhookController, TestController]
})
export class CrawlerSchedulerModule {}

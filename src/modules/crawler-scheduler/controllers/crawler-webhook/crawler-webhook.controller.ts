// src/modules/crawler-scheduler/controllers/crawler-webhook.controller.ts

import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { CrawlerSchedulerService } from '../../crawler-scheduler.service';
import { CrawlerApiService } from '../../services/crawler-api/crawler-api.service';
import { WorkflowCompleteDto } from '../../dto/webhook-complete.dto/webhook-complete.dto';

@Controller('webhook/crawler')
export class CrawlerWebhookController {
  private readonly logger = new Logger(CrawlerWebhookController.name);

  constructor(
    private readonly crawlerScheduler: CrawlerSchedulerService,
    private readonly crawlerApiService: CrawlerApiService,  // ✅ 직접 사용도 가능
  ) {}

  @Post('workflow-complete')
async onWorkflowComplete(@Body() data: WorkflowCompleteDto) {
  this.logger.log('전체 워크플로우 완료 수신', data);

  try {
    if (data.workflow_status === 'completed') {
      const analysis = data.analysis;
      const crawling = data.crawling;

      this.logger.log('일일 누락 보완 작업 완료', {
        분석결과: `전체 ${analysis?.total_site_items}개 중 ${analysis?.missing_count}개 누락`,
        커버리지: `${analysis?.coverage_percentage}%`,
        크롤링: crawling?.skipped 
          ? `스킵됨 (${crawling.reason})` 
          : `${crawling?.success_count}/${crawling?.total_attempted} 성공`
      });

      return {
        success: true,
        message: '워크플로우 완료 처리됨'
      };

    } else if (data.workflow_status === 'failed') {
      this.logger.error('워크플로우 실패', {
        error: data.error,
        failedStep: data.failed_step
      });

      return {
        success: true,
        message: '워크플로우 실패 처리됨'
      };
    }

  } catch (error) {
    this.logger.error('웹훅 처리 중 오류', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

  /**
   * 워크플로우 실패 전용 엔드포인트 (선택사항)
   * POST /webhook/crawler/workflow-failed
   */
  @Post('workflow-failed')
  async onWorkflowFailed(@Body() data: any) {
    this.logger.error('💥 [WEBHOOK] 워크플로우 실패 알림', {
      taskId: data.task_id,
      error: data.error,
      failedAt: data.failed_at
    });

    // 에러 알림 처리
    // await this.sendErrorNotification(data);

    return {
      success: true,
      message: '실패 알림 처리됨'
    };
  }

  /**
   * 헬스체크용 (Python에서 웹훅 URL 테스트)
   * GET /webhook/crawler/health
   */
  @Post('health')
  async webhookHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'NestJS 웹훅 서버 정상 동작'
    };
  }
}
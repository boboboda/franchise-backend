export interface CrawlerApiResponseInterface {}
/**
 * 누락 분석 시작 응답
 * POST /missing/analysis
 */
export interface AnalyzeMissingResponse {
  message: string;
  task_id: string;
  webhook_url: string;
  estimated_time: string;
}

/**
 * 누락 요약 조회 시작 응답  
 * POST /missing/summary
 */
export interface MissingSummaryTaskResponse {
  message: string;
  task_id: string;
  webhook_url: string;
  estimated_time: string;
}

/**
 * 누락 크롤링 시작 응답
 * POST /missing/crawl
 */
export interface MissingCrawlTaskResponse {
  message: string;
  task_id: string;
  webhook_url: string;
  estimated_time: string;
}

/**
 * 공통 작업 응답 (위 3개의 공통 구조)
 */
export interface CrawlerTaskResponse {
  message: string;
  task_id: string;
  webhook_url: string;
  estimated_time: string;
}

/**
 * 작업 상태 조회 응답
 * GET /crawl/status/{task_id}
 */
export interface TaskStatusResponse {
  task_id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'RETRY' | 'STARTED';
  status_message: string;
  result: any;
  ready: boolean;
  successful?: boolean;
  error?: string;
}

/**
 * 웹훅으로 받을 누락 분석 완료 데이터
 * Webhook: POST /webhook/analysis-complete
 */
export interface AnalysisCompleteWebhook {
  task_id: string;
  status: 'success' | 'failure';
  message: string;
  analysis_result?: {
    total_site_items: number;
    total_db_items: number;
    missing_count: number;
    coverage_percentage: number;
    missing_ranges: Array<{
      start: number;
      end: number;
      count: number;
    }>;
    extra_numbers: number[];
    site_number_range: {
      min: number;
      max: number;
    };
    db_number_range: {
      min: number;
      max: number;
    };
  };
}

/**
 * 웹훅으로 받을 누락 요약 완료 데이터
 * Webhook: POST /webhook/summary-complete  
 */
export interface SummaryCompleteWebhook {
  task_id: string;
  status: 'success' | 'failure';
  message: string;
  summary?: {
    total_site_items: number;
    total_db_items: number;
    missing_count: number;
    coverage_percentage: number;
    largest_missing_ranges: Array<{
      start: number;
      end: number;
      count: number;
    }>;
    recommendation: string;
  };
}

/**
 * 웹훅으로 받을 크롤링 완료 데이터
 * Webhook: POST /webhook/crawl-complete
 */
export interface CrawlCompleteWebhook {
  task_id: string;
  status: 'success' | 'failure';
  message: string;
  crawl_result?: {
    total_attempted: number;
    success_count: number;
    fail_count: number;
    success_rate: number;
    completed_at: string;
    crawled_data: any[];
  };
}

/**
 * 공통 웹훅 베이스 인터페이스
 */
export interface BaseWebhookPayload {
  task_id: string;
  status: 'success' | 'failure';
  message: string;
}

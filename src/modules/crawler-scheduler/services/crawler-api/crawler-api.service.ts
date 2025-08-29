import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosRequestConfig } from 'axios'; 

@Injectable()
export class CrawlerApiService {
  private readonly logger = new Logger(CrawlerApiService.name);
  private readonly baseUrl: string;
  private readonly defaultConfig: AxiosRequestConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'CRAWLER_API_URL', 
      `${process.env.CRAWLER_URL}/api/crawler`
    );
    
    // 🎯 공통 설정 정의
    this.defaultConfig = {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NestJS-Crawler-Client/1.0.0',
      },
    };
    
    this.logger.log(`🔗 Crawler API URL: ${this.baseUrl}`);
  }




  // 🔧 통합 요청 메서드
  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    customConfig?: AxiosRequestConfig
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config = { ...this.defaultConfig, ...customConfig };
    
    try {
      this.logger.debug(`📡 ${method} 요청: ${url}`);
      
      let response: AxiosResponse;
      
      switch (method) {
        case 'GET':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'POST':
          response = await firstValueFrom(this.httpService.post(url, data || {}, config));
          break;
        case 'PUT':
          response = await firstValueFrom(this.httpService.put(url, data || {}, config));
          break;
        case 'DELETE':
          response = await firstValueFrom(this.httpService.delete(url, config));
          break;
        default:
          throw new Error(`지원하지 않는 HTTP 메서드: ${method}`);
      }

      this.logger.debug(`📡 ${method} 응답: ${response.status}`);
      return response.data;
      
    } catch (error) {
      this.handleApiError(method, url, error);
      throw error;
    }
  }

  // 🚨 향상된 에러 처리
  private handleApiError(method: string, url: string, error: any): void {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const message = error.response?.data?.detail || error.message;
    
    // 상태 코드별 다른 로그 레벨
    if (status >= 500) {
      this.logger.error(`📡 서버 오류 ${method} ${url}`, {
        status, statusText, message,
        data: error.response?.data
      });
    } else if (status >= 400) {
      this.logger.warn(`📡 클라이언트 오류 ${method} ${url}`, {
        status, statusText, message
      });
    } else {
      this.logger.error(`📡 네트워크 오류 ${method} ${url}`, {
        message: error.message,
        code: error.code
      });
    }
  }

  // 🔧 헬스체크 메서드 (선택사항)
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('GET', '/health', undefined, { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn('Python API 헬스체크 실패');
      return false;
    }
  }


  // CrawlerApiService에 추가
async startFullWorkflow(): Promise<any> {
  this.logger.log('🚀 전체 워크플로우 시작 요청');
  
  try {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/workflow/start-auto`, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000, // 워크플로우는 조금 더 긴 타임아웃
      })
    );
    
    this.logger.log('✅ 전체 워크플로우 시작 성공', response.data);
    return response.data;
    
  } catch (error) {
    this.logger.error('❌ 전체 워크플로우 시작 실패', error.response?.data || error.message);
    throw error;
  }
}
}
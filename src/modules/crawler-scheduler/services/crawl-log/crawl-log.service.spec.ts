import { Test, TestingModule } from '@nestjs/testing';
import { CrawlLogService } from './crawl-log.service';

describe('CrawlLogService', () => {
  let service: CrawlLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlLogService],
    }).compile();

    service = module.get<CrawlLogService>(CrawlLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

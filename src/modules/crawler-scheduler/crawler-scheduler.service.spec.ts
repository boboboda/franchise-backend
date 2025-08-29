import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerSchedulerService } from './crawler-scheduler.service';

describe('CrawlerSchedulerService', () => {
  let service: CrawlerSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlerSchedulerService],
    }).compile();

    service = module.get<CrawlerSchedulerService>(CrawlerSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

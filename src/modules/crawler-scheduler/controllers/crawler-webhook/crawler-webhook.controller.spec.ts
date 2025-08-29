import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerWebhookController } from './crawler-webhook.controller';

describe('CrawlerWebhookController', () => {
  let controller: CrawlerWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlerWebhookController],
    }).compile();

    controller = module.get<CrawlerWebhookController>(CrawlerWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

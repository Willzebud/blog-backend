import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service.js';
import { ArticlesMapper } from './_utils/mappers/articles.mapper.js';
import { ArticlesRepository } from './articles.repository.js';

describe('ArticlesService', () => {
  let service: ArticlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: ArticlesRepository,
          useValue: {},
        },
        {
          provide: ArticlesMapper,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { FooterService } from './footer.service';
import { FooterConfig } from './schemas/footer-config.schema';

describe('FooterService', () => {
  const lean = jest.fn();
  const findOne = jest.fn(() => ({ lean }));
  const findOneAndUpdate = jest.fn();

  let service: FooterService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FooterService,
        {
          provide: getModelToken(FooterConfig.name),
          useValue: { findOne, findOneAndUpdate },
        },
      ],
    }).compile();

    service = module.get(FooterService);
  });

  it('returns localized defaults when no config is stored', async () => {
    lean.mockResolvedValue(null);

    const footer = await service.getPublicFooter('en');

    expect(footer.brand.name).toBe('CodeForGlory');
    expect(footer.sections[0].title).toBe('Platform');
    expect(footer.legalLinks[0].label).toBe('Terms');
  });

  it('sorts links and removes disabled links', async () => {
    lean.mockResolvedValue({
      brand: {
        name: 'CodeForGlory',
        tagline: { en: 'English', vi: 'Vietnamese' },
        logoUrl: '/logo.png',
      },
      sections: [],
      socialLinks: [
        {
          label: { en: 'Second', vi: 'Hai' },
          url: '/second',
          external: false,
          enabled: true,
          order: 2,
        },
        {
          label: { en: 'Hidden', vi: 'An' },
          url: '/hidden',
          external: false,
          enabled: false,
          order: 0,
        },
        {
          label: { en: 'First', vi: 'Mot' },
          url: '/first',
          external: false,
          enabled: true,
          order: 1,
        },
      ],
      legalLinks: [],
      copyright: { en: 'Copyright', vi: 'Ban quyen' },
    });

    const footer = await service.getPublicFooter('vi');

    expect(footer.socialLinks.map((link) => link.label)).toEqual([
      'Mot',
      'Hai',
    ]);
  });
});

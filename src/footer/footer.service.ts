import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdateFooterDto } from './dto/footer.dto';
import {
  FooterConfig,
  FooterConfigDocument,
  FooterLink,
  LocalizedText,
} from './schemas/footer-config.schema';

const DEFAULT_FOOTER: Omit<FooterConfig, 'updatedBy'> = {
  key: 'main',
  brand: {
    name: 'CodeForGlory',
    tagline: {
      en: 'Gamifying the future of software engineering.',
      vi: 'Game hoa hanh trinh tro thanh ky su phan mem.',
    },
    logoUrl: '/component_2_2x.png',
  },
  sections: [
    {
      title: { en: 'Platform', vi: 'Nen tang' },
      order: 0,
      links: [
        {
          label: { en: 'Courses', vi: 'Khoa hoc' },
          url: '/courses',
          external: false,
          enabled: true,
          order: 0,
        },
        {
          label: { en: 'Arena', vi: 'Dau truong' },
          url: '/arena',
          external: false,
          enabled: true,
          order: 1,
        },
        {
          label: { en: 'Pricing', vi: 'Bang gia' },
          url: '/pricing',
          external: false,
          enabled: true,
          order: 2,
        },
      ],
    },
    {
      title: { en: 'Community', vi: 'Cong dong' },
      order: 1,
      links: [
        {
          label: { en: 'Discord', vi: 'Discord' },
          url: 'https://discord.com',
          external: true,
          enabled: true,
          order: 0,
        },
        {
          label: { en: 'Events', vi: 'Su kien' },
          url: '/events',
          external: false,
          enabled: true,
          order: 1,
        },
        {
          label: { en: 'Guilds', vi: 'Bang hoi' },
          url: '/guilds',
          external: false,
          enabled: true,
          order: 2,
        },
      ],
    },
  ],
  socialLinks: [
    {
      label: { en: 'Network', vi: 'Mang luoi' },
      url: '/network',
      icon: 'language',
      external: false,
      enabled: true,
      order: 0,
    },
    {
      label: { en: 'Forum', vi: 'Dien dan' },
      url: '/forum',
      icon: 'chat',
      external: false,
      enabled: true,
      order: 1,
    },
    {
      label: { en: 'Mobile', vi: 'Di dong' },
      url: '/mobile',
      icon: 'flutter',
      external: false,
      enabled: true,
      order: 2,
    },
  ],
  legalLinks: [
    {
      label: { en: 'Terms', vi: 'Dieu khoan' },
      url: '/terms',
      external: false,
      enabled: true,
      order: 0,
    },
    {
      label: { en: 'Privacy', vi: 'Bao mat' },
      url: '/privacy',
      external: false,
      enabled: true,
      order: 1,
    },
    {
      label: { en: 'Support', vi: 'Ho tro' },
      url: '/support',
      external: false,
      enabled: true,
      order: 2,
    },
  ],
  copyright: {
    en: 'CodeForGlory. All rights reserved.',
    vi: 'CodeForGlory. Bao luu moi quyen.',
  },
};

@Injectable()
export class FooterService {
  constructor(
    @InjectModel(FooterConfig.name)
    private readonly footerModel: Model<FooterConfigDocument>,
  ) {}

  async getPublicFooter(locale: 'en' | 'vi') {
    const stored = await this.footerModel.findOne({ key: 'main' }).lean();
    const config = stored ?? DEFAULT_FOOTER;

    return {
      brand: {
        name: config.brand.name,
        tagline: this.localize(config.brand.tagline, locale),
        logoUrl: config.brand.logoUrl,
      },
      sections: [...config.sections]
        .sort((a, b) => a.order - b.order)
        .map((section) => ({
          title: this.localize(section.title, locale),
          links: this.publicLinks(section.links, locale),
        })),
      socialLinks: this.publicLinks(config.socialLinks, locale),
      legalLinks: this.publicLinks(config.legalLinks, locale),
      copyright: this.localize(config.copyright, locale),
    };
  }

  async getAdminConfig() {
    return (
      (await this.footerModel.findOne({ key: 'main' }).lean()) ?? DEFAULT_FOOTER
    );
  }

  update(dto: UpdateFooterDto, updatedBy: Types.ObjectId) {
    return this.footerModel.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          brand: dto.brand,
          sections: dto.sections,
          socialLinks: dto.socialLinks,
          legalLinks: dto.legalLinks,
          copyright: dto.copyright,
          updatedBy,
        },
        $setOnInsert: { key: 'main' },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );
  }

  private publicLinks(links: FooterLink[], locale: 'en' | 'vi') {
    return [...links]
      .filter((link) => link.enabled)
      .sort((a, b) => a.order - b.order)
      .map((link) => ({
        label: this.localize(link.label, locale),
        url: link.url,
        external: link.external,
        ...(link.icon ? { icon: link.icon } : {}),
      }));
  }

  private localize(text: LocalizedText, locale: 'en' | 'vi') {
    return text[locale] || text.en;
  }
}

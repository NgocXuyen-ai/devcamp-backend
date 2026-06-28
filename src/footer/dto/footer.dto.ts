import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class FooterLocaleQueryDto {
  @ApiPropertyOptional({ enum: ['en', 'vi'], default: 'en' })
  @IsOptional()
  @IsIn(['en', 'vi'])
  locale: 'en' | 'vi' = 'en';
}

export class LocalizedTextDto {
  @ApiProperty({ example: 'Platform' })
  @IsDefined()
  @IsString()
  @MaxLength(200)
  en!: string;

  @ApiProperty({ example: 'Nen tang' })
  @IsDefined()
  @IsString()
  @MaxLength(200)
  vi!: string;
}

export class FooterLinkDto {
  @ApiProperty({ type: LocalizedTextDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  label!: LocalizedTextDto;

  @ApiProperty({ example: '/courses' })
  @IsDefined()
  @IsString()
  @MaxLength(500)
  @Matches(/^(\/|https?:\/\/)/, {
    message: 'url must be an internal path or an HTTP(S) URL',
  })
  url!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  external?: boolean;

  @ApiPropertyOptional({ example: 'language' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class FooterSectionDto {
  @ApiProperty({ type: LocalizedTextDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ApiProperty({ type: [FooterLinkDto] })
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  links!: FooterLinkDto[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class FooterBrandDto {
  @ApiProperty({ example: 'CodeForGlory' })
  @IsDefined()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  tagline!: LocalizedTextDto;

  @ApiProperty({ example: '/component_2_2x.png' })
  @IsDefined()
  @IsString()
  @MaxLength(500)
  @Matches(/^(\/|https?:\/\/)/, {
    message: 'logoUrl must be an internal path or an HTTP(S) URL',
  })
  logoUrl!: string;
}

export class UpdateFooterDto {
  @ApiProperty({ type: FooterBrandDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => FooterBrandDto)
  brand!: FooterBrandDto;

  @ApiProperty({ type: [FooterSectionDto] })
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => FooterSectionDto)
  sections!: FooterSectionDto[];

  @ApiProperty({ type: [FooterLinkDto] })
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  socialLinks!: FooterLinkDto[];

  @ApiProperty({ type: [FooterLinkDto] })
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  legalLinks!: FooterLinkDto[];

  @ApiProperty({ type: LocalizedTextDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  copyright!: LocalizedTextDto;
}

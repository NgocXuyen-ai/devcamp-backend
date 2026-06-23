import { IsIn, IsOptional, IsString } from 'class-validator';

export class PracticeEvaluationDto {
  @IsString()
  practiceId!: string;

  @IsString()
  title!: string;

  @IsString()
  topic!: string;

  @IsString()
  track!: string;

  @IsString()
  @IsIn([
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'c',
    'csharp',
    'ruby',
    'go',
    'rust',
    'php',
    'swift',
    'kotlin',
    'dart',
    'scala',
    'r',
    'sql',
    'html',
    'css',
  ])
  language!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en'])
  locale?: 'vi' | 'en';

  @IsOptional()
  @IsString()
  nodeId?: string;
}

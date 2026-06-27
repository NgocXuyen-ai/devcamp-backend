import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'general' })
  @IsString()
  channelId!: string;

  @ApiProperty({ example: 'Hello world' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Nice post!' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}

export class ReactDto {
  @ApiProperty({ example: '👍' })
  @IsString()
  @MaxLength(16)
  emoji!: string;
}

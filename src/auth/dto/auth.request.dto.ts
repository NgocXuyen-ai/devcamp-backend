import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'codeforglory@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  password!: string;

  /** Token from frontend CAPTCHA widget (required after 3 failures). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'codeforglory@gmail.com' })
  @IsEmail()
  email!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'codeforglory@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'codeforglory@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Token returned by /auth/verify-otp' })
  @IsString()
  resetToken!: string;

  @ApiProperty({ example: 'codeforglory1234' })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/)
  @Matches(/\d/)
  newPassword!: string;

  @ApiProperty({ example: 'codeforglory1234' })
  @IsString()
  confirmPassword!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

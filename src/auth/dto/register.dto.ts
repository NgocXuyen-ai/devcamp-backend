import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'vinhhoang' })
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscore',
  })
  username!: string;

  @ApiProperty({ example: 'vinh@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'vinh1234' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/[A-Za-z]/, { message: 'Password must contain at least 1 letter' })
  @Matches(/\d/, { message: 'Password must contain at least 1 number' })
  password!: string;

  @ApiProperty({ example: 'vinh1234' })
  @IsString()
  confirmPassword!: string;
}

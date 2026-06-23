import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return await this.usersService.create({
      username: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
    });
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác!',
      );
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác!',
      );
    }

    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role ?? 'USER',
    };

    return {
      success: true,
      message: 'Login successfully',
      access_token: this.jwtService.sign(payload),
      user: {
        _id: String(user._id),
        name: user.username ?? '',
        role: user.role ?? '',
        is_first_login: user.isFirstLogin ?? false,
        level: user.gamification?.level ?? 1,
      },
    };
  }
}

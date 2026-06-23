import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './service/auth-core.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.jwt.accessSecret') ??
        'change-me-access',
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: new Types.ObjectId(payload.sub),
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  }
}

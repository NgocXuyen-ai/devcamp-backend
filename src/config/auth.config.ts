import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ??
      process.env.JWT_SECRET ??
      'change-me-access',
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  },
  login: {
    maxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS ?? '5', 10),
    captchaThreshold: parseInt(process.env.LOGIN_CAPTCHA_THRESHOLD ?? '3', 10),
    lockMinutes: parseInt(process.env.LOGIN_LOCK_MINUTES ?? '15', 10),
    countWindowMinutes: parseInt(
      process.env.LOGIN_COUNT_WINDOW_MINUTES ?? '15',
      10,
    ),
  },
  otp: {
    expiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES ?? '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '3', 10),
  },
}));

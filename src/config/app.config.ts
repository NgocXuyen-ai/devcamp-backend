import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  /** Optional — only used to redirect OAuth callbacks. When unset, the
   *  backend returns OAuth tokens as JSON instead of redirecting. */
  frontendUrl: process.env.FRONTEND_URL,
}));

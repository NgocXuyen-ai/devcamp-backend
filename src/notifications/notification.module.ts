import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
        ]),
        // JwtModule riêng cho gateway — không import AuthModule để tránh phụ
        // thuộc vòng (AuthModule sẽ import NotificationsModule để bắn
        // SUSPICIOUS_LOGIN). Secret lấy cùng key 'auth.jwt.accessSecret' như
        // JwtStrategy để verify được access token do AuthService cấp.
        JwtModule.register({}),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway],
    exports: [NotificationsService],
})
export class NotificationsModule { }
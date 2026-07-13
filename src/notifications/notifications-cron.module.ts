import { Module } from '@nestjs/common';
import { NotificationsModule } from './notification.module';
import { UsersModule } from '../users/users.module';
import { RecallModule } from '../recall/recall.module';
import { NotificationsCronService } from './notifications-cron.service';

/**
 * Module riêng cho cron notification (streak reminder/broken, recall due).
 *
 * TÁCH RIÊNG khỏi NotificationsModule một cách có chủ đích: NotificationsModule
 * được auth/battles/penalties/exercises/learning-path import để bắn notification
 * theo sự kiện, nên bản thân nó không được phụ thuộc ngược lại UsersModule
 * (UsersModule → ExercisesModule → NotificationsModule đã là 1 chiều có sẵn).
 * Module cron này đứng ở tầng trên cùng, chỉ import chứ không bị ai import lại.
 */
@Module({
    imports: [NotificationsModule, UsersModule, RecallModule],
    providers: [NotificationsCronService],
})
export class NotificationsCronModule { }
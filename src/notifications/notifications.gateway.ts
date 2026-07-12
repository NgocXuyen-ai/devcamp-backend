import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/service/auth-core.service';
import { NotificationDocument } from './schemas/notification.schema';

interface SocketData {
    userId: string;
}

/**
 * Gateway realtime cho notification.
 *
 * Khác với BattlesGateway (room theo battleId, public trong trận),
 * ở đây mỗi user PHẢI được xác thực trước khi join room riêng của họ —
 * nếu không, bất kỳ client nào cũng có thể tự khai userId để nghe lén
 * thông báo (streak, penalty, suspicious login...) của người khác.
 *
 * Client kết nối kèm access token qua `auth.token` hoặc query `?token=`:
 *   io('/notifications', { auth: { token: accessToken } })
 */
@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications',
})
export class NotificationsGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(NotificationsGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    private roomFor(userId: string): string {
        return `user:${userId}`;
    }

    handleConnection(client: Socket<object, object, object, SocketData>) {
        const token = this.extractToken(client);
        if (!token) {
            client.disconnect(true);
            return;
        }

        try {
            const payload = this.jwtService.verify<JwtPayload>(token, {
                secret: this.configService.get<string>('auth.jwt.accessSecret'),
            });
            void client.join(this.roomFor(payload.sub));
            client.data.userId = payload.sub;
        } catch {
            this.logger.warn(`Socket ${client.id} bị từ chối: token không hợp lệ`);
            client.disconnect(true);
        }
    }

    handleDisconnect() {
        // Không cần dọn state thủ công — socket.io tự rời tất cả room khi disconnect.
    }

    private extractToken(client: Socket): string | null {
        const fromAuth = client.handshake.auth?.token as string | undefined;
        if (fromAuth) return fromAuth;

        const fromQuery = client.handshake.query?.token;
        if (typeof fromQuery === 'string') return fromQuery;

        const header = client.handshake.headers.authorization;
        if (header?.startsWith('Bearer ')) return header.slice(7);

        return null;
    }

    /** Bắn 1 notification mới tới đúng user (dùng khi vừa tạo xong). */
    emitNew(userId: string, notification: NotificationDocument) {
        this.server.to(this.roomFor(userId)).emit('notification:new', notification);
    }

    /** Cập nhật badge count sau khi đọc/tạo mới, để FE không phải tự cộng trừ. */
    emitUnreadCount(userId: string, unreadCount: number) {
        this.server
            .to(this.roomFor(userId))
            .emit('notification:unread-count', { unreadCount });
    }
}
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/battles',
})
export class BattlesGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private socketToBattle = new Map<string, string>();

  @SubscribeMessage('join-battle')
  handleJoinBattle(
    @MessageBody() data: { battleId: string },
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(data.battleId);

    this.socketToBattle.set(client.id, data.battleId);

    client.emit('joined-battle', { battleId: data.battleId });
  }
  handleDisconnect(client: Socket) {
    this.socketToBattle.delete(client.id);
  }

  notifyCorrectSubmit(
    battleId: string,
    payload: {
      userId: string;
      questionId: string;
      questionOrder: number;
    },
  ) {
    this.server.to(battleId).emit('opponent-correct', payload);
  }

  notifyBattleEnded(
    battleId: string,
    result: {
      winnerId?: string;
      isDraw?: boolean;
      finalScores: { userId: string; score: number }[];
    },
  ) {
    this.server.to(battleId).emit('battle-ended', result);
  }

  pushTimerTick(battleId: string, timeRemaining: number) {
    this.server.to(battleId).emit('timer-tick', { timeRemaining });
  }
}

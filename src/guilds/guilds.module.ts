import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';
import { Guild, GuildSchema } from './schemas/guild.schema';
import { User, UserSchema } from '../users/schemas/users.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Guild.name, schema: GuildSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GuildsController],
  providers: [GuildsService],
  exports: [GuildsService],
})
export class GuildsModule {}

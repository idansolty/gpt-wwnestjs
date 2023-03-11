import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { WhatsappBot } from './WwjsClient/proxy/server';

@Module({
  imports: [BotModule],
  controllers: [],
  providers: [WhatsappBot],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { WhatsappBot } from './WwjsClient/proxy/whatsappBot';
import { appController } from './app.controller';
import { DefaultModule } from './WwjsClient/common/defaults/default.module';
import { DefaultController } from './WwjsClient/common/defaults/default.controller';
import { WhatsappModule } from './WwjsClient/proxy/whatsapp.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [WhatsappModule, BotModule, DefaultModule],
  controllers: [],
  providers: [],
})
export class AppModule { }

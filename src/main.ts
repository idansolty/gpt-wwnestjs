import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotController } from './WwjsClient/common/interfaces/BotController';
import { WhatsappBot } from './WwjsClient/proxy/whatsappBot';
import * as dotenv from 'dotenv'

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  const bot = app.get(WhatsappBot);

  bot.start(app)

  await app.listen(3000);
}

bootstrap();

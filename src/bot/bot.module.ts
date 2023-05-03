import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/Logger/logger.module';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { WhatsappModule } from 'src/WwjsClient/proxy/whatsapp.module';
import { GPTService } from './services/gpt.service';
import { KorroController } from './general.controller';

@Module({
    imports: [WhatsappModule, LoggerModule.register({ name: "Bot Module" })],
    controllers: [KorroController],
    providers: [
        GPTService
    ],
})
export class BotModule { }

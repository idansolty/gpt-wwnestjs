import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/Logger/logger.module';
import { WhatsappBot } from 'src/WwjsClient/proxy/whatsappBot';
import { AIService } from './services/ai.service';
import { ChatsController } from './chat.controller';
import { DiscussionService } from './services/discussion.service';
import { GeneralController } from './general.controller';
import { GPTService } from './services/gpt.service';
import { ImagesController } from './images.controller';
import { WhatsappModule } from 'src/WwjsClient/proxy/whatsapp.module';

@Module({
    imports: [WhatsappModule, LoggerModule.register({ name: "Bot Module" })],
    controllers: [GeneralController, ImagesController, ChatsController],
    providers: [
        GPTService,
        DiscussionService,
        AIService
    ],
})
export class BotModule { }

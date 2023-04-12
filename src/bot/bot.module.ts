import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/Logger/logger.module';
import { WhatsappBot } from 'src/WwjsClient/proxy/server';
import { AIService } from './ai.service';
import { ChatsController } from './chat.controller';
import { DiscussionService } from './discussion.service';
import { GeneralController } from './general.controller';
import { GPTService } from './gpt.service';
import { ImagesController } from './images.controller';

@Module({
    imports: [LoggerModule.register({ name: "Bot Module" })],
    controllers: [GeneralController, ImagesController, ChatsController],
    providers: [
        WhatsappBot,
        GPTService,
        DiscussionService,
        AIService
    ],
})
export class BotModule { }
